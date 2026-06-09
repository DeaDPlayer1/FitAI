import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import {
  getFoodById, getFoodServings, getSavedMeals,
  logFoodToRecent, calculateMacros, saveMeal,
  type FoodEntry,
} from '@/lib/foodSearch';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const QUICK_PRESETS = [0.5, 1, 1.5, 2];
const GRAM_PRESETS = [50, 100, 200, 300];

const C = {
  bg: '#F8F7FF', surface: '#FFFFFF', primary: '#6C3CE1',
  text: '#1A1A2E', muted: '#9CA3AF', border: '#F0EDFF',
  inputBg: '#F5F3FF', cal: '#F97316', prot: '#EC4899',
  carb: '#F59E0B', fat: '#3B82F6',
};

export default function FoodDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    foodId?: string; foodName?: string; mealId?: string; mealName?: string;
    isSavedMeal?: string; quickAdd?: string; mealType?: string;
    returnTo?: string; prefillGrams?: string; prefillUnit?: string;
  }>();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();

  const [food, setFood] = useState<FoodEntry | null>(null);
  const [servings, setServings] = useState<{ serving_name: string; grams: number | null; ml: number | null; household_measure: number }[]>([]);
  const [quantity, setQuantity] = useState(parseFloat(params.prefillGrams || '100'));
  const [unit, setUnit] = useState<'g' | 'serving'>(params.prefillUnit === 'serving' ? 'serving' : 'g');
  const [mealType, setMealType] = useState(params.mealType || getMealTypeByTime());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quickCal, setQuickCal] = useState('');
  const [quickProt, setQuickProt] = useState('');
  const [quickCarb, setQuickCarb] = useState('');
  const [quickFat, setQuickFat] = useState('');

  const isQuickAdd = params.quickAdd === 'true';
  const isSavedMeal = params.isSavedMeal === 'true';

  useEffect(() => {
    (async () => {
      if (isQuickAdd) { setLoading(false); return; }
      if (isSavedMeal && params.mealId) {
        const meals = await getSavedMeals(user?.id || '');
        const meal = meals.find(m => m.id === parseInt(params.mealId!));
        if (meal) {
          const totalCal = meal.total_calories;
          // Show first food name + total macros
          setQuickCal(String(Math.round(totalCal)));
          setQuickProt(String(Math.round(meal.total_protein)));
          setQuickCarb(String(Math.round(meal.total_carbs)));
          setQuickFat(String(Math.round(meal.total_fat)));
        }
        setLoading(false);
        return;
      }
      if (params.foodId && params.foodId !== '0') {
        const f = await getFoodById(parseInt(params.foodId));
        if (f) {
          setFood(f);
          setQuantity(f.serving_grams || 100);
          const s = await getFoodServings(f.id);
          setServings(s);
        }
      }
      setLoading(false);
    })();
  }, []);

  const scaled = useMemo(() => {
    if (isQuickAdd || isSavedMeal) return null;
    if (!food) return null;
    const g = unit === 'serving' ? quantity * (food.serving_grams || 100) : quantity;
    return calculateMacros({
      calories: food.calories_per_100g,
      protein: food.protein_per_100g,
      carbs: food.carbs_per_100g,
      fat: food.fat_per_100g,
      fiber: food.fiber_per_100g || 0,
    }, g);
  }, [food, quantity, unit, isQuickAdd, isSavedMeal]);

  const handleLog = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to log food.');
      return;
    }
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || user.id;
      const loggedAt = new Date().toISOString();

      if (isQuickAdd || isSavedMeal) {
        const cal = parseInt(quickCal) || 0;
        const prot = parseFloat(quickProt) || 0;
        const carb = parseFloat(quickCarb) || 0;
        const fat = parseFloat(quickFat) || 0;
        const name = isSavedMeal ? (params.mealName || 'Saved Meal') : 'Quick Add';

        await supabase.from('meal_logs').insert({
          user_id: userId, food_name: name,
          calories: cal, protein_g: prot, carbs_g: carb, fat_g: fat,
          meal_type: mealType, logged_at: loggedAt,
        });
      } else if (food && scaled) {
        const grams = unit === 'serving' ? quantity * (food.serving_grams || 100) : quantity;
        await supabase.from('meal_logs').insert({
          user_id: userId, food_name: food.canonical_name,
          calories: scaled.calories, protein_g: scaled.protein,
          carbs_g: scaled.carbs, fat_g: scaled.fat,
          fiber_g: scaled.fiber || 0, meal_type: mealType,
          logged_at: loggedAt,
        });
        await logFoodToRecent(
          userId, food.canonical_name,
          food.calories_per_100g, food.protein_per_100g,
          food.carbs_per_100g, food.fat_per_100g,
          food.fiber_per_100g || 0, food.serving_size,
          food.serving_grams || 100, grams, unit, mealType, food.source
        );
      }

      await syncUserData(userId);
      Alert.alert('Logged ✓', `${Math.round(scaled?.calories || parseInt(quickCal) || 0)} kcal added to ${mealType}.`);

      if (params.returnTo === 'log-food') {
        router.back();
      } else if (params.returnTo === 'food') {
        router.back();
      } else {
        router.back();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not log food.');
    } finally {
      setSaving(false);
    }
  }, [user, food, scaled, quantity, unit, mealType, isQuickAdd, isSavedMeal, quickCal, quickProt, quickCarb, quickFat, params.returnTo, params.mealName]);

  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {isQuickAdd ? 'Quick Add' : isSavedMeal ? params.mealName || 'Saved Meal' : params.foodName || 'Food'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {(isQuickAdd || isSavedMeal) ? (
          <Animated.View entering={FadeInDown}>
            <View style={s.quickCard}>
              <Text style={s.quickTitle}>
                {isQuickAdd ? 'Quick Add Calories' : 'Saved Meal'}
              </Text>
              <Text style={s.quickSub}>
                {isQuickAdd ? 'Enter calories for restaurant meals or unknown foods' : 'Log this meal as-is'}
              </Text>

              <View style={s.quickInputRow}>
                <Text style={s.quickInputLabel}>Calories</Text>
                <TextInput
                  style={s.quickInput}
                  value={quickCal}
                  onChangeText={setQuickCal}
                  keyboardType="number-pad"
                  placeholder="kcal"
                  placeholderTextColor={C.muted}
                />
              </View>
              <View style={s.quickInputRow}>
                <Text style={s.quickInputLabel}>Protein (g)</Text>
                <TextInput
                  style={s.quickInput}
                  value={quickProt}
                  onChangeText={setQuickProt}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={C.muted}
                />
              </View>
              <View style={s.quickInputRow}>
                <Text style={s.quickInputLabel}>Carbs (g)</Text>
                <TextInput
                  style={s.quickInput}
                  value={quickCarb}
                  onChangeText={setQuickCarb}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={C.muted}
                />
              </View>
              <View style={s.quickInputRow}>
                <Text style={s.quickInputLabel}>Fat (g)</Text>
                <TextInput
                  style={s.quickInput}
                  value={quickFat}
                  onChangeText={setQuickFat}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={C.muted}
                />
              </View>
            </View>
          </Animated.View>
        ) : food ? (
          <>
            <Animated.View entering={FadeInDown} style={s.nutritionHero}>
              <View style={s.calorieRow}>
                <Text style={s.calValue}>{scaled?.calories || 0}</Text>
                <Text style={s.calUnit}>kcal</Text>
              </View>
              <View style={s.macroRow}>
                <MacroChip label="P" value={`${scaled?.protein || 0}g`} color={C.prot} />
                <MacroChip label="C" value={`${scaled?.carbs || 0}g`} color={C.carb} />
                <MacroChip label="F" value={`${scaled?.fat || 0}g`} color={C.fat} />
              </View>
              <View style={s.per100Row}>
                <Text style={s.per100Text}>
                  Per 100g: {Math.round(food.calories_per_100g)} kcal · P{food.protein_per_100g} · C{food.carbs_per_100g} · F{food.fat_per_100g}
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80)} style={s.servingCard}>
              <Text style={s.sectionTitle}>Serving Size</Text>

              {servings.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.servingChips}>
                  {servings.map((sv, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[s.servingChip, quantity === (sv.grams || 100) && unit === 'g' && s.servingChipActive]}
                      onPress={() => { setQuantity(sv.grams || 100); setUnit('g'); }}
                    >
                      <Text style={[s.servingChipText, quantity === (sv.grams || 100) && unit === 'g' && s.servingChipTextActive]}>
                        {sv.serving_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={s.gramPresets}>
                {GRAM_PRESETS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[s.gramChip, quantity === g && unit === 'g' && s.gramChipActive]}
                    onPress={() => { setQuantity(g); setUnit('g'); }}
                  >
                    <Text style={[s.gramChipText, quantity === g && unit === 'g' && s.gramChipTextActive]}>{g}g</Text>
                  </TouchableOpacity>
                ))}
                {QUICK_PRESETS.map(m => (
                  <TouchableOpacity
                    key={`m${m}`}
                    style={[s.gramChip, quantity === m && unit === 'serving' && s.gramChipActive]}
                    onPress={() => { setQuantity(m); setUnit('serving'); }}
                  >
                    <Text style={[s.gramChipText, quantity === m && unit === 'serving' && s.gramChipTextActive]}>{m} sv</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.quantityRow}>
                <Text style={s.quantityLabel}>Custom:</Text>
                <TextInput
                  style={s.quantityInput}
                  value={String(Math.round(quantity))}
                  onChangeText={(t) => {
                    const v = parseFloat(t) || 0;
                    setQuantity(Math.max(0, v));
                  }}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={s.unitToggle}
                  onPress={() => setUnit(prev => prev === 'g' ? 'serving' : 'g')}
                >
                  <Text style={s.unitToggleText}>{unit}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120)} style={s.detailCard}>
              <Text style={s.sectionTitle}>Nutrition Facts per {unit === 'serving' ? `serving (${food.serving_grams}g)` : `${quantity}g`}</Text>
              <View style={s.nutriGrid}>
                <NutriRow label="Calories" value={`${scaled?.calories || 0}`} unit="kcal" color={C.cal} />
                <NutriRow label="Protein" value={`${scaled?.protein || 0}`} unit="g" color={C.prot} />
                <NutriRow label="Carbs" value={`${scaled?.carbs || 0}`} unit="g" color={C.carb} />
                <NutriRow label="Fat" value={`${scaled?.fat || 0}`} unit="g" color={C.fat} />
                <NutriRow label="Fiber" value={`${scaled?.fiber || 0}`} unit="g" color="#10B981" />
              </View>
            </Animated.View>
          </>
        ) : null}

        <Animated.View entering={FadeInDown.delay(160)} style={s.mealSelector}>
          <Text style={s.sectionTitle}>Log to</Text>
          <View style={s.mealRow}>
            {MEAL_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[s.mealChip, mealType === type && s.mealChipActive]}
                onPress={() => setMealType(type)}
              >
                <Text style={[s.mealChipText, mealType === type && s.mealChipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={s.logBtn}
          onPress={handleLog}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.primary, '#4F28B8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.logBtnGrad}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Feather name="check" size={18} color="#FFF" />
                <Text style={s.logBtnText}>
                  Log {scaled?.calories || parseInt(quickCal) || 0} kcal
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: color + '18', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color }}>{value}</Text>
    </View>
  );
}

