/**
 * FOOD / NUTRITION TAB — Premium Lavender Wellness Rewrite
 * Redesigned to match the Scandinavian minimal luxury aesthetic.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  Layout,
} from 'react-native-reanimated';

import { theme } from '@/constants/theme';
import { useNutritionStore } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { syncUserData } from '@/lib/sync';
import { supabase } from '@/lib/supabase';
import { analyzeNutrition } from '@/lib/nutritionAnalyzer';
import { useToast } from '@/components/ui/ToastNotification';
import ProgressRing from '@/components/ui/ProgressRing';

// Dynamic meals loaded from store

export default function FoodScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  const {
    todayFoodLogs, calorieGoal, mealTypes,
    getTotalCalories, getTotalProtein, getTotalCarbs, getTotalFats,
    removeFoodLog, addMealType, removeMealType
  } = useNutritionStore();

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleAnalyzeNutrition = useCallback(async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeNutrition({
        meals: todayFoodLogs.map(l => ({
          name: l.foodName,
          calories: l.calories,
          protein_g: l.protein_g,
          carbs_g: l.carbs_g,
          fat_g: l.fat_g,
        })),
        totals: { calories: consumed, protein, carbs, fats },
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
  }, [analyzing, todayFoodLogs, consumed, protein, carbs, fats, calorieGoal, proteinGoal, carbsGoal, fatsGoal, user]);

  const handleRemoveFood = useCallback(async (logId: string) => {
    if (removingId) return;
    setRemovingId(logId);
    // Optimistic: remove from store immediately
    removeFoodLog(logId);
    try {
      const { error } = await supabase.from('meal_logs').delete().eq('id', logId);
      if (error) {
        console.error('[food] DB delete failed, will re-sync:', error);
        if (user?.id) syncUserData(user.id);
      }
    } catch (e) {
      console.error('[food] delete exception:', e);
      if (user?.id) syncUserData(user.id);
    } finally {
      setRemovingId(null);
    }
  }, [removingId, removeFoodLog, user?.id]);

  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);

  const handleAddCustomMeal = () => {
    // We could use an Alert.prompt on iOS, but it's not supported on Android perfectly.
    // Let's navigate to a simple modal or use a prompt
    router.push('/modals/add-meal-type');
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) syncUserData(user.id);
    }, [user?.id])
  );

  const onRefresh = async () => {
    if (user?.id) {
      setRefreshing(true);
      await syncUserData(user.id);
      setRefreshing(false);
    }
  };

  const consumed   = getTotalCalories?.() || 0;
  const protein    = getTotalProtein?.()  || 0;
  const carbs      = getTotalCarbs?.()    || 0;
  const fats       = getTotalFats?.()     || 0;

  const proteinGoal = user?.goals?.protein ?? Math.round(calorieGoal * 0.3 / 4);
  const carbsGoal   = user?.goals?.carbs ?? Math.round(calorieGoal * 0.4 / 4);
  const fatsGoal    = user?.goals?.fat ?? Math.round(calorieGoal * 0.3 / 9);

  const remaining = Math.max(0, calorieGoal - consumed);
  const progress  = calorieGoal > 0 ? Math.min(consumed / calorieGoal, 1) : 0;
  const [animatedProgress, setAnimatedProgress] = useState(0);

  const burnedEstimate = user?.health_profile?.weight ? Math.round(user.health_profile.weight * 0.6 * 30) : 420;
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  React.useEffect(() => {
    const start = animatedProgress;
    const end = progress;
    const duration = 600;
    const startTime = Date.now();
    let cancelled = false;

    const timer = setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setAnimatedProgress(start + (end - start) * eased);
      if (t >= 1) clearInterval(timer);
    }, 16);

    return () => { cancelled = true; clearInterval(timer); };
  }, [progress]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.accent.primary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.header}>
          <View>
            <Text style={s.headerGreeting}>Nutrition</Text>
            <Text style={s.headerDate}>{todayLabel}</Text>
          </View>
          <TouchableOpacity style={s.datePill} activeOpacity={0.8}>
            <Feather name="calendar" size={14} color={theme.colors.text.muted} />
            <Text style={s.datePillText}>Today</Text>
            <Feather name="chevron-down" size={14} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </Animated.View>

        {/* Calorie Ring Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={s.calorieCard}>
          <View style={s.ringWrap}>
            <ProgressRing
              size={170}
              strokeWidth={14}
              progress={animatedProgress}
              color={theme.colors.accent.primary}
              label={String(remaining)}
              labelStyle={s.ringLabel}
            />
            <Text style={s.ringSubLabel}>kcal left</Text>
          </View>

          <View style={s.vDivider} />

          <View style={s.calorieStats}>
            <View style={s.calorieStat}>
              <Text style={s.calorieStatLabel}>EATEN</Text>
              <Text style={s.calorieStatValue}>{consumed}</Text>
              <Text style={s.calorieStatUnit}>kcal</Text>
            </View>
            <View style={s.hDivider} />
            <View style={s.calorieStat}>
              <Text style={s.calorieStatLabel}>BURNED</Text>
              <Text style={s.calorieStatValue}>{burnedEstimate}</Text>
              <Text style={s.calorieStatUnit}>kcal</Text>
            </View>
          </View>
        </Animated.View>

        {/* Macro Row */}
        <Animated.View entering={FadeInDown.delay(200)} style={s.macroRow}>
          <MacroPill label="Protein" current={protein} goal={proteinGoal} color={theme.colors.accent.primary} trackColor="#F5F3FF" />
          <MacroPill label="Carbs"   current={carbs}   goal={carbsGoal}   color="#0EA5E9" trackColor="#F0F9FF" />
          <MacroPill label="Fat"     current={fats}     goal={fatsGoal}     color="#DB2777" trackColor="#FDF2F8" />
        </Animated.View>

        {/* Water Intake */}
        <Animated.View entering={FadeInDown.delay(300)} style={s.waterCard}>
          <Feather name="droplet" size={18} color="#3B82F6" />
          <Text style={s.waterText}>Water: {user?.goals?.water || 8} glasses goal</Text>
        </Animated.View>

        {/* AI Nutrition Analysis */}
        <Animated.View entering={FadeInDown.delay(400)} style={s.analyzeSection}>
          <TouchableOpacity
            style={[s.analyzeBtn, analyzing && s.analyzeBtnDisabled]}
            onPress={handleAnalyzeNutrition}
            disabled={analyzing}
            activeOpacity={0.85}
          >
            {analyzing ? (
              <View style={s.analyzingRow}>
                <ActivityIndicator size="small" color={theme.colors.accent.primary} />
                <Text style={s.analyzeBtnText}>Pulse AI is analyzing...</Text>
              </View>
            ) : (
              <View style={s.analyzingRow}>
                <Feather name="cpu" size={18} color="white" />
                <Text style={s.analyzeBtnText}>Analyze by AI</Text>
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {analysisResult && (
          <Animated.View entering={FadeInDown.delay(200)} style={s.analysisCard}>
            <View style={s.analysisHeader}>
              <View style={s.analysisAvatar}>
                <Feather name="cpu" size={16} color="white" />
              </View>
              <View style={s.analysisTitleGroup}>
                <Text style={s.analysisTitle}>Pulse AI Analysis</Text>
                <Text style={s.analysisSub}>Nutrition review</Text>
              </View>
              <TouchableOpacity
                onPress={() => setAnalysisResult(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={18} color={theme.colors.text.muted} />
              </TouchableOpacity>
            </View>
            <Text style={s.analysisBody}>{analysisResult}</Text>
          </Animated.View>
        )}

        {/* Meals Section */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Daily Meals</Text>
        </View>

        {useMemo(() => mealTypes.map((meal, idx) => {
          const logs    = todayFoodLogs.filter(l => l.mealType?.toLowerCase() === meal.id.toLowerCase());
          const mealCal = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
          const isOpen  = expandedMeal === meal.id;

          return (
            <Animated.View
              key={meal.id}
              entering={FadeInDown.delay(300 + idx * 80)}
              style={s.mealCard}
              layout={Layout.springify()}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedMeal(isOpen ? null : meal.id)}
                style={s.mealRow}
              >
                <View style={[s.mealIcon, { backgroundColor: meal.pastel }]}>
                  <Feather name={meal.icon as any} size={20} color={meal.iconColor} />
                </View>

                <View style={s.mealMeta}>
                  <Text style={s.mealName}>{meal.name}</Text>
                  <Text style={s.mealItems}>
                    {logs.length > 0 ? `${logs.length} item${logs.length > 1 ? 's' : ''}` : 'Log meal'}
                  </Text>
                </View>

                <View style={s.mealRight}>
                  <Text style={s.mealCal}>{mealCal > 0 ? `${mealCal}` : '—'}</Text>
                  {mealCal > 0 && <Text style={s.mealCalUnit}>kcal</Text>}
                </View>

                <Feather
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.colors.text.muted}
                  style={{ marginLeft: 12 }}
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={s.foodList}>
                  <View style={s.foodSep} />
                  {logs.length > 0 ? (
                    logs.map(log => (
                      <View key={log.id} style={s.foodRow}>
                        <View style={s.foodInfo}>
                          <Text style={s.foodName} numberOfLines={1}>{log.foodName}</Text>
                          <Text style={s.foodMacros}>
                            P {log.protein_g}g · C {log.carbs_g}g · F {log.fat_g}g
                          </Text>
                        </View>
                        <View style={s.foodRightInner}>
                          <Text style={s.foodCal}>{log.calories} kcal</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveFood(log.id)}
                            disabled={removingId === log.id}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Feather name="x" size={16} color={theme.colors.status.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={s.emptyMeal}>No items logged yet.</Text>
                  )}

                  <TouchableOpacity
                    style={s.addFoodBtn}
                    onPress={() => router.push({
                      pathname: '/modals/log-food',
                      params: { mealType: meal.id },
                    })}
                  >
                    <Feather name="plus" size={16} color={theme.colors.accent.primary} />
                    <Text style={s.addFoodText}>Log {meal.name}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          );
        }), [mealTypes, todayFoodLogs, expandedMeal, removingId])}

        <TouchableOpacity style={s.addCustomMealBtn} onPress={handleAddCustomMeal}>
          <Feather name="plus-circle" size={20} color={theme.colors.text.muted} />
          <Text style={s.addCustomMealText}>Add Custom Meal</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const MacroPill = React.memo(({
  label, current, goal, color, trackColor,
}: { label: string; current: number; goal: number; color: string; trackColor: string }) => {
  const macroProgress = goal > 0 ? Math.min(current / goal, 1) : 0;
  return (
    <View style={s.macroCard}>
      <Text style={s.macroLabel}>{label}</Text>
      <Text style={[s.macroValue, { color }]}>{current}<Text style={s.macroUnit}>g</Text></Text>
      <View style={[s.macroTrack, { backgroundColor: trackColor }]}>
        <View style={[s.macroFill, { width: `${macroProgress * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={s.macroGoalText}>Goal: {goal}g</Text>
    </View>
  );
});

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: theme.colors.bg.primary },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: theme.spacing.screenPadding, paddingTop: 12, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerGreeting: {
    fontSize: theme.font.size.xxxl,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: theme.font.size.sm,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    ...theme.shadow.soft,
  },
  datePillText: { 
    fontSize: 13, 
    fontFamily: theme.font.family.semibold, 
    color: theme.colors.text.primary 
  },

  calorieCard: {
    backgroundColor: 'white',
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...theme.shadow.premium,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringLabel: {
    fontSize: 42,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  ringSubLabel: {
    fontSize: 12,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  vDivider: {
    width: 1,
    height: 100,
    backgroundColor: theme.colors.border.subtle,
    marginHorizontal: 24,
  },
  calorieStats: {
    flex: 1,
  },
  calorieStat: {
    paddingVertical: 4,
  },
  calorieStatLabel: {
    fontSize: 10,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  calorieStatValue: {
    fontSize: 32,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    lineHeight: 36,
  },
  calorieStatUnit: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  hDivider: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginVertical: 12,
  },

  macroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  macroCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadow.card,
  },
  macroLabel: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 20,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  macroUnit: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  macroTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
    marginVertical: 8,
  },
  macroFill: {
    height: '100%',
    borderRadius: 999,
  },
  macroGoalText: {
    fontSize: 10,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },

  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: theme.font.size.xl,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },

  mealCard: {
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    ...theme.shadow.card,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealMeta: {
    flex: 1,
    marginLeft: 16,
  },
  mealName: {
    fontSize: 18,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  mealItems: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  mealRight: {
    alignItems: 'flex-end',
  },
  mealCal: {
    fontSize: 22,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
  },
  mealCalUnit: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },

  foodList: {
    marginTop: 8,
  },
  foodSep: {
    height: 1,
    backgroundColor: theme.colors.border.subtle,
    marginVertical: 16,
  },
  foodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  foodInfo: {
    flex: 1,
    marginRight: 16,
  },
  foodName: {
    fontSize: 15,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.primary,
  },
  foodMacros: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  foodRightInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodCal: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.secondary,
  },
  emptyMeal: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: theme.font.family.body,
    color: theme.colors.text.muted,
    paddingVertical: 12,
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
  },
  addFoodText: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
  },
  addCustomMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderStyle: 'dashed',
    borderRadius: theme.radius.lg,
  },
  addCustomMealText: {
    fontSize: 15,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.muted,
  },

  // AI Analyze
  analyzeSection: {
    marginBottom: 24,
  },
  analyzeBtn: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...theme.shadow.premium,
  },
  analyzeBtnDisabled: {
    opacity: 0.7,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  analyzeBtnText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: theme.radius.xl,
    padding: 20,
    marginBottom: 24,
    ...theme.shadow.card,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  analysisAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisTitleGroup: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  analysisSub: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  analysisBody: {
    fontSize: 14,
    fontFamily: theme.font.family.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  waterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 24,
    ...theme.shadow.card,
  },
  waterText: {
    fontSize: 14,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.primary,
  },
});
