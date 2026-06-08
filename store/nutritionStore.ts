import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scaleNutrition, type ServingUnit, type BaseNutrition } from '@/lib/nutritionScale';

const NUTRITION_CACHE_KEY = '@pulse_ai_nutrition_cache';

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
}

export interface MealCategory {
  id: string;
  name: string;
  icon: string;
  pastel: string;
  iconColor: string;
}

/**
 * Nutrition scaling fields stored alongside each food log entry.
 * Enables dynamic recalculation when the user changes serving size.
 */
export interface ServingScaleFields {
  /** Per-unit base values (e.g. per 100g, per serving, per can) */
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseFiber: number;
  baseSugar: number;
  baseSodium: number;
  /** The reference serving value these bases correspond to */
  baseServingValue: number;
  /** Unit of baseServingValue */
  baseServingUnit: ServingUnit;
  /** Human-readable base serving description */
  baseServingLabel: string;
  /** Current scaled serving quantity */
  servingQuantity: number;
  /** Current serving unit */
  servingUnit: ServingUnit;
}

// FIX[3]: UI should be driven by DB rows; each row is a food log entry (meal_logs).
export interface FoodLogEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_g?: number;
  loggedAt: string;
  /** Dynamic serving scale fields — present for all new entries */
  servingScale?: ServingScaleFields;
}

interface NutritionState {
  // FIX[3]: Store today's entries; never rely on optimistic-only UI.
  todayFoodLogs: FoodLogEntry[];
  calorieGoal: number;
  mealTypes: MealCategory[];

  addFoodLog: (entry: FoodLogEntry) => void;
  removeFoodLog: (id: string) => void;
  setFoodLogs: (entries: FoodLogEntry[]) => void;
  setCalorieGoal: (goal: number) => void;
  clearToday: () => void;
  addMealType: (category: MealCategory) => void;
  removeMealType: (id: string) => void;

  /**
   * Update serving size for a logged food entry.
   * Recalculates all macros using the centralized scaling engine.
   */
  updateFoodServing: (id: string, quantity: number, unit: ServingUnit) => void;

  // Computed helpers
  getTotalCalories: () => number;
  getTotalProtein: () => number;
  getTotalCarbs: () => number;
  getTotalFats: () => number;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  todayFoodLogs: [],
  calorieGoal: 1800,
  mealTypes: [
    { id: 'breakfast', name: 'Breakfast', icon: 'coffee', pastel: '#F5F3FF', iconColor: '#8B5CF6' },
    { id: 'lunch',     name: 'Lunch',     icon: 'sun',    pastel: '#F0F9FF', iconColor: '#0EA5E9' },
    { id: 'dinner',    name: 'Dinner',    icon: 'moon',   pastel: '#FDF2F8', iconColor: '#DB2777' },
    { id: 'snack',     name: 'Snacks',    icon: 'zap',    pastel: '#FEF3C7', iconColor: '#D97706' },
  ],

  addFoodLog: (entry) =>
    set((state) => ({ todayFoodLogs: [entry, ...state.todayFoodLogs] })),

  removeFoodLog: (id) =>
    set((state) => ({
      todayFoodLogs: state.todayFoodLogs.filter((m) => m.id !== id),
    })),

  updateFoodServing: (id, quantity, unit) =>
    set((state) => {
      const updated = state.todayFoodLogs.map((entry) => {
        if (entry.id !== id || !entry.servingScale) return entry;

        const { servingScale } = entry;
        const base: BaseNutrition = {
          baseServingValue: servingScale.baseServingValue,
          baseServingUnit: servingScale.baseServingUnit,
          baseServingLabel: servingScale.baseServingLabel,
          calories: servingScale.baseCalories,
          protein_g: servingScale.baseProtein,
          carbs_g: servingScale.baseCarbs,
          fats_g: servingScale.baseFat,
          fiber_g: servingScale.baseFiber,
          sugar_g: servingScale.baseSugar,
          sodium_g: servingScale.baseSodium,
        };

        const scaled = scaleNutrition({ base, quantity, unit });

        return {
          ...entry,
          calories: scaled.calories,
          protein_g: scaled.protein_g,
          carbs_g: scaled.carbs_g,
          fat_g: scaled.fats_g,
          fiber_g: scaled.fiber_g,
          sugar_g: scaled.sugar_g,
          sodium_g: scaled.sodium_g,
          servingScale: {
            ...servingScale,
            servingQuantity: quantity,
            servingUnit: unit,
          },
        };
      });
      return { todayFoodLogs: updated };
    }),

  setFoodLogs: (todayFoodLogs) => set({ todayFoodLogs }),
  setCalorieGoal: (calorieGoal) => set({ calorieGoal }),
  clearToday: () => set({ todayFoodLogs: [] }),
  addMealType: (category) =>
    set((state) => ({ mealTypes: [...state.mealTypes, category] })),
  removeMealType: (id) =>
    set((state) => ({ mealTypes: state.mealTypes.filter(m => m.id !== id) })),

  getTotalCalories: () =>
    get().todayFoodLogs.reduce((sum, m) => sum + (m.calories || 0), 0),
  getTotalProtein: () =>
    get().todayFoodLogs.reduce((sum, m) => sum + (m.protein_g || 0), 0),
  getTotalCarbs: () =>
    get().todayFoodLogs.reduce((sum, m) => sum + (m.carbs_g || 0), 0),
  getTotalFats: () =>
    get().todayFoodLogs.reduce((sum, m) => sum + (m.fat_g || 0), 0),
}));

// ── Persist to AsyncStorage on changes (debounced 500ms) ──
let persistTimer: ReturnType<typeof setTimeout> | null = null;
useNutritionStore.subscribe((state) => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    AsyncStorage.setItem(NUTRITION_CACHE_KEY, JSON.stringify({
      todayFoodLogs: state.todayFoodLogs,
      calorieGoal: state.calorieGoal,
      mealTypes: state.mealTypes,
    })).catch(() => {});
  }, 500);
});

// ── Hydrate from AsyncStorage on load ──
export async function hydrateNutritionCache(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(NUTRITION_CACHE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      useNutritionStore.setState({
        todayFoodLogs: parsed.todayFoodLogs || [],
        calorieGoal: parsed.calorieGoal ?? 1800,
        mealTypes: parsed.mealTypes || [],
      });
    }
  } catch {}
}