function NutriRow({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color }}>{value}</Text>
        <Text style={{ fontSize: 12, fontWeight: '500', color: C.muted }}>{unit}</Text>
      </View>
    </View>
  );
}

function getMealTypeByTime(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'snack';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
    backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, textAlign: 'center' },

  nutritionHero: {
    backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  calorieRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  calValue: { fontSize: 48, fontWeight: '900', color: C.text, fontVariant: ['tabular-nums'] },
  calUnit: { fontSize: 18, fontWeight: '600', color: C.muted },
  macroRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  per100Row: { marginTop: 10 },
  per100Text: { fontSize: 11, fontWeight: '500', color: C.muted },

  servingCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: C.muted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  servingChips: { marginBottom: 12 },
  servingChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
    marginRight: 8,
  },
  servingChipActive: {
    backgroundColor: C.primary, borderColor: C.primary,
  },
  servingChipText: { fontSize: 13, fontWeight: '600', color: C.text },
  servingChipTextActive: { color: '#FFF' },
  gramPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  gramChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
  },
  gramChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  gramChipText: { fontSize: 13, fontWeight: '700', color: C.text },
  gramChipTextActive: { color: '#FFF' },
  quantityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  quantityLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  quantityInput: {
    flex: 1, fontSize: 24, fontWeight: '800', color: C.text,
    backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 8, textAlign: 'center',
    borderWidth: 1.5, borderColor: C.inputBg,
  },
  unitToggle: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: C.primary,
  },
  unitToggleText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  detailCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  nutriGrid: { gap: 0 },

  mealSelector: {
    backgroundColor: C.surface, borderRadius: 20, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
  },
  mealRow: { flexDirection: 'row', gap: 8 },
  mealChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.border,
  },
  mealChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  mealChipText: { fontSize: 13, fontWeight: '600', color: C.text },
  mealChipTextActive: { color: '#FFF' },

  quickCard: {
    backgroundColor: C.surface, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.border,
  },
  quickTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  quickSub: { fontSize: 13, fontWeight: '500', color: C.muted, marginTop: 4, marginBottom: 20 },
  quickInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  quickInputLabel: { width: 80, fontSize: 14, fontWeight: '600', color: C.text },
  quickInput: {
    flex: 1, fontSize: 18, fontWeight: '700', color: C.text,
    backgroundColor: C.inputBg, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1.5, borderColor: C.inputBg,
    textAlign: 'right',
  },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  logBtn: { borderRadius: 16, overflow: 'hidden' },
  logBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  logBtnText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
