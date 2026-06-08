import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/constants/theme';
import { useAiTrainerStore, type ActivePlan, type WorkoutDay, type WorkoutExercise } from '@/store/aiTrainerStore';

import HeroSection from '@/components/ui/HeroSection';
import OverlapCard from '@/components/ui/OverlapCard';
import SectionHeader from '@/components/ui/SectionHeader';
import FloatingCard from '@/components/ui/FloatingCard';
import GradientButton from '@/components/ui/GradientButton';
import StatPill from '@/components/ui/StatPill';
import DayStrip from '@/components/ui/DayStrip';
import PulseDot from '@/components/ui/PulseDot';
import ModeBadge from '@/components/ui/ModeBadge';


import {
  type ExercisePerformanceData,
  type SessionSetGroup,
  fetchAllWorkoutData,
} from '@/lib/workoutDataService';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const REST_TIPS = [
  'Active recovery promotes blood flow and reduces soreness',
  'Prioritise 7-9 hours of sleep for muscle repair',
  'Light stretching and mobility work aids recovery',
  'Stay hydrated — water supports nutrient transport',
  'Foam rolling can help release muscle tension',
];

const phaseLabels: Record<string, { label: string; color: string; bg: string }> = {
  'plan_active': { label: 'Active Plan', color: theme.colors.success, bg: theme.colors.successSoft },
  'deload': { label: 'Deload Week', color: theme.colors.warning, bg: theme.colors.warningSoft },
  'recovery_focus': { label: 'Recovery Modified', color: theme.colors.primary, bg: theme.colors.primarySoft },
  'intensification': { label: 'Intensification', color: theme.colors.danger, bg: theme.colors.dangerSoft },
  'fat_loss_accel': { label: 'Fat Loss Push', color: '#FB7185', bg: theme.colors.tertiarySoft },
};

function PhaseBadge({ plan }: { plan: ActivePlan }) {
  const p = phaseLabels[plan.fatigueState || 'plan_active'] || phaseLabels.plan_active;
  return (
    <View style={[styles.phaseBadge, { backgroundColor: p.bg }]}>
      <PulseDot color={p.color} size={6} ringSize={12} pulse={false} />
      <Text style={[styles.phaseText, { color: p.color }]}>{p.label}</Text>
    </View>
  );
}

function MetaPill({ icon, label, color, bg }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; color: string; bg: string }) {
  return (
    <View style={[styles.metaPill, { backgroundColor: bg, borderColor: color + '30' }]}>
      <Feather name={icon} size={12} color={color} />
      <Text style={[styles.metaPillText, { color }]}>{label}</Text>
    </View>
  );
}

function PlanHeader({ plan }: { plan: ActivePlan }) {
  return (
    <View style={styles.planHeaderWrap}>
      <View style={styles.planHeaderTop}>
        <View>
          <Text style={styles.planGoal}>{plan.goal.toUpperCase()} PHASE</Text>
          <Text style={styles.planDuration}>{plan.currentWeek} / {plan.maxDurationWeeks} weeks</Text>
        </View>
        <PhaseBadge plan={plan} />
      </View>
      <View style={styles.metaRow}>
        <MetaPill icon="zap" label={plan.splitType} color={theme.colors.primary} bg={theme.colors.primarySoft} />
        <MetaPill icon="pie-chart" label={`${plan.calorieTarget} kcal`} color={theme.colors.warning} bg={theme.colors.warningSoft} />
        <MetaPill icon="activity" label={plan.cardioStrategy.slice(0, 12)} color={theme.colors.success} bg={theme.colors.successSoft} />
      </View>
    </View>
  );
}

function fmtShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function avgWeight(session: SessionSetGroup): number {
  if (session.sets.length === 0) return 0;
  return session.sets.reduce((s, set) => s + set.weight, 0) / session.sets.length;
}

