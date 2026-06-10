import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Alert, ActivityIndicator, Platform, Dimensions, ToastAndroid,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, BounceIn, Layout,
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withSpring, withTiming, Easing, runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useScaleOnPress, useHapticTap } from '@/lib/premiumHooks';
import { supabase } from '@/lib/supabase';
import { syncUserData } from '@/lib/sync';
import {
  getFoodById, getFoodServings, getSavedMeals,
  logFoodToRecent, calculateMacros, saveMeal,
  type FoodEntry,
} from '@/lib/foodSearch';
import { getBrandEmoji } from '@/lib/restaurantSearch';

import { withErrorBoundary } from '@/utils/withErrorBoundary';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const GRAM_PRESETS = [50, 100, 200, 300];
const SERVING_PRESETS = [0.5, 1, 1.5, 2];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const C = theme.colors;

function getMealTypeByTime(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return 'breakfast';
  if (h >= 10 && h < 14) return 'lunch';
  if (h >= 14 && h < 18) return 'snack';
  if (h >= 18 && h < 22) return 'dinner';
  return 'snack';
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function showToast(msg: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert('', msg);
  }
}

function MacroRing({
  value, goal, label, color,
}: {
  value: number; goal: number | undefined; label: string; color: string;
}) {
  const progress = useSharedValue(0);
  const hasGoal = goal !== undefined && goal > 0;
  const pct = hasGoal ? Math.min(value / goal, 1) : 1;
  const size = 72;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circ * (1 - progress.value),
  }));

  return (
    <View style={{ alignItems: 'center', gap: 2, width: 84 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color + '1A'} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={circ}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: '800', color }}>{value}g</Text>
      <Text style={{ fontSize: 10, fontWeight: '600', color: C.text.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function DataSourceBadge({ food, isRestaurantFood }: { food: FoodEntry | null; isRestaurantFood: boolean }) {
  if (!food) return null;

  let label: string;
  let bgColor: string;
  let textColor: string;
  let icon: string;

  if (food.brand_name) {
    label = `${food.brand_name} — Verified Chain`;
    bgColor = '#F0EDFF';
    textColor = '#6C3BFF';
    icon = '🏪';
  } else if (food.source === 'bundled' || food.verified) {
    label = '✓ Verified Database';
    bgColor = '#E8F8E8';
    textColor = '#22C55E';
    icon = '';
  } else if (food.source === 'ai' || food.source === 'groq') {
    label = '🤖 AI Estimated';
    bgColor = '#E8F0FF';
    textColor = '#3B82F6';
    icon = '';
  } else {
    label = food.source === 'recent' ? 'Previous Entry' : 'User Entry';
    bgColor = '#F5F5F5';
    textColor = '#9CA3AF';
    icon = '';
  }

  return (
    <View style={[s.sourceBadge, { backgroundColor: bgColor }]}>
      {icon ? <Text style={{ fontSize: 12 }}>{icon}</Text> : null}
      <Text style={[s.sourceBadgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function ServingChips({
  food, servings, quantity, unit, isRestaurantFood,
  onSelect,
}: {
  food: FoodEntry; servings: any[]; quantity: number; unit: string; isRestaurantFood: boolean;
  onSelect: (grams: number, unit: 'g' | 'serving', label: string) => void;
}) {
  const sg = food.serving_grams || 100;

  // Parse natural unit name from serving_size, e.g. "1 roti (40g)" -> "roti"
  let naturalUnit = 'serving';
  const ss = food.serving_size || '';
  const unitMatch = ss.match(/^\d+\s+(\w+)/);
  if (unitMatch) {
    naturalUnit = unitMatch[1];
  }
  const pluralUnit = naturalUnit === 'serving' ? 'servings' : naturalUnit + 's';

  const chips = [
    { label: `1 ${naturalUnit} (${sg}g)`, grams: sg, servings: 1 },
    { label: `2 ${pluralUnit} (${sg * 2}g)`, grams: sg * 2, servings: 2 },
    { label: `3 ${pluralUnit} (${sg * 3}g)`, grams: sg * 3, servings: 3 },
  ];

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {chips.map((chip, i) => {
        const isActive = unit === 'g' && quantity === chip.grams;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(chip.grams, 'g', chip.label);
            }}
            style={[s.chip, isActive && s.chipActive]}
          >
            <Text style={[s.chipText, isActive && s.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(1, 'serving', 'custom');
        }}
        style={[s.chip, unit === 'serving' && s.chipActive]}
      >
        <Feather name="edit-2" size={12} color={unit === 'serving' ? '#FFF' : '#6C3BFF'} />
        <Text style={[s.chipText, unit === 'serving' && s.chipTextActive]}>  Custom</Text>
      </TouchableOpacity>
    </View>
  );
}

const FoodDetailModal = function FoodDetailModal() {
  const router = useRouter();
  const params = useLocalSearchParams<any>();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();
  const hapticTap = useHapticTap();

  const isRestaurantFood = !!(params.brandName || params.foodId === '0');

  const [food, setFood] = useState<FoodEntry | null>(null);
  const [servings, setServings] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(
    isRestaurantFood ? 1 : parseFloat(params.prefillGrams || '100')
  );
  const [unit, setUnit] = useState<'g' | 'serving'>(
    isRestaurantFood ? 'serving' : (params.prefillUnit === 'serving' ? 'serving' : 'g')
  );
  const [mealType, setMealType] = useState(params.mealType || getMealTypeByTime());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quickName, setQuickName] = useState('');
  const [quickCal, setQuickCal] = useState('');
  const [quickProt, setQuickProt] = useState('');
  const [quickCarb, setQuickCarb] = useState('');
  const [quickFat, setQuickFat] = useState('');
  const [nutriWarning, setNutriWarning] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);
  const [showMealSheet, setShowMealSheet] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [gramText, setGramText] = useState(
    String(Math.round(isRestaurantFood ? 1 : parseFloat(params.prefillGrams || '100')))
  );

  const isQuickAdd = params.quickAdd === 'true';
  const isSavedMeal = params.isSavedMeal === 'true';
  const createMeal = params.createMeal === 'true';
  const existingFoods = params.existingFoods || '';

  const saveAnim = useSharedValue(0);
  const saveBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(saveAnim.value ? 0.96 : 1) }],
    opacity: withTiming(saving ? 0.8 : 1, { duration: 200 }),
  }));
  const toastOpacity = useSharedValue(0);
  const toastStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ translateY: withSpring(toastOpacity.value > 0 ? 0 : -20) }],
  }));

  const showToastMsg = useCallback((msg: string) => {
    setToastMsg(msg);
    toastOpacity.value = withTiming(1, { duration: 200 });
    setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => setToastMsg(null), 300);
    }, 2000);
  }, [toastOpacity]);

  useEffect(() => {
    (async () => {
      try {
        if (isQuickAdd) { setLoading(false); return; }
        if (isSavedMeal && params.mealId) {
          const meals = await getSavedMeals(user?.id || '');
          const meal = meals.find((m: any) => m.id === parseInt(params.mealId));
          if (meal) {
            setQuickCal(String(Math.round(meal.total_calories)));
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
            setGramText(String(Math.round(f.serving_grams || 100)));
            const s = await getFoodServings(f.id);
            setServings(s);
          }
        } else if (params.foodName && params.recentCal) {
          let cal = parseFloat(params.recentCal);
          let prot = parseFloat(params.recentProt || '0');
          let carb = parseFloat(params.recentCarb || '0');
          let fat = parseFloat(params.recentFat || '0');
          let fiber = parseFloat(params.recentFiber || '0');
          const sg = parseFloat(params.recentServingGrams || '100');
          setFood({
            id: 0, canonical_name: params.foodName,
            brand_name: params.brandName || '', barcode: null, category: '', cuisine: '', verified: params.brandName ? 1 : 0,
            source: 'recent',
            calories_per_100g: cal,
            protein_per_100g: prot,
            carbs_per_100g: carb,
            fat_per_100g: fat,
            fiber_per_100g: fiber,
            sugar_per_100g: 0, sodium_per_100g: 0,
            serving_size: params.recentServingSize || '100g',
            serving_grams: sg,
            aliases: '', search_terms: '', display_name: params.foodName,
          });
          if (!isRestaurantFood) { setQuantity(parseFloat(params.prefillGrams || '100')); setGramText(params.prefillGrams || '100'); }
        }
      } catch (e) {
        console.warn('[food-detail] load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scaled = useMemo(() => {
    if (isQuickAdd || isSavedMeal) return null;
    if (!food) return null;
    const g = unit === 'serving' ? quantity * (food.serving_grams || 100) : quantity;
    return calculateMacros({
      calories: food.calories_per_100g, protein: food.protein_per_100g,
      carbs: food.carbs_per_100g, fat: food.fat_per_100g,
      fiber: food.fiber_per_100g || 0,
    }, g);
  }, [food, quantity, unit, isQuickAdd, isSavedMeal]);

  useEffect(() => {
    if (!scaled || isQuickAdd || isSavedMeal) { setNutriWarning(null); return; }
    const c = scaled.calories;
    const name = (food?.display_name || food?.canonical_name || '').toLowerCase();
    const isRestaurant = !!(food?.brand_name);
    if (c > 2000) {
      setNutriWarning(`\u26A0 ${c} kcal seems very high for a single item. Double-check the serving size.`);
    } else if (c < 20 && !name.includes('water') && !name.includes('tea') && !name.includes('coffee')) {
      setNutriWarning(`\u26A0 Only ${c} kcal? This seems low. Verify the amount.`);
    } else if (isRestaurant && c < 100 && !name.includes('drink') && !name.includes('soup') && !name.includes('salad')) {
      setNutriWarning(`\u26A0 ${c} kcal is quite low for a restaurant item. Confirm serving size.`);
    } else {
      setNutriWarning(null);
    }
  }, [scaled, food, isQuickAdd, isSavedMeal]);

  const handleFavourite = useCallback(() => {
    setIsFavourite(p => !p);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToastMsg(isFavourite ? 'Removed from favourites' : 'Saved to favourites');
  }, [isFavourite, showToastMsg]);

  const handleServingSelect = useCallback((grams: number, newUnit: 'g' | 'serving', _label: string) => {
    setQuantity(grams);
    setGramText(String(grams));
    setUnit(newUnit);
  }, []);

  const adjustQuantity = useCallback((delta: number) => {
    setQuantity(q => { const n = Math.max(1, q + delta); setGramText(String(Math.round(n))); return n; });
  }, []);

  const { animatedStyle: logBtnAnim, onPressIn: logIn, onPressOut: logOut } = useScaleOnPress();

  const handleLog = useCallback(async () => {
    if (!user?.id) { Alert.alert('Error', 'You must be logged in to log food.'); return; }
    saveAnim.value = withSpring(1);
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || user.id;
      const loggedAt = new Date().toISOString();

      if (isQuickAdd || isSavedMeal) {
        const cal = Math.max(0, parseFloat(quickCal) || 0);
        const prot = Math.max(0, parseFloat(quickProt) || 0);
        const carb = Math.max(0, parseFloat(quickCarb) || 0);
        const fat = Math.max(0, parseFloat(quickFat) || 0);
        const name = isSavedMeal ? (params.mealName || 'Saved Meal') : 'Quick Add';
        if (!createMeal) {
          await supabase.from('meal_logs').insert({
            user_id: userId, food_name: name,
            calories: cal, protein_g: prot, carbs_g: carb, fat_g: fat,
            meal_type: mealType, logged_at: loggedAt,
          });
        }
      } else if (food && scaled) {
        const grams = unit === 'serving' ? quantity * (food.serving_grams || 100) : quantity;
        const displayName = food.display_name || food.canonical_name;
        await supabase.from('meal_logs').insert({
          user_id: userId, food_name: displayName,
          calories: scaled.calories, protein_g: scaled.protein,
          carbs_g: scaled.carbs, fat_g: scaled.fat,
          fiber_g: scaled.fiber || 0, meal_type: mealType, logged_at: loggedAt,
        });
        await logFoodToRecent(
          userId, displayName, food.calories_per_100g,
          food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g,
          food.fiber_per_100g || 0, food.serving_size, food.serving_grams || 100,
          grams, unit, mealType, food.source,
        );
      }
      try { await syncUserData(userId); } catch (e) { console.warn('[food-detail] sync error:', e); }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (createMeal) {
        const foodName = isQuickAdd ? (quickName.trim() || 'Quick Add') : (food?.display_name || food?.canonical_name || 'Food');
        const cal = scaled?.calories || Math.max(0, parseFloat(quickCal) || 0);
        const prot = scaled?.protein || Math.max(0, parseFloat(quickProt) || 0);
        const carb = scaled?.carbs || Math.max(0, parseFloat(quickCarb) || 0);
        const fat = scaled?.fat || Math.max(0, parseFloat(quickFat) || 0);
        const fiber = scaled?.fiber || 0;
        const qty = isQuickAdd ? (cal > 0 ? Math.round(cal * 10) : 100) : (quantity || 100);
        const foodUnit = isQuickAdd ? 'g' : unit;
        const foodEntry = { foodName, quantity: qty, unit: foodUnit, calories: cal, protein: prot, carbs: carb, fat: fat, fiber };
        const existing = existingFoods ? (() => { try { return JSON.parse(existingFoods); } catch { return []; } })() : [];
        const allFoods = [...existing, foodEntry];
        const loggedFoods = JSON.stringify(allFoods);
        router.navigate({ pathname: '/modals/create-meal', params: { foods: loggedFoods } });
      } else {
        Alert.alert('Logged \u2713', `${Math.round(scaled?.calories || Math.max(0, parseFloat(quickCal) || 0))} kcal added to ${mealType}.`);
        if (router.canGoBack?.()) { router.back(); } else { router.navigate('/(tabs)/food'); }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not log food.');
    } finally {
      setSaving(false);
      saveAnim.value = withSpring(0);
    }
  }, [user, food, scaled, quantity, unit, mealType, isQuickAdd, isSavedMeal, quickCal, quickProt, quickCarb, quickFat, quickName, params.returnTo, params.mealName, createMeal, existingFoods]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.skeletonWrap}>
          <View style={s.skelHeader} />
          <View style={s.skelCard}>
            <View style={s.skelLineWide} />
            <View style={[s.skelLine, { width: 80, height: 24, marginTop: 8 }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
              {[1, 2, 3].map(i => <View key={i} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.border.solid }} />)}
            </View>
          </View>
          <View style={s.skelCard}>
            <View style={s.skelLine} />
            <View style={[s.skelLine, { width: '60%', marginTop: 8 }]} />
          </View>
          <View style={s.skelCard}>
            <View style={s.skelLine} />
            <View style={[s.skelLine, { width: '40%', marginTop: 8 }]} />
          </View>
        </View>
      </View>
    );
  }

  // ── Quick Add / Saved Meal mode ──
  if (isQuickAdd || isSavedMeal) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Feather name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isQuickAdd ? 'Quick Add' : params.mealName || 'Saved Meal'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 160 }}>
          <View style={s.quickHero}>
            <Text style={s.quickTitle}>{isQuickAdd ? 'Quick Add Calories' : 'Saved Meal'}</Text>
            <Text style={s.quickSub}>
              {isQuickAdd ? 'Enter calories for restaurant meals or unknown foods' : 'Log this meal combination'}
            </Text>
          </View>
          <View style={s.card}>
            {createMeal ? (
              <View style={s.quickField}>
                <Text style={[s.quickLabel, { color: C.primary }]}>Food Name</Text>
                <View style={s.quickInputWrap}>
                  <TextInput
                    style={s.quickInput}
                    value={quickName}
                    onChangeText={setQuickName}
                    placeholder="e.g. Grilled Chicken"
                    placeholderTextColor={C.text.muted}
                    autoFocus
                  />
                </View>
              </View>
            ) : null}
            {[
              { label: 'Calories', state: quickCal, set: setQuickCal, suffix: 'kcal', color: C.primary },
              { label: 'Protein', state: quickProt, set: setQuickProt, suffix: 'g', color: C.protein },
              { label: 'Carbs', state: quickCarb, set: setQuickCarb, suffix: 'g', color: C.carbs },
              { label: 'Fat', state: quickFat, set: setQuickFat, suffix: 'g', color: C.fat },
            ].map((field, i) => (
              <View key={field.label} style={s.quickField}>
                <Text style={[s.quickLabel, { color: field.color }]}>{field.label}</Text>
                <View style={s.quickInputWrap}>
                  <TextInput
                    style={s.quickInput}
                    value={field.state}
                    onChangeText={field.set}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={C.text.muted}
                  />
                  <Text style={s.quickSuffix}>{field.suffix}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={s.card}>
            <Text style={s.sectionTitle}>Log to</Text>
            <View style={s.mealRow}>
              {MEAL_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => { setMealType(type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[s.mealChip, mealType === type && s.mealChipActive]}
                >
                  <Text style={[s.mealChipText, mealType === type && s.mealChipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
        <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity onPress={handleLog} disabled={saving} activeOpacity={0.85} style={{ flex: 1 }}>
            <View style={s.logBtn}>
              <LinearGradient colors={['#6C3BFF', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.logBtnFill}>
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#FFF" />
                    <Text style={s.logBtnText}>
                      Log to {mealType.charAt(0).toUpperCase() + mealType.slice(1)} · {parseInt(quickCal) || 0} kcal
                    </Text>
                  </>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!food) {
    return (
      <View style={[s.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Feather name="alert-circle" size={36} color="#9CA3AF" />
        <Text style={{ marginTop: 8, fontSize: 15, fontWeight: '600', color: '#1F2937' }}>Food not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16, backgroundColor: '#6C3BFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = food.display_name || food.canonical_name || '';
  const goals = user?.goals;
  const sg = food.serving_grams || 100;
  const totalGrams = unit === 'serving' ? quantity * sg : quantity;
  const showServingMode = isRestaurantFood;
  const servingLabel = (food.serving_size || 'serving').replace(/^\d+\s+/, '').replace(/\s*\(.*?\)\s*$/, '').trim() || 'serving';

  const displayValues = {
    calories: scaled?.calories || 0,
    protein: scaled?.protein || 0,
    carbs: scaled?.carbs || 0,
    fat: scaled?.fat || 0,
    fiber: scaled?.fiber || 0,
    sugar: Math.round((food.sugar_per_100g || 0) * totalGrams / 100),
    sodium: Math.round((food.sodium_per_100g || 0) * totalGrams / 100),
    label: `Per ${totalGrams}g serving`,
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Toast */}
      {toastMsg ? (
        <Animated.View style={[s.toast, toastStyle]}>
          <Feather name="check-circle" size={14} color="#22C55E" />
          <Text style={s.toastText}>{toastMsg}</Text>
        </Animated.View>
      ) : null}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {titleCase(displayName)}
        </Text>
        <TouchableOpacity onPress={handleFavourite} style={s.saveBtn}>
          <Ionicons name={isFavourite ? 'heart' : 'heart-outline'} size={20} color={isFavourite ? '#6C3BFF' : '#9CA3AF'} />
          <Text style={[s.saveBtnText, { color: isFavourite ? '#6C3BFF' : '#9CA3AF' }]}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Data Source Badge */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <DataSourceBadge food={food} isRestaurantFood={isRestaurantFood} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 180 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Main Nutrition Card ── */}
        <View style={s.mainCard}>
          <Text style={s.foodName}>{titleCase(displayName)}</Text>

          <View style={s.calorieRow}>
            <Text style={s.calValue}>{displayValues.calories}</Text>
            <Text style={s.calUnit}>kcal</Text>
          </View>

          {/* Macro rings */}
          <View style={s.macroRingRow}>
            <MacroRing
              value={displayValues.protein}
              goal={goals?.protein}
              label="Protein"
              color="#EC4899"
            />
            <MacroRing
              value={displayValues.carbs}
              goal={goals?.carbs}
              label="Carbs"
              color="#F59E0B"
            />
            <MacroRing
              value={displayValues.fat}
              goal={goals?.fat}
              label="Fat"
              color="#3B82F6"
            />
          </View>

          {/* Goal context */}
          {goals?.protein || goals?.carbs || goals?.fat ? (
            <View style={s.goalRow}>
              {goals?.protein ? (
                <Text style={s.goalText}>
                  <Text style={{ color: '#EC4899', fontWeight: '700' }}>{displayValues.protein}g</Text>
                  <Text style={{ color: C.text.muted }}> / {goals.protein}g protein</Text>
                </Text>
              ) : null}
              {goals?.carbs ? (
                <Text style={s.goalText}>
                  <Text style={{ color: '#F59E0B', fontWeight: '700' }}>{displayValues.carbs}g</Text>
                  <Text style={{ color: C.text.muted }}> / {goals.carbs}g carbs</Text>
                </Text>
              ) : null}
              {goals?.fat ? (
                <Text style={s.goalText}>
                  <Text style={{ color: '#3B82F6', fontWeight: '700' }}>{displayValues.fat}g</Text>
                  <Text style={{ color: C.text.muted }}> / {goals.fat}g fat</Text>
                </Text>
              ) : null}
            </View>
          ) : null}

          {nutriWarning ? (
            <View style={s.warningBanner}>
              <Feather name="alert-triangle" size={13} color="#D97706" />
              <Text style={s.warningText}>{nutriWarning}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Serving Size Card ── */}
        <View style={s.card}>
          {showServingMode ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={s.sectionTitle}>Serving Size</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity
                    onPress={() => { setUnit('serving'); setQuantity(1); setGramText('1'); }}
                    style={[s.modeTab, unit === 'serving' && s.modeTabActive]}
                  >
                    <Text style={[s.modeTabText, unit === 'serving' && s.modeTabTextActive]}>{servingLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setUnit('g'); setQuantity(sg); setGramText(String(sg)); }}
                    style={[s.modeTab, unit === 'g' && s.modeTabActive]}
                  >
                    <Text style={[s.modeTabText, unit === 'g' && s.modeTabTextActive]}>Weight (g)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {unit === 'serving' && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, marginTop: 12 }}>
                  {[1, 2, 3].map(count => (
                    <TouchableOpacity
                      key={count}
                      onPress={() => { setQuantity(count); setGramText(String(count)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={[s.chip, quantity === count && s.chipActive]}
                    >
                      <Text style={[s.chipText, quantity === count && s.chipTextActive]}>
                        {count} {servingLabel}{count > 1 ? 's' : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {unit === 'g' && (
                <ServingChips
                  food={food}
                  servings={servings}
                  quantity={quantity}
                  unit={unit}
                  isRestaurantFood={isRestaurantFood}
                  onSelect={handleServingSelect}
                />
              )}

              <View style={s.customRow}>
                <View style={s.customInputWrap}>
                  <TextInput
                    style={s.customInput}
                    value={gramText}
                    onChangeText={(t) => { const n = parseFloat(t); if (!isNaN(n) && n >= 0) { setGramText(t); setQuantity(n); } else if (t === '') { setGramText(''); setQuantity(0); } }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <Text style={s.customUnit}>{unit === 'serving' ? servingLabel + (quantity > 1 ? 's' : '') : 'g'}</Text>
                </View>
                {unit === 'serving' && (
                  <Text style={s.customMeta}>{quantity} × {sg}g</Text>
                )}
              </View>

              <View style={s.adjustRow}>
                <TouchableOpacity onPress={() => adjustQuantity(-10)} style={s.adjustBtn}>
                  <Text style={s.adjustBtnText}>− 10g</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => adjustQuantity(-5)} style={s.adjustBtn}>
                  <Text style={s.adjustBtnText}>− 5g</Text>
                </TouchableOpacity>
                <Text style={s.adjustCurrent}>{Math.round(totalGrams)}g</Text>
                <TouchableOpacity onPress={() => adjustQuantity(5)} style={s.adjustBtn}>
                  <Text style={s.adjustBtnText}>+ 5g</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => adjustQuantity(10)} style={s.adjustBtn}>
                  <Text style={s.adjustBtnText}>+ 10g</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={s.sectionTitle}>Serving Size</Text>
              <View style={s.simpleGramRow}>
                <TextInput
                  style={s.simpleGramInput}
                  value={gramText}
                  onChangeText={(t) => { const n = parseFloat(t); if (!isNaN(n) && n >= 0) { setGramText(t); setQuantity(n); } else if (t === '') { setGramText(''); setQuantity(0); } }}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  placeholder="100"
                  placeholderTextColor="#AEAEB2"
                />
                <Text style={s.simpleGramUnit}>grams</Text>
              </View>
            </>
          )}
        </View>

        {/* ── Nutrition Facts Card (always visible) ── */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={s.sectionTitle}>Nutrition Facts</Text>
            <Text style={s.nutriRefLabel}>{displayValues.label}</Text>
          </View>

          <View style={s.nutriList}>
            <NutriRow label="Calories" value={`${displayValues.calories}`} unit="kcal" color="#1F2937" bold />
            <View style={s.nutriDivider} />
            <NutriRow label="Protein" value={`${displayValues.protein}`} unit="g" color="#EC4899" dot />
            <NutriRow label="Carbohydrates" value={`${displayValues.carbs}`} unit="g" color="#F59E0B" dot />
            <NutriRow label="  of which Sugars" value={displayValues.sugar ? `${displayValues.sugar}` : '—'} unit="g" color="#9CA3AF" small />
            <NutriRow label="Fat" value={`${displayValues.fat}`} unit="g" color="#3B82F6" dot />
            <NutriRow label="  of which Saturated" value="—" unit="g" color="#9CA3AF" small />
            <NutriRow label="Fiber" value={displayValues.fiber ? `${displayValues.fiber}` : '—'} unit="g" color="#22C55E" dot />
            <NutriRow label="Sodium" value={displayValues.sodium ? `${displayValues.sodium}` : '—'} unit="mg" color="#9CA3AF" dot />
          </View>
        </View>

        {/* ── Log to card ── */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Log to</Text>
          <View style={s.mealRow}>
            {MEAL_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => { setMealType(type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[s.mealChip, mealType === type && s.mealChipActive]}
              >
                <Text style={[s.mealChipText, mealType === type && s.mealChipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Log Button ── */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={() => { logIn(); handleLog(); }}
          onPressOut={logOut}
          disabled={saving}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <Animated.View style={[s.logBtn, logBtnAnim, saveBtnStyle]}>
            <LinearGradient colors={['#6C3BFF', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.logBtnFill}>
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFF" />
                  <Text style={s.logBtnText}>
                    Log to {mealType.charAt(0).toUpperCase() + mealType.slice(1)} · {scaled?.calories || 0} kcal
                  </Text>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function NutriRow({
  label, value, unit, color, bold, dot, small,
}: {
  label: string; value: string; unit: string; color: string; bold?: boolean; dot?: boolean; small?: boolean;
}) {
  return (
    <View style={s.nutriRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {dot ? <View style={[s.nutriDot, { backgroundColor: color }]} /> : null}
        <Text style={[s.nutriLabel, small && { fontSize: 12 }]}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
        <Text style={[s.nutriValue, { color }, bold && { fontSize: 20 }]}>{value}</Text>
        <Text style={s.nutriUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6FC' },

  // ── Toast ──
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20, zIndex: 100,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E8E8ED',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  toastText: {
    fontSize: 14, fontWeight: '600', color: '#1F2937',
  },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0EDFF',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '700', color: '#1F2937',
    textAlign: 'center', marginHorizontal: 8,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
    backgroundColor: '#F5F3FF',
  },
  saveBtnText: {
    fontSize: 13, fontWeight: '600',
  },

  // ── Data Source Badge ──
  sourceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginBottom: 4,
  },
  sourceBadgeText: {
    fontSize: 11, fontWeight: '600',
  },

  // ── Main Nutrition Card ──
  mainCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: '#F0EDFF',
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  foodName: {
    fontSize: 20, fontWeight: '800', color: '#1A1A2E',
  },
  calorieRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 8,
  },
  calValue: {
    fontSize: 48, fontWeight: '900', color: '#1A1A2E',
    letterSpacing: -2, fontVariant: ['tabular-nums'],
  },
  calUnit: {
    fontSize: 18, fontWeight: '600', color: '#AEAEB2',
  },
  macroRingRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 20, paddingHorizontal: 4,
  },
  goalRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginTop: 16, justifyContent: 'center',
  },
  goalText: {
    fontSize: 11, fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(217,119,6,0.1)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(217,119,6,0.2)',
  },
  warningText: {
    flex: 1, fontSize: 11, fontWeight: '600', color: '#D97706', lineHeight: 16,
  },

  // ── Generic Card ──
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: '#F0EDFF',
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#AEAEB2',
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  // ── Serving Chips ──
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#EBE5FF',
  },
  chipActive: {
    backgroundColor: '#6C3BFF', borderColor: '#6C3BFF',
  },
  chipText: {
    fontSize: 12, fontWeight: '700', color: '#6C3BFF',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },

  // ── Mode Tabs (serving / weight) ──
  modeTab: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#EBE5FF',
  },
  modeTabActive: {
    backgroundColor: '#6C3BFF', borderColor: '#6C3BFF',
  },
  modeTabText: {
    fontSize: 11, fontWeight: '700', color: '#6C3BFF',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },

  // ── Custom Input ──
  customRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4,
  },
  customInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F3FF', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1.5, borderColor: '#EBE5FF',
    width: 140,
  },
  customInput: {
    flex: 1, fontSize: 28, fontWeight: '800', color: '#1F2937',
    textAlign: 'center', paddingVertical: 8,
  },
  customUnit: {
    fontSize: 13, fontWeight: '600', color: '#AEAEB2', marginLeft: 4,
  },
  customMeta: {
    fontSize: 12, fontWeight: '500', color: '#AEAEB2',
  },

  // ── Simple Gram Input (non-restaurant) ──
  simpleGramRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
  },
  simpleGramInput: {
    fontSize: 32, fontWeight: '800', color: '#1F2937',
    backgroundColor: '#F5F3FF', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 10, textAlign: 'center',
    borderWidth: 1.5, borderColor: '#EBE5FF',
    width: 130,
  },
  simpleGramUnit: {
    fontSize: 16, fontWeight: '600', color: '#AEAEB2',
  },

  // ── Quick Adjust ──
  adjustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 14,
  },
  adjustBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#EBE5FF',
  },
  adjustBtnText: {
    fontSize: 13, fontWeight: '700', color: '#6C3BFF',
  },
  adjustCurrent: {
    fontSize: 15, fontWeight: '800', color: '#1F2937', minWidth: 44, textAlign: 'center',
  },

  // ── Nutrition Facts ──
  nutriList: {
    gap: 0,
  },
  nutriRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
  },
  nutriDivider: {
    height: 1, backgroundColor: '#F0EDFF', marginVertical: 2,
  },
  nutriDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  nutriLabel: {
    fontSize: 13, fontWeight: '500', color: '#6E6E73',
  },
  nutriValue: {
    fontSize: 15, fontWeight: '700',
  },
  nutriUnit: {
    fontSize: 11, fontWeight: '500', color: '#AEAEB2',
  },
  nutriRefLabel: {
    fontSize: 10, fontWeight: '600', color: '#AEAEB2',
  },

  // ── Meal Type Chips ──
  mealRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  mealChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#EBE5FF',
  },
  mealChipActive: { backgroundColor: '#6C3BFF', borderColor: '#6C3BFF' },
  mealChipText: { fontSize: 12, fontWeight: '600', color: '#6C3BFF' },
  mealChipTextActive: { color: '#FFFFFF' },

  // ── Quick Add ──
  quickHero: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: '#F0EDFF',
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 3,
  },
  quickTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  quickSub: { fontSize: 13, fontWeight: '500', color: '#6E6E73', marginTop: 4 },
  quickField: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  quickLabel: {
    width: 70, fontSize: 14, fontWeight: '700',
  },
  quickInputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F3FF', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#EBE5FF',
    paddingHorizontal: 14,
  },
  quickInput: {
    flex: 1, fontSize: 18, fontWeight: '700', color: '#1F2937',
    paddingVertical: 10, textAlign: 'right',
  },
  quickSuffix: { fontSize: 13, fontWeight: '600', color: '#AEAEB2', marginLeft: 4 },

  // ── Skeleton ──
  skeletonWrap: { flex: 1, padding: 20, gap: 16 },
  skelHeader: { height: 44, borderRadius: 14, backgroundColor: '#E8E8ED' },
  skelCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: '#F0EDFF',
  },
  skelLine: {
    height: 14, backgroundColor: '#F0EDFF', borderRadius: 7,
  },
  skelLineWide: {
    height: 18, width: '60%', backgroundColor: '#F0EDFF', borderRadius: 9,
  },

  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 10,
    backgroundColor: 'rgba(247,246,252,0.95)',
    borderTopWidth: 1, borderTopColor: '#F0EDFF',
  },
  logBtn: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#6C3BFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
  logBtnFill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, height: 56,
  },
  logBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});

export default withErrorBoundary(FoodDetailModal, 'Could not load food details');
