// UI: Premium Dashboard — Complete Structural Redesign (Phase 11)
// Layout: CompactHeader → DailyHeroCard → TodayPlanStrip → WeekCalendar → MealAccordionPanel → NutritionAnalyticsCard
// Performance: React.memo on all cards, useCallback handlers, useMemo derived values,
//              no inline objects in JSX, Reanimated 60fps interactions

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
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';

// New premium components
import { DailyHeroCard } from '@/components/ui/DailyHeroCard';
import { FadeInView } from '@/components/ui/FadeInView';
import { WeeklySplitCard } from '@/components/ui/WeeklySplitCard';
import { NutritionAnalyticsCard } from '@/components/ui/NutritionAnalyticsCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { TodayPlanStrip } from '@/components/ui/TodayPlanStrip';
import { WeekCalendar } from '@/components/ui/WeekCalendar';

import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useSplitBuilderStore } from '../../store/splitBuilderStore';
import { useWorkoutTrackingStore } from '../../store/workoutTrackingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helper (outside component — no re-creation on render) ───────────────────
const getInitials = (name: string) =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getNextWorkoutDay = (days: any[]): { dayName: string; workoutName: string } | null => {
  const todayIdx = new Date().getDay();
  for (let offset = 1; offset <= 7; offset++) {
    const idx = (todayIdx + offset) % 7;
    const dayName = DAY_NAMES[idx];
    const day = days.find(d => d.dayName === dayName);
    if (day && !day.isRest && day.workoutName?.trim()) {
      return { dayName, workoutName: day.workoutName };
    }
  }
  return null;
};

// ─── Static layout constants ─────────────────────────────────────────────────
const SCROLL_CONTENT_STYLE = {
  paddingHorizontal: 16,
  paddingTop: 12,
  paddingBottom: 104,
  gap: 12,
} as const;

// ─── Compact Header (memoized) ───────────────────────────────────────────────
interface HeaderProps {
  name: string | null;
  loading: boolean;
  onWorkout: () => void;
  onAddMeal: () => void;
  onNotification: () => void;
  onProfile: () => void;
}

const CompactHeader = React.memo(
  ({ name, loading, onWorkout, onAddMeal, onNotification, onProfile }: HeaderProps) => {
    const firstName = useMemo(() => name?.split(' ')[0] || 'User', [name]);
    const initials = useMemo(() => getInitials(name || ''), [name]);
    const greeting = useMemo(() => getGreeting(), []);

    return (
      <View style={styles.header}>
        {/* Left: Avatar + Greeting */}
        <Pressable
          style={styles.userRow}
          onPress={onProfile}
          delayPressIn={100}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.greetingBlock}>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            {loading ? (
              <SkeletonLoader width={90} height={18} borderRadius={4} />
            ) : (
              <Text style={styles.userName}>{firstName}</Text>
            )}
          </View>
        </Pressable>
      </View>
    );
  }
);
CompactHeader.displayName = 'CompactHeader';