function getSetDelta(setNum: number, current: SessionSetGroup, prev?: SessionSetGroup): number | null {
  if (!prev) return null;
  const prevSet = prev.sets.find(s => s.setNumber === setNum);
  const curSet = current.sets.find(s => s.setNumber === setNum);
  if (!prevSet || !curSet) return null;
  return curSet.weight - prevSet.weight;
}

function ExerciseRowWithData({
  exercise,
  performance,
}: {
  exercise: WorkoutExercise;
  performance: ExercisePerformanceData | undefined;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const targetStr = `${exercise.sets} × ${exercise.reps}`;
  const hasData = performance && performance.totalCompletedSets > 0;

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exName}>{exercise.name}</Text>
          <Text style={styles.exSetReps}>Target: {targetStr}</Text>
        </View>

      </View>

      {hasData ? (
        <View style={styles.exStatsRow}>
          <Text style={styles.exStat}>
            Last: <Text style={styles.exStatValue}>{performance!.lastWeight} kg</Text>
          </Text>
          <Text style={styles.exStatDot}>·</Text>
          <Text style={styles.exStat}>
            Best: <Text style={styles.exStatValue}>{performance!.bestWeight} kg</Text>
          </Text>
          {performance!.weightProgress === 'up' && (
            <Feather name="trending-up" size={14} color={theme.colors.success} />
          )}
          {performance!.weightProgress === 'down' && (
            <Feather name="trending-down" size={14} color={theme.colors.danger} />
          )}
        </View>
      ) : (
        <Text style={styles.exNoData}>No sets logged yet</Text>
      )}

      <TouchableOpacity
        style={styles.exHistoryToggle}
        onPress={() => setHistoryOpen(!historyOpen)}
        activeOpacity={0.6}
      >
        <Text style={styles.exHistoryToggleText}>
          {historyOpen ? 'Hide history' : 'Tap to expand history'}
        </Text>
        <Feather name={historyOpen ? 'chevron-up' : 'chevron-down'} size={12} color={theme.colors.text.muted} />
      </TouchableOpacity>

      {historyOpen && performance && performance.history.length > 0 && (
        <View style={styles.historyTable}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyCell, styles.historyCellHeader, { flex: 1.2 }]}>Date</Text>
            <Text style={[styles.historyCell, styles.historyCellHeader, { flex: 0.8 }]}>Sets</Text>
            <Text style={[styles.historyCell, styles.historyCellHeader, { flex: 1 }]}>Reps</Text>
            <Text style={[styles.historyCell, styles.historyCellHeader, { flex: 1 }]}>Weight</Text>
          </View>
          {performance.history.slice(0, 5).map((h, i) => {
            const dateLabel = new Date(h.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            return (
              <View key={i} style={styles.historyRow}>
                <Text style={[styles.historyCell, { flex: 1.2, color: theme.colors.text.primary }]}>{dateLabel}</Text>
                <Text style={[styles.historyCell, { flex: 0.8 }]}>{h.sets}</Text>
                <Text style={[styles.historyCell, { flex: 1 }]}>{h.reps}</Text>
                <Text style={[styles.historyCell, { flex: 1, fontWeight: '600', color: theme.colors.text.primary }]}>{h.weight} kg</Text>
              </View>
            );
          })}
          {performance.history.length > 5 && (
            <Text style={styles.viewAllLink}>View all</Text>
          )}
        </View>
      )}

      {historyOpen && performance && performance.history.length === 0 && (
        <Text style={styles.noHistoryText}>No previous sessions found</Text>
      )}
    </View>
  );
}

