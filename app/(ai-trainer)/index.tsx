// AI Trainer Home v3 — Soft Premium Aesthetic (AI Trainer Mode)
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAiTrainerStore } from '@/store/aiTrainerStore';
import { useLiveContextStore } from '@/store/liveContextStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { generateInsights } from '@/lib/liveInsightsEngine';

import HeroSection from '@/components/ui/HeroSection';
import OverlapCard from '@/components/ui/OverlapCard';
import StatPill from '@/components/ui/StatPill';
import GradientButton from '@/components/ui/GradientButton';
import SectionHeader from '@/components/ui/SectionHeader';
import FloatingCard from '@/components/ui/FloatingCard';
import InsightCard from '@/components/ui/InsightCard';
import PulseDot from '@/components/ui/PulseDot';
import AvatarCircle from '@/components/ui/AvatarCircle';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function AiTrainerHome() {
  const router = useRouter();
  const insights = useLiveContextStore((s) => s.insights);
  const setInsights = useLiveContextStore((s) => s.setInsights);
  const coachCtx = useLiveContextStore((s) => s.coach);
  const activePlan = useAiTrainerStore((s) => s.activePlan);

  const [greeting, setGreeting] = useState(getGreeting());
  const [userName, setUserName] = useState('Athlete');
  const [profile, setProfile] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<{ name: string; minutes: number; intensity: string } | null>(null);
  const [adherence, setAdherence] = useState({ value: '--', sub: '' });
  const [calories, setCalories] = useState({ value: '--', sub: '' });
  const [recovery, setRecovery] = useState({ value: '--', sub: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [proteinPct, setProteinPct] = useState(0);
  const [caloriePct, setCaloriePct] = useState(0);

  const load = useCallback(async () => {
    setGreeting(getGreeting());
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileData) {
      setProfile(profileData);
      setUserName(profileData.full_name || 'Athlete');
    }

    const todayIdx = new Date().getDay();
    const todayName = DAY_NAMES[todayIdx];
    if (activePlan?.workoutDays && activePlan.workoutDays.length > 0) {
      const todayPlan = activePlan.workoutDays[todayIdx === 0 ? 6 : todayIdx - 1];
      if (todayPlan && !todayPlan.isRest) {
        setTodayWorkout({ name: todayPlan.focus, minutes: (todayPlan.exercises?.length ?? 6) * 8 || 50, intensity: 'Moderate' });
      } else {
        setTodayWorkout(null);
      }
    } else {
      const splitStore = useSplitBuilderStore.getState();
      const todaySplit = splitStore.days.find((d: any) => d.dayName === todayName);
      if (todaySplit && !todaySplit.isRest) {
        setTodayWorkout({ name: todaySplit.workoutName || 'Workout', minutes: 55, intensity: 'Moderate' });
      } else {
        setTodayWorkout(null);
      }
    }

    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

    const [mealsResult, workoutsResult] = await Promise.all([
      supabase.from('meal_logs').select('calories, protein_g, carbs_g, fat_g').eq('user_id', user.id).gte('logged_at', startToday).lte('logged_at', endToday),
      supabase.from('workout_logs').select('duration_minutes').eq('user_id', user.id).gte('logged_at', startToday).lte('logged_at', endToday),
    ]);

    const meals = mealsResult.data || [];
    const dailyCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
    const dailyPro = meals.reduce((s, m) => s + (m.protein_g || 0), 0);
    const goalCal = activePlan?.calorieTarget || profileData?.calorie_goal || 1800;
    const goalPro = activePlan?.proteinTarget || profileData?.protein_goal_g || 150;

    setCaloriePct(goalCal > 0 ? Math.min(1, dailyCal / goalCal) : 0);
    setProteinPct(goalPro > 0 ? Math.min(1, dailyPro / goalPro) : 0);

    setCalories({
      value: dailyCal.toLocaleString(),
      sub: dailyCal > 0 ? `${Math.round((dailyCal / goalCal) * 100)}% of ${goalCal.toLocaleString()} target` : 'No meals logged yet',
    });
    setAdherence({
      value: dailyCal > 0 ? `${Math.min(100, Math.round((dailyCal / goalCal) * 100))}%` : '--',
      sub: dailyPro >= goalPro ? 'Protein target hit today' : 'Protein below target',
    });
    setRecovery({
      value: coachCtx.readinessScore > 0 ? `${coachCtx.readinessScore}/10` : '--',
      sub: coachCtx.phase === 'plan_active' ? `Week ${activePlan?.weekNumber || 1}` : 'Building your profile',
    });

    const carbG = activePlan?.carbTarget || profileData?.carbs_goal_g || 200;
    const fatG = activePlan?.fatTarget || profileData?.fat_goal_g || 60;
    const plannedWorkouts = activePlan?.workoutDays?.filter((d: any) => !d.isRest).length
      || useSplitBuilderStore.getState().days.filter((d: any) => !d.isRest).length;
    try {
      const cards = generateInsights({
        calories: dailyCal, calorieGoal: goalCal,
        protein: dailyPro, proteinGoal: goalPro,
        carbs: meals.reduce((s, m) => s + (m.carbs_g || 0), 0), carbsGoal: carbG,
        fat: meals.reduce((s, m) => s + (m.fat_g || 0), 0), fatGoal: fatG,
        water: 0, waterGoal: 8, steps: 0, stepsGoal: 10000, streakDays: 0,
        mealsLogged: meals.length,
        todayExerciseMin: (workoutsResult.data || []).reduce((s, w) => s + (w.duration_minutes || 0), 0),
        latestWeight: null, previousWeight: null,
        sleepHours: null, previousSleep: null, adherenceTrend: null,
        completedWorkoutsThisWeek: 0, plannedWorkoutsThisWeek: plannedWorkouts,
        weeklyWorkoutsLastWeek: 0, readinessScore: coachCtx.readinessScore, fatigueLevel: 3,
        stressLevel: null, motivationLevel: null,
      });
      setInsights(cards);
    } catch (e) { /* engine may throw with incomplete data */ }
  }, [activePlan, coachCtx.readinessScore, coachCtx.phase, setInsights]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const greeting_message = `${greeting} 👋`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg.primary }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* HERO */}
        <HeroSection height={300}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroGreeting}>{greeting_message}</Text>
              <Text style={styles.heroName}>{userName}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/settings/mode-switcher')} activeOpacity={0.7}>
              <AvatarCircle
                name={profile?.full_name || 'U'}
                uri={profile?.avatar_url}
                size={42}
                variant="glass"
                borderColor="rgba(255,255,255,0.40)"
              />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.heroAiRow}>
            <PulseDot color="rgba(255,255,255,0.90)" size={8} ringSize={14} />
            <Text style={styles.heroAiText}>
              {coachCtx.phase === 'plan_active'
                ? `Week ${activePlan?.weekNumber || 1} — recovery ${coachCtx.readinessScore}/10`
                : "Let's build your plan together"}
            </Text>
          </Animated.View>

          {todayWorkout ? (
            <View style={styles.heroMainRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroMicro}>{activePlan ? `WEEK ${activePlan.weekNumber}` : 'TODAY'}</Text>
                <Text style={styles.heroTitle}>{todayWorkout.name}</Text>
                <Text style={styles.heroSub}>{todayWorkout.minutes} min · {todayWorkout.intensity}</Text>
                <GradientButton
                  title="Start Session"
                  icon="play"
                  iconPosition="left"
                  variant="white"
                  size="md"
                  onPress={() => router.push('/(ai-trainer)/workout')}
                  style={{ marginTop: 16, alignSelf: 'flex-start', width: undefined, paddingHorizontal: 20 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.heroMainRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>Rest Day</Text>
                <Text style={styles.heroSub}>Recovery is part of progress</Text>
                <GradientButton
                  title="Chat with AI Coach"
                  icon="message-circle"
                  iconPosition="left"
                  variant="white"
                  size="md"
                  onPress={() => router.push('/(ai-trainer)/coach')}
                  style={{ marginTop: 16, alignSelf: 'flex-start', width: undefined, paddingHorizontal: 20 }}
                />
              </View>
            </View>
          )}
        </HeroSection>

        {/* OVERLAP STATS */}
        <OverlapCard offset={32} delay={250}>
          <View style={styles.statsRow}>
            <Stat icon="📊" value={adherence.value} label="Adherence" />
            <Stat icon="🔥" value={calories.value} label="Calories" />
            <Stat icon="💪" value={recovery.value} label="Recovery" />
          </View>
        </OverlapCard>

        {/* QUICK START */}
        <View style={{ marginTop: 32 }}>
          <SectionHeader title="Quick Start" icon="zap" iconColor={theme.colors.primary} />
          <FloatingCard style={{ marginHorizontal: 20 }}>
            <View style={styles.qsHeader}>
              <View style={[styles.qsIcon, { backgroundColor: theme.colors.primarySoft }]}>
                <Feather name="zap" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.qsTitle}>Quick Start Flow</Text>
            </View>
            <View style={{ marginTop: 12, gap: 10 }}>
              <QS step={1} text="AI intro — dynamic coaching based on recovery & plan" />
              <QS step={2} text="Live exercise tracker with AI set-by-set coaching" />
              <QS step={3} text="Post-workout AI analysis + free chat feedback" />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <GradientButton
                title="Start Now"
                icon="play"
                iconPosition="left"
                variant="primary"
                size="md"
                onPress={() => router.push('/(ai-trainer)/workout')}
                style={{ flex: 1 }}
              />
              <GradientButton
                title="View Plan"
                icon="eye"
                iconPosition="left"
                variant="soft"
                size="md"
                onPress={() => router.push('/(ai-trainer)/train')}
                style={{ flex: 1 }}
              />
            </View>
          </FloatingCard>
        </View>

        {/* AI INSIGHTS */}
        {insights.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="AI Insights" icon="zap" iconColor={theme.colors.primary} />
            {insights.slice(0, 2).map((card, i) => {
              let type: 'nutrition' | 'recovery' | 'coach' | 'motivation' | 'warning' = 'coach';
              if (card.type === 'nutrition') type = 'nutrition';
              else if (card.type === 'recovery' || card.type === 'streak') type = 'recovery';
              else if (card.type === 'fatigue' || card.type === 'weight') type = 'warning';
              else if (card.type === 'motivation') type = 'motivation';
              return (
                <View key={card.id} style={{ marginHorizontal: 20, marginBottom: 10 }}>
                  <InsightCard
                    type={type}
                    text={card.body}
                    action="Open Coach →"
                    onPress={() => router.push('/(ai-trainer)/coach')}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* COACH ENTRY */}
        <View style={{ marginTop: 24, marginBottom: 8 }}>
          <SectionHeader title="Your AI Coach" icon="message-circle" iconColor={theme.colors.primary} />
          <TouchableOpacity
            onPress={() => router.push('/(ai-trainer)/coach')}
            activeOpacity={0.85}
            style={styles.coachEntryWrapper}
          >
            <AvatarCircle name="AI" size={44} variant="solid" />
            <View style={{ flex: 1 }}>
              <Text style={styles.coachMsg} numberOfLines={2}>
                {coachCtx.phase === 'plan_active'
                  ? `Week ${activePlan?.weekNumber || 1} of your plan. Let's talk about progress.`
                  : "Let's talk about your goals — I'll build your plan as we go."}
              </Text>
              <Text style={styles.coachSub}>Open Coach →</Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QS({ step, text }: { step: number; text: string }) {
  return (
    <View style={styles.qsStep}>
      <View style={styles.qsStepNum}>
        <Text style={styles.qsStepNumText}>{step}</Text>
      </View>
      <Text style={styles.qsStepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: theme.font.size.h2,
    fontWeight: '800',
    marginTop: 2,
  },
  heroAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  heroAiText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: theme.font.size.body,
    fontWeight: '500',
    flex: 1,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  heroMicro: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: theme.font.size.h1,
    fontWeight: '800',
    fontFamily: theme.font.family.number,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: { fontSize: 18 },
  statValue: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  qsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qsIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qsTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  qsStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  qsStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qsStepNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  qsStepText: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  coachEntryWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginHorizontal: 20,
    ...theme.shadow.card,
  },
  coachMsg: {
    fontSize: theme.font.size.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
    fontWeight: '500',
  },
  coachSub: {
    fontSize: theme.font.size.caption,
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
});
