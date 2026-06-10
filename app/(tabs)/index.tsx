import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Animated, { Easing, FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { useWorkoutTrackingStore } from '@/store/workoutTrackingStore';
import { useLiveContextStore } from '@/store/liveContextStore';
import { supabase } from '@/lib/supabase';
import { getTodayDayIndex } from '@/hooks/useToday';
import { generateInsights, type InsightInput } from '@/lib/liveInsightsEngine';

import SectionHeader from '@/components/ui/SectionHeader';
import DynamicHero from '@/components/ui/DynamicHero';
import TodayFocusCard from '@/components/ui/TodayFocusCard';
import CalendarWidget from '@/components/ui/CalendarWidget';
import TrainingTimeline from '@/components/ui/TrainingTimeline';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useUserStore();

  const [profile, setProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [meals, setMeals] = useState<any[]>([]);
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);
  const [todayWater, setTodayWater] = useState(0);
  const [todaySteps, setTodaySteps] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const insights = useLiveContextStore((s) => s.insights);
  const setInsights = useLiveContextStore((s) => s.setInsights);

  const fetchProfile = useCallback(async (userId?: string) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      if (error) throw error;
      setProfile(data);
    } catch (e: any) { console.error('fetchProfile:', e.message); }
  }, [user?.id]);

  const dateFetchCounter = useRef(0);

  const fetchMealsForDate = useCallback(async (date: Date, userId?: string) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return;
      const counter = ++dateFetchCounter.current;
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', uid)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString())
        .order('logged_at', { ascending: true });
      if (error) throw error;
      if (counter !== dateFetchCounter.current) return;
      const totals = data.reduce(
        (acc, m) => ({
          calories: acc.calories + (m.calories ?? 0),
          protein: acc.protein + (m.protein_g ?? 0),
          carbs: acc.carbs + (m.carbs_g ?? 0),
          fat: acc.fat + (m.fat_g ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setMeals(data);
      setTodayCalories(totals.calories);
      setTodayProtein(totals.protein);
      setTodayCarbs(totals.carbs);
      setTodayFat(totals.fat);
    } catch (e) { console.error('fetchMealsForDate:', e); }
  }, [user?.id]);

  const fetchWaterForDate = useCallback(async (date: Date, userId?: string) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return;
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from('water_logs')
        .select('glasses')
        .eq('user_id', uid)
        .gte('logged_at', start.toISOString())
        .lte('logged_at', end.toISOString());
      setTodayWater(data?.reduce((s, r) => s + (r.glasses || 0), 0) ?? 0);
    } catch (e: any) { console.error('fetchWaterForDate:', e.message); }
  }, [user?.id]);

  const fetchStepsForDate = useCallback(async (date: Date, userId?: string) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return;
      const dateStr = date.toISOString().split('T')[0];
      const { data } = await supabase
        .from('activity_logs')
        .select('steps')
        .eq('user_id', uid)
        .eq('logged_at', dateStr)
        .single();
      setTodaySteps(data?.steps || 0);
    } catch (e: any) { console.error('fetchStepsForDate:', e.message); }
  }, [user?.id]);

  const fetchCompletedDays = useCallback(async (userId?: string) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return;
      const base = new Date();
      base.setDate(base.getDate() - base.getDay());
      base.setHours(0, 0, 0, 0);
      const weekEnd = new Date(base);
      weekEnd.setDate(base.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const { data } = await supabase
        .from('workout_logs')
        .select('logged_at')
        .eq('user_id', uid)
        .gte('logged_at', base.toISOString())
        .lte('logged_at', weekEnd.toISOString());
      setCompletedDates(new Set(data?.map((w) => new Date(w.logged_at).toDateString()) ?? []));
    } catch (e: any) { console.error('fetchCompletedDays:', e.message); }
  }, [user?.id]);

  const fetchStreak = useCallback(async (userId?: string) => {
    try {
      const uid = userId || user?.id;
      if (!uid) return;
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const { data } = await supabase
        .from('meal_logs')
        .select('logged_at')
        .eq('user_id', uid)
        .gte('logged_at', sixtyDaysAgo.toISOString())
        .order('logged_at', { ascending: false });
      if (!data?.length) { setStreakDays(0); return; }
      const dates = [...new Set(data.map((d) => new Date(d.logged_at).toDateString()))];
      let streak = 0;
      let checkDate = new Date();
      for (let i = 0; i < 60; i++) {
        if (dates.includes(checkDate.toDateString())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else { break; }
      }
      setStreakDays(streak);
    } catch (e: any) { console.error('fetchStreak:', e.message); }
  }, [user?.id]);

  const fetchAllForDate = useCallback(async (date: Date, userId?: string) => {
    await Promise.all([
      fetchMealsForDate(date, userId),
      fetchWaterForDate(date, userId),
      fetchStepsForDate(date, userId),
    ]);
  }, [fetchMealsForDate, fetchWaterForDate, fetchStepsForDate]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        setSelectedDate(new Date());
        const uid = user?.id;
        await Promise.all([
          fetchProfile(uid),
          fetchAllForDate(new Date(), uid),
          fetchStreak(uid),
          fetchCompletedDays(uid),
          uid ? useSplitBuilderStore.getState().loadSplit(uid) : Promise.resolve(),
        ]);
        setLoading(false);
      };
      load();
    }, [fetchProfile, fetchAllForDate, fetchStreak, fetchCompletedDays, user?.id])
  );

  const calorieGoal = useMemo(() => profile?.calorie_goal ?? 1800, [profile]);
  const proteinGoal = useMemo(() => profile?.protein_goal_g ?? 150, [profile]);
  const carbsGoal = useMemo(() => profile?.carbs_goal_g ?? 200, [profile]);
  const fatGoal = useMemo(() => profile?.fat_goal_g ?? 60, [profile]);
  const waterGoal = 8;
  const stepsGoal = 10000;

  const mealsLoggedCount = useMemo(() => {
    const types = new Set(meals.map((m) => m.meal_type?.toLowerCase()));
    return ['breakfast', 'lunch', 'dinner'].filter((t) => types.has(t)).length;
  }, [meals]);

  const splitDays = useMemo(() => {
    const storeDays = useSplitBuilderStore.getState().days;
    if (!storeDays || storeDays.length === 0) {
      return DAY_NAMES.map((d) => ({
        dayLabel: d.slice(0, 3),
        workoutName: undefined,
        isRest: true,
          isToday: d === DAY_NAMES[getTodayDayIndex()],
        isCompleted: false,
      }));
    }
    return storeDays.map((sd: any) => {
      const isToday = sd.dayName === DAY_NAMES[new Date().getDay()];
      const isRest = sd.isRest || false;
      const dateStr = DAY_NAMES.indexOf(sd.dayName) <= new Date().getDay()
        ? new Date(new Date().setDate(new Date().getDate() - (new Date().getDay() - DAY_NAMES.indexOf(sd.dayName)))).toDateString()
        : '';
      const isCompleted = !isRest && completedDates.has(dateStr);
      return {
        dayLabel: sd.dayName.slice(0, 3),
        workoutName: sd.workoutName || (isRest ? undefined : 'Workout'),
        isRest,
        isToday,
        isCompleted,
        intensity: isRest ? undefined : (isToday ? 'moderate' : 'low') as any,
      };
    });
  }, [completedDates]);

  useEffect(() => {
    const input: InsightInput = {
      calories: todayCalories,
      calorieGoal,
      protein: todayProtein,
      proteinGoal,
      carbs: todayCarbs,
      carbsGoal,
      fat: todayFat,
      fatGoal,
      water: todayWater,
      waterGoal,
      steps: todaySteps,
      stepsGoal,
      streakDays,
      mealsLogged: mealsLoggedCount,
      todayExerciseMin: 0,
      latestWeight: null,
      previousWeight: null,
      sleepHours: null,
      previousSleep: null,
      adherenceTrend: null,
      completedWorkoutsThisWeek: completedDates.size,
      plannedWorkoutsThisWeek: splitDays.filter((d: any) => !d.isRest).length,
      weeklyWorkoutsLastWeek: 0,
      readinessScore: 0,
      fatigueLevel: 0,
      stressLevel: null,
      motivationLevel: null,
    };
    try {
      const cards = generateInsights(input);
      setInsights(cards);
    } catch (e) { /* engine may throw with incomplete data */ }
  }, [todayCalories, calorieGoal, todayProtein, proteinGoal, todayCarbs, carbsGoal,
      todayFat, fatGoal, todayWater, todaySteps, streakDays, mealsLoggedCount, completedDates, splitDays, setInsights]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const uid = user?.id;
    setSelectedDate(new Date());
    await Promise.all([
      fetchProfile(uid),
      fetchAllForDate(new Date(), uid),
      fetchStreak(uid),
      fetchCompletedDays(uid),
      uid ? useSplitBuilderStore.getState().loadSplit(uid) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [fetchProfile, fetchAllForDate, fetchStreak, fetchCompletedDays, user?.id]);

  const handleDayPress = useCallback(async (date: Date) => {
    setSelectedDate(date);
    await fetchAllForDate(date);
  }, [fetchAllForDate]);

  const navToWorkout = useCallback(() => {
    const trackingSessionId = useWorkoutTrackingStore.getState().sessionId;
    if (trackingSessionId) { router.push('/modals/active-workout'); return; }
    const todayIdx = new Date().getDay();
    const todayName = DAY_NAMES[todayIdx];
    const todayWorkout = useSplitBuilderStore.getState().days.find((d) => d.dayName === todayName);
    if (todayWorkout && (todayWorkout as any).templateId && !todayWorkout.isRest) {
      router.push({ pathname: '/modals/active-workout', params: { templateId: (todayWorkout as any).templateId } });
    } else {
      router.push('/modals/active-workout');
    }
  }, [router]);

  const navToAddMeal = useCallback(
    () => router.push({ pathname: '/modals/log-food', params: { date: new Date().toISOString() } }),
    [router]
  );
  const navToBuilder = useCallback(() => router.push('/workout/builder'), [router]);
  const navToCoach = useCallback(() => router.push('/(tabs)/train'), [router]);
  const navToNutrition = useCallback(() => router.push('/(tabs)/food'), [router]);
  const navToProfile = useCallback(() => router.push('/(tabs)/profile'), [router]);
  const navToLogWeight = useCallback(() => router.push('/modals/log-weight'), [router]);
  const navToStats = useCallback(() => router.push('/(tabs)/stats'), [router]);
  const navToWorkoutProgress = useCallback(() => router.push('/(tabs)/workout'), [router]);

  const handleAddWater = useCallback(async () => {
    const Haptics = await import('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTodayWater((p) => p + 1);
    try {
      const uid = user?.id;
      if (!uid) { setTodayWater((p) => p - 1); return; }
      await supabase.from('water_logs').insert({ user_id: uid, glasses: 1, logged_at: new Date().toISOString() });
    } catch (e) { setTodayWater((p) => Math.max(0, p - 1)); }
  }, [user?.id]);

  const calorieRemaining = calorieGoal - todayCalories;
  const userName = profile?.full_name?.split(' ')[0] || 'there';
  const greeting = getTimeGreeting();

  const splitDaysFromStore = useSplitBuilderStore((s) => s.days);

  // Today's workout info
  const todayWorkoutData = useMemo(() => {
    const todayName = DAY_NAMES[new Date().getDay()];
    const day = splitDaysFromStore.find((d: any) => d.dayName === todayName);
    return {
      workoutName: day?.workoutName,
      hasWorkoutToday: !!day && !day.isRest,
      isRestDay: !!day?.isRest,
    };
  }, [splitDaysFromStore]);

  // Calendar workout dates set (for past dates that have entries)
  const workoutDatesSet = useMemo(() => {
    const dates = new Set<string>();
    splitDays.forEach((d: any, i: number) => {
      if (!d.isRest && i <= new Date().getDay()) {
        const dayOffset = i - new Date().getDay();
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        dates.add(date.toDateString());
      }
    });
    return dates;
  }, [splitDays]);

  const isSelectedToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg.primary }}>
      <StatusBar barStyle="light-content" />
      {loading ? (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
          <View style={{ width: '50%', height: 20, borderRadius: 10, backgroundColor: theme.colors.surface, marginBottom: 16 }} />
          <View style={{ width: '70%', height: 14, borderRadius: 7, backgroundColor: theme.colors.surface, marginBottom: 24 }} />
          <View style={{ borderRadius: 20, backgroundColor: theme.colors.surface, padding: 20, marginBottom: 16 }}>
            <View style={{ width: '40%', height: 16, borderRadius: 8, backgroundColor: theme.colors.border.subtle, marginBottom: 12 }} />
            <View style={{ width: '100%', height: 48, borderRadius: 12, backgroundColor: theme.colors.border.subtle, marginBottom: 12 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.colors.border.subtle }} />
              <View style={{ flex: 1, height: 40, borderRadius: 10, backgroundColor: theme.colors.border.subtle }} />
            </View>
          </View>
          <View style={{ width: '100%', height: 200, borderRadius: 20, backgroundColor: theme.colors.surface, marginBottom: 16 }} />
          <View style={{ width: '100%', height: 100, borderRadius: 20, backgroundColor: theme.colors.surface, marginBottom: 16 }} />
          <View style={{ width: '100%', height: 120, borderRadius: 20, backgroundColor: theme.colors.surface }} />
        </View>
      ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Animated.View
          key={`hero-${selectedDate.toDateString()}`}
          entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
          exiting={FadeOutUp.duration(150).easing(Easing.out(Easing.quad))}
        >
          <DynamicHero
            greeting={greeting}
            userName={userName}
            aiMessage={insights?.[0]?.headline || 'Ready for today?'}
            calorieValue={todayCalories}
            calorieRemaining={calorieRemaining}
            calorieGoal={calorieGoal}
            smartPills={[
              { icon: 'zap', label: 'Protein', value: `${Math.round(todayProtein)}g`, color: theme.colors.success },
              { icon: 'droplet', label: 'Water', value: `${Math.round(todayWater)}/${waterGoal}`, color: '#60A5FA' },
              { icon: 'award', label: 'Streak', value: `${streakDays} days`, color: theme.colors.warning },
            ]}
          />
        </Animated.View>

        <View style={{ marginTop: 28, marginBottom: 8 }}>
          <SectionHeader title={isSelectedToday ? 'Today Focus' : 'Selected Day'} />
        </View>

        <TodayFocusCard
          workoutName={isSelectedToday ? todayWorkoutData.workoutName : undefined}
          hasWorkoutToday={isSelectedToday && todayWorkoutData.hasWorkoutToday}
          isRestDay={!isSelectedToday || todayWorkoutData.isRestDay}
          primaryAction={navToWorkout}
          secondaryActions={[
            { icon: 'plus-circle', label: 'Log Meal', variant: 'warning' as const, onPress: navToAddMeal },
            { icon: 'droplet', label: 'Add Water', variant: 'success' as const, onPress: handleAddWater },
            { icon: 'trending-up', label: 'Log Weight', variant: 'purple' as const, onPress: navToLogWeight },
          ]}
        />

        <View style={{ marginTop: 28, marginBottom: 12 }}>
          <SectionHeader title="Calendar" />
        </View>
        <CalendarWidget
          completedDates={completedDates}
          workoutDates={workoutDatesSet}
          selectedDate={selectedDate}
          onDayPress={handleDayPress}
        />

        <TouchableOpacity
          onPress={navToWorkoutProgress}
          activeOpacity={0.85}
          style={{ marginTop: 32, marginBottom: 8 }}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: theme.radius.xl,
              padding: 20,
              marginHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              overflow: 'hidden',
              ...theme.shadow.glow,
            }}
          >
            <View style={{
              width: 50, height: 50, borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Feather name="trending-up" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: theme.font.size.title, fontWeight: '800' }}>
                View Progress
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: theme.font.size.body, marginTop: 2 }}>
                Check your training history & stats
              </Text>
            </View>
            <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ marginTop: 28, marginBottom: 12 }}>
          <SectionHeader
            title="Training Split"
            action={{ label: 'Edit', onPress: navToBuilder }}
          />
        </View>
        <TrainingTimeline
          days={splitDays}
          splitName={profile?.split_name || 'Current Split'}
          onEdit={navToBuilder}
        />

        <View style={{ height: 24 }} />
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