function DayCard({
  day,
  index,
  plan,
  onStart,
  performanceMap,
  defaultExpanded,
}: {
  day: WorkoutDay;
  index: number;
  plan: ActivePlan;
  onStart: () => void;
  performanceMap: Map<string, ExercisePerformanceData>;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const todayIdx = new Date().getDay();
  const isActuallyToday = day.dayName === DAY_NAMES[todayIdx];
  const exercises = day.exercises || [];
  const exerciseNames = exercises.map(e => e.name);

  const dayPerformance = useMemo(() => {
    let totalCompletedSets = 0;
    let totalVolume = 0;
    for (const name of exerciseNames) {
      const p = performanceMap.get(name);
      if (p) {
        totalCompletedSets += p.totalCompletedSets;
        totalVolume += p.history.reduce((sum, h) => sum + h.volume, 0);
      }
    }
    const plannedSets = exercises.reduce((sum, e) => sum + e.sets, 0);
    const completionPercent = plannedSets > 0 ? Math.min(Math.round((totalCompletedSets / plannedSets) * 100), 100) : 0;
    return { totalCompletedSets, totalVolume, completionPercent, exerciseCount: exercises.length };
  }, [performanceMap, exercises]);

  const lastPerformedInfo = useMemo(() => {
    let latestDate: string | null = null;
    let totalSets = 0;
    let maxVolume = 0;
    for (const name of exerciseNames) {
      const p = performanceMap.get(name);
      if (p && p.lastSessionDate) {
        if (!latestDate || p.lastSessionDate > latestDate) latestDate = p.lastSessionDate;
        totalSets += p.totalCompletedSets;
        maxVolume += p.history.reduce((sum, h) => sum + h.volume, 0);
      }
    }
    if (!latestDate) return null;
    const dateLabel = new Date(latestDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return { dateLabel, totalSets, volume: maxVolume };
  }, [performanceMap, exerciseNames]);

  if (day.isRest) {
    const tip = REST_TIPS[index % REST_TIPS.length];
    return (
      <Animated.View entering={FadeInDown.duration(400).delay(index * 60).springify()}>
        <FloatingCard style={{ marginHorizontal: 20, marginBottom: 12 }} padding={16}>
          <View style={styles.restDayRow}>
            <View style={styles.restIconWrap}>
              <Feather name="moon" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restDayTitle}>{day.dayName}</Text>
              <Text style={styles.restDayLabel}>Rest Day</Text>
              <Text style={styles.restTip}>{tip}</Text>
            </View>
          </View>
        </FloatingCard>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 60).springify()}>
      <FloatingCard
        style={[
          { marginHorizontal: 20, marginBottom: 12 },
          isActuallyToday ? ({ borderWidth: 2, borderColor: theme.colors.primary, ...theme.shadow.soft } as any) : null,
        ]}
        padding={0}
      >
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dayName}>{day.dayName}</Text>
            <Text style={styles.workoutName}>{day.focus}</Text>
            {!expanded && (
              <Text style={styles.exCollapsedInfo}>
                {lastPerformedInfo
                  ? `${lastPerformedInfo.dateLabel} · ${lastPerformedInfo.totalSets} sets`
                  : 'Not started yet'}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {day.cardioMinutes && day.cardioMinutes > 0 && (
              <StatPill icon="heart" value={`${day.cardioMinutes}min`} variant="pink" size="sm" />
            )}
            <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.text.muted} />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.statsChipsRow}>
              <View style={styles.statChip}>
                <Text style={styles.statChipValue}>{dayPerformance.exerciseCount}</Text>
                <Text style={styles.statChipLabel}>exercises</Text>
              </View>
              <View style={styles.statChip}>
                <Text style={styles.statChipValue}>{dayPerformance.totalCompletedSets}</Text>
                <Text style={styles.statChipLabel}>sets</Text>
              </View>
            </View>

            <View style={styles.progressBarWrap}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${dayPerformance.completionPercent}%` },
                    dayPerformance.completionPercent >= 100 && { backgroundColor: theme.colors.success },
                  ]}
                />
              </View>
              <Text style={styles.progressBarText}>{dayPerformance.completionPercent}%</Text>
            </View>

            {day.aiNote && (
              <View style={styles.aiNoteRow}>
                <View style={[styles.aiNoteIcon, { backgroundColor: theme.colors.primarySoft }]}>
                  <Feather name="message-circle" size={12} color={theme.colors.primary} />
                </View>
                <Text style={styles.aiNoteText}>{day.aiNote}</Text>
              </View>
            )}

            <View style={styles.exerciseList}>
              {exercises.length > 0 ? (
                exercises.map((ex, ei) => (
                  <ExerciseRowWithData
                    key={`${ex.name}-${ei}`}
                    exercise={ex}
                    performance={performanceMap.get(ex.name)}
                  />
                ))
              ) : (
                <Text style={styles.noExText}>Exercises will populate as AI adapts your plan</Text>
              )}
            </View>

            <View style={styles.dayStartWrap}>
              <GradientButton
                title="Start Workout"
                icon="play"
                iconPosition="left"
                variant="primary"
                size="md"
                onPress={onStart}
              />
            </View>
          </View>
        )}
      </FloatingCard>
    </Animated.View>
  );
}

function StrategyCard({ plan }: { plan: ActivePlan }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginHorizontal: 20, marginTop: 16 }}>
      <FloatingCard padding={0}>
        <TouchableOpacity style={styles.strategyToggle} onPress={() => setOpen(!open)} activeOpacity={0.7}>
          <View style={[styles.strategyIcon, { backgroundColor: theme.colors.primarySoft }]}>
            <Feather name="compass" size={14} color={theme.colors.primary} />
          </View>
          <Text style={styles.strategyToggleText}>Coaching Strategy</Text>
          <Feather name={open ? 'chevron-up' : 'chevron-down'} size={14} color={theme.colors.text.muted} />
        </TouchableOpacity>
        {open && (
          <Animated.View entering={FadeInDown.duration(250)} style={styles.strategyBody}>
            <StrategyRow icon="trending-up" label="Progression" value={plan.progressionStrategy} />
            <StrategyRow icon="heart" label="Cardio" value={plan.cardioStrategy} />
            <StrategyRow icon="moon" label="Recovery" value={plan.recoveryStrategy} />
            {plan.adherenceState && <StrategyRow icon="check-circle" label="Adherence" value={plan.adherenceState} />}
            {plan.fatigueState && <StrategyRow icon="activity" label="Status" value={plan.fatigueState} />}
          </Animated.View>
        )}
      </FloatingCard>
    </View>
  );
}

function StrategyRow({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  return (
    <View style={styles.strategyRow}>
      <Feather name={icon} size={12} color={theme.colors.text.muted} />
      <Text style={styles.strategyLabel}>{label}</Text>
      <Text style={styles.strategyValue}>{value}</Text>
    </View>
  );
}

function EmptyPlanView({ onChat }: { onChat: () => void }) {
  return (
    <View style={styles.emptyRoot}>
      <LinearGradient
        colors={[theme.colors.gradient.hero[0], theme.colors.gradient.hero[1]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyCard}
      >
        <View style={styles.emptyIconWrap}>
          <Feather name="zap" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.emptyTitle}>No Active Plan</Text>
        <Text style={styles.emptySub}>
          Chat with Pulse AI to build a personalized training plan tailored to your goals, recovery, and schedule.
        </Text>
        <GradientButton
          title="Start with AI Coach"
          icon="message-circle"
          iconPosition="left"
          variant="white"
          onPress={onChat}
        />
      </LinearGradient>
    </View>
  );
}

export default function AiTrain() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activePlan = useAiTrainerStore((s) => s.activePlan);
  const hydrate = useAiTrainerStore((s) => s.hydrateFromCache);

  const [performanceMap, setPerformanceMap] = useState<Map<string, ExercisePerformanceData>>(new Map());
  const [dataLoading, setDataLoading] = useState(true);
  useEffect(() => {
    if (!activePlan) {
      hydrate().catch(() => {});
    }
  }, [activePlan, hydrate]);

  useEffect(() => {
    if (!activePlan?.workoutDays) return;
    const names = new Set<string>();
    for (const day of activePlan.workoutDays) {
      if (day.exercises) {
        for (const ex of day.exercises) {
          names.add(ex.name);
        }
      }
    }
    setDataLoading(true);
    fetchAllWorkoutData(Array.from(names))
      .then((map) => {
        setPerformanceMap(map);
        setDataLoading(false);
      })
      .catch(() => setDataLoading(false));
  }, [activePlan]);

  const plan = useMemo(() => activePlan, [activePlan]);

  const todayIdx = new Date().getDay();
  const todayName = DAY_NAMES[todayIdx];
  const todayWorkout = plan?.workoutDays?.find((d) => d.dayName === todayName);
  const isTodayWorkout = todayWorkout && !todayWorkout.isRest;

  const sessionsDone = useMemo(() => {
    if (!plan?.workoutDays) return 0;
    let done = 0;
    for (const day of plan.workoutDays) {
      if (day.isRest) continue;
      const names = (day.exercises || []).map(e => e.name);
      const hasData = names.some(n => (performanceMap.get(n)?.totalCompletedSets || 0) > 0);
      if (hasData) done++;
    }
    return done;
  }, [plan, performanceMap]);

  const totalSessions = plan?.workoutDays?.filter(d => !d.isRest).length || 0;

  if (!plan || !plan.workoutDays || plan.workoutDays.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg.primary }}>
        <StatusBar barStyle="light-content" />
        <EmptyPlanView onChat={() => router.push('/(ai-trainer)/coach')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg.primary }}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <HeroSection height={200}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.heroSub}>Training</Text>
              <Text style={styles.heroTitle}>{plan.weekLabel || `Week ${plan.currentWeek}`}</Text>
              <Text style={styles.heroMeta}>
                {isTodayWorkout ? `${todayWorkout?.focus} today` : 'Rest day · Stretch and recover'}
              </Text>
            </View>
            <ModeBadge mode="ai_trainer" onPress={() => router.push('/settings/mode-switcher')} />
          </View>
        </HeroSection>

        <OverlapCard offset={28} delay={250}>
          <View style={styles.statsRow}>
            <Stat icon="check-circle" value={`${sessionsDone}/${totalSessions}`} label="Sessions" color={theme.colors.success} bg={theme.colors.successSoft} />
            <Stat icon="trending-up" value={totalSessions > 0 ? `${Math.round((sessionsDone / totalSessions) * 100)}%` : '-'} label="Adherence" color={theme.colors.primary} bg={theme.colors.primarySoft} />
            <Stat icon="bar-chart-2" value={`${Array.from(performanceMap.values()).reduce((s, p) => s + (p.bestWeight || 0), 0)}kg`} label="Total Best" color={theme.colors.warning} bg={theme.colors.warningSoft} />
          </View>
        </OverlapCard>

        {isTodayWorkout && todayWorkout && (
          <View style={{ marginTop: 24, marginHorizontal: 20 }}>
            <LinearGradient
              colors={theme.colors.gradient.heroSoft}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.todayCard, theme.shadow.glow]}
            >
              <Text style={styles.todayMicro}>TODAY</Text>
              <Text style={styles.todaySession}>{todayWorkout.focus}</Text>
              <Text style={styles.todaySub}>
                {todayWorkout.exercises?.length || 0} exercises
              </Text>
              <View style={styles.todayMetaRow}>
                <Text style={styles.todayMetaText}>
                  Recovery: {plan.adherenceState || 'Good'}
                </Text>
              </View>
              <GradientButton
                title="Start Session"
                icon="play"
                iconPosition="left"
                variant="white"
                onPress={() => router.push('/(ai-trainer)/workout')}
                style={{ marginTop: 16 }}
              />
            </LinearGradient>
          </View>
        )}

        <View style={{ marginTop: 24 }}>
          <SectionHeader title="This Week" />
          <View style={{ paddingHorizontal: 20 }}>
            <DayStrip
              days={plan.workoutDays.map((d, i) => {
                const state = d.isRest
                  ? 'rest'
                  : i === todayIdx - 1 || (todayIdx === 0 && i === 6)
                  ? 'today'
                  : 'upcoming';
                return { day: d.dayName.slice(0, 3), label: d.isRest ? '' : d.focus.split(' ')[0], state: state as any };
              })}
            />
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Plan Overview" />
          <View style={{ marginHorizontal: 20 }}>
            <PlanHeader plan={plan} />
          </View>
        </View>

        <StrategyCard plan={plan} />

        <View style={{ marginTop: 16 }}>
          <SectionHeader title="Workout Days" />
        </View>
        {plan.workoutDays.map((day, i) => (
          <DayCard
            key={`${day.dayName}-${i}`}
            day={day}
            index={i}
            plan={plan}
            onStart={() => router.push('/(ai-trainer)/workout')}
            performanceMap={performanceMap}
            defaultExpanded={i === 0 && !day.isRest}
          />
        ))}

        <View style={styles.footerNote}>
          <Feather name="refresh-cw" size={12} color={theme.colors.text.muted} />
          <Text style={styles.footerNoteText}>
            AI adapts this plan weekly based on your recovery, adherence, and performance
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, value, label, color, bg }: { icon: React.ComponentProps<typeof Feather>['name']; value: string; label: string; color: string; bg: string }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={14} color={color} strokeWidth={2.5} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: theme.font.size.h1,
    fontWeight: '800',
    fontFamily: theme.font.family.number,
    marginTop: 2,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.caption,
    marginTop: 2,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  todayCard: {
    borderRadius: theme.radius.xl,
    padding: 24,
  },
  todayMicro: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  todaySession: {
    color: '#FFFFFF',
    fontSize: theme.font.size.h1,
    fontWeight: '800',
    marginTop: 4,
    fontFamily: theme.font.family.number,
  },
  todaySub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: theme.font.size.body,
    marginTop: 4,
    fontWeight: '500',
  },
  todayMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  todayMetaText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: theme.font.size.caption,
    fontWeight: '500',
  },
  planHeaderWrap: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 20,
    ...theme.shadow.card,
  },
  planHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planGoal: {
    fontSize: theme.font.size.micro,
    color: theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  planDuration: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  phaseText: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  metaPillText: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  dayName: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  workoutName: {
    fontSize: theme.font.size.title,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  exCollapsedInfo: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  dayStartWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  expandedContent: {
    paddingTop: 0,
  },
  statsChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceTint,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statChipValue: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  statChipLabel: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  progressBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border.solid,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressBarText: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    color: theme.colors.primary,
    fontVariant: ['tabular-nums'],
    width: 32,
    textAlign: 'right',
  },
  aiNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: theme.colors.primarySoft,
    padding: 12,
    borderRadius: theme.radius.md,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  aiNoteIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiNoteText: {
    fontSize: theme.font.size.caption,
    color: theme.colors.primary,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
  exerciseList: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: theme.colors.surfaceTint,
    borderRadius: theme.radius.md,
    padding: 12,
  },
  exerciseTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  exSetReps: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  exStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 2,
  },
  exStat: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  exStatValue: {
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  exStatDot: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    marginHorizontal: 4,
  },
  exNoData: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    marginTop: 6,
  },
  exHistoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
  },
  exHistoryToggleText: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  historyTable: {
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.solid,
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.solid,
  },
  historyCell: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  historyCellHeader: {
    fontWeight: '700',
    color: theme.colors.text.muted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: theme.font.size.micro,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
  },
  noHistoryText: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  restDayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  restIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDayTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  restDayLabel: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    fontWeight: '500',
    marginTop: 1,
  },
  restTip: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.secondary,
    marginTop: 4,
    lineHeight: 15,
    fontWeight: '400',
  },
  noExText: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    textAlign: 'center',
    paddingVertical: 12,
    fontStyle: 'italic',
  },
  strategyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  strategyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyToggleText: {
    flex: 1,
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  strategyBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strategyLabel: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.secondary,
    width: 90,
    fontWeight: '500',
  },
  strategyValue: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  emptyRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: theme.radius['2xl'],
    gap: 12,
    width: '100%',
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: theme.font.size.h1,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: theme.font.size.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  footerNoteText: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
});