// ─── Section Label (memoized) ────────────────────────────────────────────────
const SectionLabel = React.memo(({ label }: { label: string }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
));
SectionLabel.displayName = 'SectionLabel';

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  // ── DATA: State (unchanged from original) ──────────────────────────────────
  const [profile, setProfile] = useState<any>(null);
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const waterOpIdRef = useRef<number | null>(null);

  // ── DATA: Fetch functions (verbatim from original) ─────────────────────────
  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      setProfile(data);
    } catch (e: any) { console.error('fetchProfile error:', e.message); }
  };

  const fetchTodayMeals = async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString())
        .order('logged_at', { ascending: true });
      if (error) throw error;
      const totals = data.reduce(
        (acc, meal) => ({
          calories: acc.calories + (meal.calories ?? 0),
          protein: acc.protein + (meal.protein_g ?? 0),
          carbs: acc.carbs + (meal.carbs_g ?? 0),
          fat: acc.fat + (meal.fat_g ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      setMeals(data);
      setTodayCalories(totals.calories);
      setTodayProtein(totals.protein);
      setTodayCarbs(totals.carbs);
      setTodayFat(totals.fat);
    } catch (e) { console.error('fetchTodayMeals error:', e); }
  };

  const fetchTodayWater = async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from('water_logs')
        .select('glasses')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString());
      if (error) throw error;
      setTodayWater(data.reduce((sum, row) => sum + (row.glasses || 0), 0));
    } catch (e: any) { console.error('fetchTodayWater error:', e.message); }
  };

  const fetchTodaySteps = async (date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const dateStr = date.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('activity_logs')
        .select('steps')
        .eq('user_id', user.id)
        .eq('logged_at', dateStr)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      setTodaySteps(data?.steps || 0);
    } catch (e: any) { console.error('fetchTodaySteps error:', e.message); }
  };

  const fetchStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('meal_logs')
        .select('logged_at')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });
      if (error) throw error;
      if (!data.length) { setStreakDays(0); return; }
      const dates = [...new Set(data.map((d) => new Date(d.logged_at).toDateString()))];
      let streak = 0;
      let checkDate = new Date();
      for (let i = 0; i < dates.length; i++) {
        if (dates.includes(checkDate.toDateString())) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else { break; }
      }
      setStreakDays(streak);
    } catch (e: any) { console.error('fetchStreak error:', e.message); }
  };

  useFocusEffect(
    useCallback(() => {
      const loadAllData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        await Promise.all([
          fetchProfile(),
          fetchTodayMeals(selectedDate),
          fetchTodayWater(selectedDate),
          fetchTodaySteps(selectedDate),
          fetchStreak(),
          user?.id ? useSplitBuilderStore.getState().loadSplit(user.id) : Promise.resolve(),
        ]);
        setLoading(false);
      };
      loadAllData();
    }, [selectedDate])
  );

  useEffect(() => {
    const refreshForDate = async () => {
      setLoading(true);
      await Promise.all([
        fetchTodayMeals(selectedDate),
        fetchTodayWater(selectedDate),
        fetchTodaySteps(selectedDate),
      ]);
      setLoading(false);
    };
    refreshForDate();
  }, [selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    await Promise.all([
      fetchProfile(),
      fetchTodayMeals(selectedDate),
      fetchTodayWater(selectedDate),
      fetchTodaySteps(selectedDate),
      fetchStreak(),
      user?.id ? useSplitBuilderStore.getState().loadSplit(user.id) : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [selectedDate]);

  // ── Splash screen (unchanged logic) ───────────────────────────────────────
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useSharedValue(1);
  const splashScale = useSharedValue(1);

  useEffect(() => {
    splashScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      2,
      true,
      () => {
        splashScale.value = withTiming(3, { duration: 500 });
        splashOpacity.value = withTiming(0, { duration: 500 });
      }
    );
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
    transform: [{ scale: splashScale.value }],
  }));

  // ── Memoized goals ─────────────────────────────────────────────────────────
  const calorieGoal = useMemo(() => profile?.calorie_goal ?? 1800, [profile]);
  const proteinGoal = useMemo(() => profile?.protein_goal_g ?? 150, [profile]);
  const carbsGoal = useMemo(() => profile?.carbs_goal_g ?? 200, [profile]);
  const fatGoal = useMemo(() => profile?.fat_goal_g ?? 60, [profile]);

  // ── Memoized meal count per type ───────────────────────────────────────────
  const mealsLoggedCount = useMemo(() => {
    const types = new Set(meals.map((m) => m.meal_type?.toLowerCase()));
    return ['breakfast', 'lunch', 'dinner'].filter((t) => types.has(t)).length;
  }, [meals]);

  const mealsTotal = useMemo(() => {
    const types = new Set(meals.map((m) => m.meal_type?.toLowerCase()));
    const present = ['breakfast', 'lunch', 'dinner'].filter((t) => types.has(t)).length;
    return present > 0 ? Math.max(4, present) : 4;
  }, [meals]);

  // ── useCallback navigation handlers (stable references) ───────────────────
  const navToWorkout = useCallback(() => {
    const trackingSessionId = useWorkoutTrackingStore.getState().sessionId;
    if (trackingSessionId) {
      router.push('/modals/active-workout');
      return;
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIdx = new Date().getDay();
    const todayName = dayNames[todayIdx];
    const todayWorkout = useSplitBuilderStore.getState().days.find(d => d.dayName === todayName);

    if (todayWorkout && todayWorkout.templateId && !todayWorkout.isRest) {
      router.push({
        pathname: '/modals/active-workout',
        params: { templateId: todayWorkout.templateId }
      });
    } else {
      router.push('/modals/active-workout');
    }
  }, [router]);
  const navToBuilder = useCallback(() => router.push('/workout/builder'), [router]);
  const navToAddMeal = useCallback(
    () => router.push({ pathname: '/modals/log-food', params: { date: selectedDate.toISOString() } }),
    [router, selectedDate]
  );
  const navToProfile = useCallback(() => router.push('/(tabs)/profile'), [router]);
  const navToStats = useCallback(() => router.push('/(tabs)/stats'), [router]);
  const noop = useCallback(() => {}, []);

  const handleAddWater = useCallback(async () => {
    const Haptics = await import('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const prevValue = todayWater;
    const opId = Date.now();
    (waterOpIdRef as React.MutableRefObject<number | null>).current = opId;

    setTodayWater((prev) => prev + 1);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if ((waterOpIdRef as React.MutableRefObject<number | null>).current === opId) {
          setTodayWater(prevValue);
        }
        return;
      }
      const { error } = await supabase.from('water_logs').insert({
        user_id: user.id,
        glasses: 1,
        logged_at: new Date().toISOString()
      });
      if (error) {
        console.error('Failed to log water', error);
        if ((waterOpIdRef as React.MutableRefObject<number | null>).current === opId) {
          setTodayWater(prevValue);
        }
      }
    } catch (e) {
      console.error(e);
      if ((waterOpIdRef as React.MutableRefObject<number | null>).current === opId) {
        setTodayWater(prevValue);
      }
    }
  }, [todayWater]);

  // ─── Scroll-triggered sticky header ───────────────────────────────────────
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerBarOpacity = useAnimatedStyle(() => {
    return {
      opacity: Math.min(Math.max(scrollY.value / 60, 0), 1)
    };
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.bg.primary} />

      {/* Splash */}
      {showSplash && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.splash, { zIndex: 999 }]}>
          <Animated.View style={splashStyle}>
            <View style={styles.splashLogo}>
              <Feather name="zap" size={56} color="white" />
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Sticky header background — appears on scroll */}
      <Animated.View
        style={[styles.stickyBar, headerBarOpacity]}
        pointerEvents="none"
      />

      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={SCROLL_CONTENT_STYLE}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.green}
          />
        }
      >
        {/* ── SECTION 1: Compact Header ──────────────────────────────────── */}
        <FadeInView delay={0}>
          <CompactHeader
            name={profile?.full_name || null}
            loading={loading}
            onWorkout={navToWorkout}
            onAddMeal={navToAddMeal}
            onNotification={noop}
            onProfile={navToProfile}
          />
        </FadeInView>

        {/* ── SECTION 2: Daily Hero Card ────────────────────────────────── */}
        <FadeInView delay={80}>
          <DailyHeroCard
            caloriesLogged={todayCalories}
            calorieGoal={calorieGoal}
            proteinLogged={todayProtein}
            proteinGoal={proteinGoal}
            waterGlasses={todayWater}
            waterGoal={8}
            steps={todaySteps}
            stepsGoal={10000}
            streakDays={streakDays}
          />
        </FadeInView>

        {/* ── SECTION 3: Today's Plan Strip ─────────────────────────────── */}
        <FadeInView delay={140}>
          <TodayPlanStrip
            mealsLogged={mealsLoggedCount}
            mealsTotal={mealsTotal}
            waterLogged={todayWater}
            waterGoal={8}
            stepsLogged={todaySteps}
            stepsGoal={10000}
            hasWorkout={false}
            onStartWorkout={navToWorkout}
            onAddMeal={navToAddMeal}
            onAddWater={handleAddWater}
            onViewSteps={navToStats}
          />
        </FadeInView>

        {/* ── SECTION 4: Week Calendar Strip ────────────────────────────── */}
        <FadeInView delay={180}>
          <WeekCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </FadeInView>

        {/* ── SECTION 5: Weekly Split Card ───────────────────────────── */}
        <FadeInView delay={220}>
          <SectionLabel label="Training Split" />
          <WeeklySplitCard 
            onEditSplit={navToBuilder}
            onCreateSplit={navToBuilder}
          />
        </FadeInView>

        {/* ── SECTION 6: Nutrition Analytics Card ───────────────────────── */}
        <FadeInView delay={270}>
          <NutritionAnalyticsCard
            caloriesLogged={todayCalories}
            calorieGoal={calorieGoal}
            protein={todayProtein}
            proteinGoal={proteinGoal}
            carbs={todayCarbs}
            carbsGoal={carbsGoal}
            fat={todayFat}
            fatGoal={fatGoal}
          />
        </FadeInView>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Splash
  splash: {
    backgroundColor: theme.colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Container
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  screen: { flex: 1 },

  // Sticky scroll overlay
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: 'rgba(245,247,242,0.95)',
    zIndex: 10,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: theme.font.family.heading,
    color: 'white',
  },
  greetingBlock: {
    gap: 1,
  },
  greeting: {
    fontSize: 11,
    fontFamily: theme.font.family.body,
    color: theme.colors.text.muted,
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 20,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },

  // Action buttons
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnLight: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnGhost: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 2,
  },
});
