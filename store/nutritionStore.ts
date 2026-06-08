import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// FIX[3]: UI should be driven by DB rows; each row is a food log entry (meal_logs).
export interface FoodLogEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string;
  foodName: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  loggedAt: string;
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
