/**
 * NUTRITION SCREEN v5 — Premium AI Fueling Experience
 * Layout: NutritionHero → EnergyRing → MacroPerformance → AINutritionCard → MealTimeline → HydrationRecovery
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Platform, RefreshControl, ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { theme } from '@/constants/theme';
import { useNutritionStore, FoodLogEntry } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { syncUserData } from '@/lib/sync';
import { supabase } from '@/lib/supabase';
import { analyzeNutrition } from '@/lib/nutritionAnalyzer';
import { useToast } from '@/components/ui/ToastNotification';

import NutritionHero from '@/components/ui/NutritionHero';
import EnergyRingCard from '@/components/ui/EnergyRingCard';
import MacroPerformance from '@/components/ui/MacroPerformance';
import AINutritionCard from '@/components/ui/AINutritionCard';
import MealTimeline from '@/components/ui/MealTimeline';
import HydrationRecovery from '@/components/ui/HydrationRecovery';
import SectionHeader from '@/components/ui/SectionHeader';
import CalendarWidget from '@/components/ui/CalendarWidget';

export default function FoodScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  const {
    todayFoodLogs, calorieGoal, mealTypes,
    getTotalCalories, getTotalProtein, getTotalCarbs, getTotalFats,
    removeFoodLog, addMealType, removeMealType,
  } = useNutritionStore();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState(0);
  const { showToast } = useToast();

  // ── Date picker ──
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historyMeals, setHistoryMeals] = useState<any[] | null>(null);
  const isToday = useMemo(() => {
    const d = new Date();
    return selectedDate.getDate() === d.getDate() &&
      selectedDate.getMonth() === d.getMonth() &&
      selectedDate.getFullYear() === d.getFullYear();
  }, [selectedDate]);

  const fetchDateMeals = useCallback(async (date: Date) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    const { data } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', u.id)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: false });
    setHistoryMeals(data || []);
  }, []);

  const consumed = !isToday && historyMeals
    ? historyMeals.reduce((s, m) => s + (m.calories || 0), 0)
    : (getTotalCalories?.() || 0);
  const protein = !isToday && historyMeals
    ? historyMeals.reduce((s, m) => s + (m.protein_g || 0), 0)
    : (getTotalProtein?.() || 0);
  const carbs = !isToday && historyMeals
    ? historyMeals.reduce((s, m) => s + (m.carbs_g || 0), 0)
    : (getTotalCarbs?.() || 0);
  const fats = !isToday && historyMeals
    ? historyMeals.reduce((s, m) => s + (m.fat_g || 0), 0)
    : (getTotalFats?.() || 0);

  const proteinGoal = user?.goals?.protein ?? Math.round(calorieGoal * 0.3 / 4);
  const carbsGoal = user?.goals?.carbs ?? Math.round(calorieGoal * 0.4 / 4);
  const fatsGoal = user?.goals?.fat ?? Math.round(calorieGoal * 0.3 / 9);

  const handleAnalyzeNutrition = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const mealsForAnalysis = !isToday && historyMeals
        ? historyMeals.map((m: any) => ({
            name: m.food_name, calories: m.calories, protein_g: m.protein_g, carbs_g: m.carbs_g, fat_g: m.fat_g,
          }))
        : todayFoodLogs.map(l => ({
            name: l.foodName,
            calories: l.calories,
            protein_g: l.protein_g,
            carbs_g: l.carbs_g,
            fat_g: l.fat_g,
          }));
      const result = await analyzeNutrition({
        meals: mealsForAnalysis,
        totals: { calories: consumed, protein, carbs, fat: fats },
        goals: { calories: calorieGoal, protein: proteinGoal, carbs: carbsGoal, fat: fatsGoal, water: user?.goals?.water || 8 },
        userProfile: {
          name: user?.name || 'User',
          age: user?.health_profile?.age,
          weight: user?.health_profile?.weight,
          weightUnit: user?.health_profile?.weightUnit,
          conditions: user?.health_profile?.conditions || [],
          goal: user?.health_profile?.goal,
        },
      });
      setAnalysisResult(result);
    } catch (e: any) {
      showToast(e.message || 'Analysis failed', 'error');
    } finally {
      setAnalyzing(false);
    }
  }, [analyzing, todayFoodLogs, consumed, protein, carbs, fats, calorieGoal, proteinGoal, carbsGoal, fatsGoal, user, isToday, historyMeals]);

  const handleRemoveFood = useCallback(async (logId: string) => {
    if (removingId) return;
    setRemovingId(logId);
    try {
      const { error } = await supabase.from('meal_logs').delete().eq('id', logId);
      if (error) {
        console.error('[food] DB delete failed:', error);
        if (user?.id) await syncUserData(user.id);
        return;
      }
      removeFoodLog(logId);
    } catch (e) {
      console.error('[food] delete exception:', e);
      if (user?.id) await syncUserData(user.id);
    } finally {
      setRemovingId(null);
    }
  }, [removingId, removeFoodLog, user?.id]);

  const fetchWater = useCallback(async (date: Date) => {
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      const { data } = await supabase
        .from('water_logs')
        .select('glasses')
        .eq('user_id', u.id)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString());
      setWaterIntake(data?.reduce((s, r) => s + (r.glasses || 0), 0) ?? 0);
    } catch (e: any) { console.error('fetchWater:', e.message); }
  }, []);

  useEffect(() => {
    if (!isToday) {
      fetchDateMeals(selectedDate);
    } else {
      setHistoryMeals(null);
    }
    fetchWater(selectedDate);
  }, [selectedDate, isToday, fetchDateMeals, fetchWater]);

  const handleAddCustomMeal = () => {
    router.push('/modals/add-meal-type');
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) { syncUserData(user.id); fetchWater(selectedDate); }
    }, [user?.id, fetchWater, selectedDate])
  );

  const onRefresh = async () => {
    if (user?.id) {
      setRefreshing(true);
      await syncUserData(user.id);
      await fetchWater(selectedDate);
      setRefreshing(false);
    }
  };

  const remaining = calorieGoal - consumed;
  const progress = calorieGoal > 0 ? Math.min(consumed / calorieGoal, 1) : 0;

  const todayLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Macro performance data
  const macroData = useMemo(() => [
    {
      label: 'Protein',
      value: protein,
      target: proteinGoal,
      color: theme.colors.success,
      softColor: theme.colors.successSoft,
      gradient: [theme.colors.successSoft, '#FFFFFF'] as [string, string],
      icon: 'zap' as const,
      insight: protein >= proteinGoal ? `Recovery supported (${Math.round(protein / proteinGoal * 100)}%)` : protein >= proteinGoal * 0.7 ? `${Math.round(protein / proteinGoal * 100)}% — adequate intake` : `${Math.round(protein / proteinGoal * 100)}% — recovery limited`,
    },
    {
      label: 'Carbs',
      value: carbs,
      target: carbsGoal,
      color: theme.colors.warning,
      softColor: theme.colors.warningSoft,
      gradient: [theme.colors.warningSoft, '#FFFFFF'] as [string, string],
      icon: 'activity' as const,
      insight: carbs >= carbsGoal ? `Fuel optimized (${Math.round(carbs / carbsGoal * 100)}%)` : carbs >= carbsGoal * 0.7 ? `${Math.round(carbs / carbsGoal * 100)}% — moderate energy` : `${Math.round(carbs / carbsGoal * 100)}% — low energy`,
    },
    {
      label: 'Fat',
      value: fats,
      target: fatsGoal,
      color: theme.colors.primary,
      softColor: theme.colors.primarySoft,
      gradient: [theme.colors.primarySoft, '#FFFFFF'] as [string, string],
      icon: 'heart' as const,
      insight: fats >= fatsGoal ? `Hormonal support balanced (${Math.round(fats / fatsGoal * 100)}%)` : fats >= fatsGoal * 0.7 ? `${Math.round(fats / fatsGoal * 100)}% — adequate intake` : `${Math.round(fats / fatsGoal * 100)}% — increase healthy fats`,
    },
  ], [protein, proteinGoal, carbs, carbsGoal, fats, fatsGoal]);

  // Meal timeline data
  const sourceMeals: FoodLogEntry[] = !isToday && historyMeals
    ? historyMeals.map((m: any) => ({
        id: m.id,
        mealType: m.meal_type?.toLowerCase() || 'snack',
        foodName: m.food_name || '',
        calories: m.calories || 0,
        protein_g: m.protein_g || 0,
        carbs_g: m.carbs_g || 0,
        fat_g: m.fat_g || 0,
        loggedAt: m.logged_at || '',
      }))
    : todayFoodLogs;

  const mealCards = useMemo(() => mealTypes.map((meal) => ({
    id: meal.id,
    name: meal.name,
    icon: meal.icon as React.ComponentProps<typeof Feather>['name'],
    iconColor: meal.iconColor,
    pastel: meal.pastel,
    items: sourceMeals.filter(l => l.mealType?.toLowerCase() === meal.id.toLowerCase()).map(l => ({
      id: l.id,
      foodName: l.foodName,
      calories: l.calories || 0,
      protein_g: l.protein_g || 0,
      carbs_g: l.carbs_g || 0,
      fat_g: l.fat_g || 0,
      servingScale: (l as any).servingScale,
    })),
    onAddFood: () => router.push({ pathname: '/modals/log-food', params: { mealType: meal.id } }),
    onRemoveFood: handleRemoveFood,
    removingId,
  })), [mealTypes, sourceMeals, isToday, removingId, router, handleRemoveFood]);

  // AI message for hero
  const aiMessage = useMemo(() => {
    if (!isToday) {
      const totalCals = consumed;
      const dayStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (totalCals === 0) return `No meals logged on ${dayStr}.`;
      const pct = calorieGoal > 0 ? Math.round(totalCals / calorieGoal * 100) : 0;
      return `${dayStr}: ${totalCals} kcal (${pct}% of target).`;
    }
    const proteinPct = proteinGoal > 0 ? Math.round(protein / proteinGoal * 100) : 0;
    if (proteinPct < 50) return `Protein at ${proteinPct}% — may limit recovery tonight.`;
    if (consumed > calorieGoal * 0.85) return `Fueling looks well balanced today (${Math.round(consumed / calorieGoal * 100)}% of target).`;
    if (remaining > calorieGoal * 0.5) return `${Math.round(consumed / calorieGoal * 100)}% of calories — remember to fuel adequately for recovery.`;
    return 'Your nutrition is on track. Keep it up!';
  }, [protein, proteinGoal, consumed, calorieGoal, remaining, isToday, selectedDate]);

  return (
    <View style={s.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {/* SECTION 1 — IMMERSIVE HEADER */}
        <NutritionHero
          dateLabel={todayLabel}
          aiMessage={aiMessage}
        />

        {/* SECTION 1B — DATE PICKER */}
        <View style={s.calendarWrap}>
          <CalendarWidget
            selectedDate={selectedDate}
            onDayPress={(date) => setSelectedDate(date)}
            completedDates={new Set()}
          />
          {!isToday && (
            <TouchableOpacity
              onPress={() => setSelectedDate(new Date())}
              style={s.todayBtn}
            >
              <Feather name="calendar" size={14} color={theme.colors.primary} />
              <Text style={s.todayBtnText}>Back to Today</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SECTION 1C — QUICK SEARCH SHORTCUT */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/modals/food-search', params: { returnTo: 'food' } })}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            backgroundColor: theme.colors.surface, borderRadius: 16,
            padding: 16, marginHorizontal: 16, marginTop: 12,
            borderWidth: 1, borderColor: theme.colors.border.soft,
            ...theme.shadow.card,
          }}
          activeOpacity={0.7}
        >
          <View style={{
            width: 40, height: 40, borderRadius: 14,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Feather name="search" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.text.primary }}>
              Search Food Database
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.muted }}>
              1000+ foods · Manual log · Recent · Barcode
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>

        {/* SECTION 2 — DAILY ENERGY OVERVIEW */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <EnergyRingCard
            consumed={consumed}
            remaining={remaining}
            progress={progress}
            stats={[
              { icon: 'coffee', label: 'Eaten', value: `${consumed} kcal`, color: theme.colors.primary },
              { icon: 'droplet', label: 'Water', value: `${waterIntake} glasses`, color: '#60A5FA' },
              { icon: 'zap', label: 'Protein', value: `${Math.round(protein)}g`, color: theme.colors.success },
            ]}
          />
        </Animated.View>

        {/* SECTION 3 — MACRO PERFORMANCE */}
        <View style={{ marginTop: 24, marginBottom: 14 }}>
          <SectionHeader title="Macro Performance" />
        </View>
        <MacroPerformance macros={macroData} />

        {/* SECTION 4 — AI NUTRITION INSIGHT */}
        <View style={{ marginTop: 24, marginBottom: 14 }}>
          <SectionHeader
            title="AI Coach"
            icon="cpu"
            iconColor={theme.colors.primary}
          />
        </View>
        <AINutritionCard
          analyzing={analyzing}
          analysisResult={analysisResult}
          onAnalyze={handleAnalyzeNutrition}
          onDismiss={() => setAnalysisResult(null)}
          onGenerateMeal={() => router.push({ pathname: '/modals/log-food' })}
          onFixMacros={() => {}}
          onHighProtein={() => {}}
        />

        {/* SECTION 5 — DAILY MEALS */}
        <View style={{ marginTop: 28, marginBottom: 14 }}>
          <SectionHeader
            title="Daily Meals"
            action={{ label: 'Add custom', onPress: handleAddCustomMeal }}
          />
        </View>
        <MealTimeline meals={mealCards} />

        {/* SECTION 6 — HYDRATION + RECOVERY */}
        <View style={{ marginTop: 28, marginBottom: 14 }}>
          <SectionHeader title="Hydration" />
        </View>
        <HydrationRecovery
          current={waterIntake}
          goal={user?.goals?.water || 8}
          onAdd={isToday ? async () => {
            setWaterIntake((p) => p + 1);
            const Haptics = await import('expo-haptics');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            try {
              const { data: { user: u } } = await supabase.auth.getUser();
              if (u) await supabase.from('water_logs').insert({ user_id: u.id, glasses: 1, logged_at: new Date().toISOString() });
            } catch (e) { /* silent */ }
          } : () => {}}
        />

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0, paddingBottom: 100 },
  calendarWrap: {
    marginTop: -28,
    marginBottom: 48,
    paddingHorizontal: 0,
  },
  todayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10,
  },
  todayBtnText: {
    fontSize: 13, fontWeight: '700', color: theme.colors.primary,
  },
});
