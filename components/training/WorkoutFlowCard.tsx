import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import type { ExercisePerformanceData } from '@/lib/workoutDataService';
import InlineExerciseCard from './InlineExerciseCard';

interface ExItem { name: string; sets: number; reps: string; }

const REST_TIPS = [
  'Active recovery promotes blood flow',
  'Sleep 7-9 hours for muscle repair',
  'Light stretching aids recovery',
  'Stay hydrated for nutrient transport',
  'Foam rolling releases tension',
];

interface WorkoutFlowCardProps {
  dayLabel: string;
  workoutName?: string;
  exerciseCount?: number;
  isToday: boolean;
  isCompleted: boolean;
  isRest: boolean;
  expanded: boolean;
  onToggle: () => void;
  onStart?: () => void;
  muscles?: string[];
  exercises?: ExItem[];
  aiNote?: string;
  index: number;
  performanceMap?: Map<string, ExercisePerformanceData>;
}

function fmtShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function WorkoutFlowCard({
  dayLabel, workoutName, isToday, isRest,
  expanded, onToggle, onStart, muscles = [], exercises = [], index,
  performanceMap,
}: WorkoutFlowCardProps) {
  const tip = useMemo(() => REST_TIPS[index % REST_TIPS.length], [index]);

  const dayPerf = useMemo(() => {
    let completed = 0;
    let latest: string | null = null;
    for (const ex of exercises) {
      const p = performanceMap?.get(ex.name);
      if (p) {
        completed += p.totalCompletedSets;
        if (p.lastSessionDate && (!latest || p.lastSessionDate > latest)) latest = p.lastSessionDate;
      }
    }
    const planned = exercises.reduce((s, e) => s + e.sets, 0);
    return { completed, planned, count: exercises.length, latest };
  }, [performanceMap, exercises]);

  const totalPlanned = exercises.reduce((s, e) => s + e.sets, 0);

  // ── Rest Day ──
  if (isRest) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).springify()} layout={Layout.springify()}>
        <View style={s.card}>
          <View style={s.restRow}>
            <View style={s.dayBadge}>
              <Text style={s.dayBadgeText}>{dayLabel.slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.restTitle}>Rest Day</Text>
              <Text style={s.restTip}>{tip}</Text>
            </View>
            <Feather name="moon" size={16} color={theme.colors.primary} />
          </View>
        </View>
      </Animated.View>
    );
  }

  // ── SECTION 1: HEADER ──
  const header = (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={s.header}>
      <View style={s.hLeft}>
        <View style={[s.dayBadge, isToday && s.dayBadgeToday]}>
          <Text style={[s.dayBadgeText, isToday && s.dayBadgeTextToday]}>{dayLabel.slice(0, 1)}</Text>
          {isToday && <View style={s.liveDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.workoutName} numberOfLines={1}>{workoutName || dayLabel}</Text>
          {!expanded && dayPerf.latest && (
            <Text style={s.lastLine}>{fmtShort(dayPerf.latest)} · {dayPerf.completed} sets</Text>
          )}
          {!expanded && !dayPerf.latest && (
            <Text style={s.lastLine}>Not started yet</Text>
          )}
        </View>
      </View>
      <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.text.muted} />
    </TouchableOpacity>
  );

  // ── SECTION 2: METRICS ──
  const totalCompleted = dayPerf.completed;
  const showCompleted = totalCompleted > 0;
  const setsLabel = showCompleted ? `${totalCompleted} / ${totalPlanned}` : String(totalPlanned);

  const metrics = (
    <View style={s.metrics}>
      <View style={s.pill}>
        <Text style={s.pillVal}>{exercises.length}</Text>
        <Text style={s.pillLbl}>Exercises</Text>
      </View>
      <View style={s.pill}>
        <Text style={s.pillVal}>{setsLabel}</Text>
        <Text style={s.pillLbl}>Sets</Text>
      </View>
      <View style={[s.pill, s.pillDark]}>
        <Text style={[s.pillVal, s.pillValLight]}>–</Text>
        <Text style={[s.pillLbl, s.pillLblLight]}>Duration</Text>
      </View>
    </View>
  );

  // ── SECTION 3: EXERCISE CARDS ──
  const exerciseList = exercises.length > 0 && (
    <View style={s.exSection}>
      {exercises.slice(0, 10).map((ex, i) => (
        <Animated.View key={ex.name + i} entering={FadeIn.delay(i * 30)} layout={Layout.springify()}>
          <InlineExerciseCard
            name={ex.name}
            sets={ex.sets}
            reps={ex.reps}
            performance={performanceMap?.get(ex.name)}
          />
        </Animated.View>
      ))}
      {exercises.length > 10 && (
        <Text style={s.exMore}>+{exercises.length - 10} more exercises</Text>
      )}
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(18)} layout={Layout.springify()}>
      <View style={[s.card, isToday && s.todayCard]}>
        {header}
        {expanded && (
          <Animated.View entering={FadeIn.duration(200)} style={s.expArea}>
            <View style={s.divider} />
            {metrics}
            <View style={s.divider} />
            {muscles.length > 0 && (
              <View style={s.muscleRow}>
                <Feather name="target" size={11} color={theme.colors.text.muted} />
                {muscles.map(m => (
                  <View key={m} style={s.muscleChip}>
                    <Text style={s.muscleChipText}>{m.replace(/\b\w/g, c => c.toUpperCase())}</Text>
                  </View>
                ))}
              </View>
            )}
            {exerciseList}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.secondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
  },
  todayCard: { borderColor: theme.colors.border.medium },

  // ── HEADER ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 8,
  },
  hLeft: {
    flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10,
  },
  dayBadge: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: theme.colors.bg.tertiary,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  dayBadgeToday: { backgroundColor: theme.colors.primary },
  dayBadgeText: { fontSize: 13, fontWeight: '700', color: theme.colors.text.muted },
  dayBadgeTextToday: { color: '#FFFFFF' },
  liveDot: {
    position: 'absolute', top: -2, right: -2,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: theme.colors.success,
    borderWidth: 1.5, borderColor: theme.colors.bg.secondary,
  },
  workoutName: {
    fontSize: 14, fontWeight: '700', color: theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  lastLine: {
    fontSize: 10, color: theme.colors.text.muted,
    marginTop: 1, fontWeight: '500',
  },

  // ── MUSCLE ROW ──
  muscleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, flexWrap: 'wrap',
  },
  muscleChip: {
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  muscleChipText: {
    fontSize: 9, fontWeight: '600', color: theme.colors.text.muted,
  },

  // ── METRICS ──
  metrics: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 12, paddingVertical: 2,
  },
  pill: {
    flex: 1, alignItems: 'center',
    backgroundColor: theme.colors.bg.tertiary,
    borderRadius: 10, paddingVertical: 7, gap: 1,
  },
  pillDark: { backgroundColor: theme.colors.primary },
  pillVal: {
    fontSize: 14, fontWeight: '800', color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'], letterSpacing: -0.3,
  },
  pillValLight: { color: '#FFFFFF' },
  pillLbl: {
    fontSize: 8, fontWeight: '600', color: theme.colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  pillLblLight: { color: 'rgba(255,255,255,0.7)' },

  // ── EXERCISE SECTION ──
  exSection: { gap: 4, paddingHorizontal: 12, paddingBottom: 4 },
  exMore: {
    textAlign: 'center', fontSize: 10, color: theme.colors.text.muted,
    fontWeight: '500', paddingVertical: 4,
  },

  // ── DIVIDER ──
  divider: { height: 1, backgroundColor: theme.colors.border.subtle, marginVertical: 3 },

  // ── EXPANDED AREA ──
  expArea: { gap: 4, paddingBottom: 4 },

  // ── REST DAY ──
  restRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  restTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary },
  restTip: {
    fontSize: 10, color: theme.colors.text.muted, fontWeight: '500',
    marginTop: 1, lineHeight: 14,
  },
});
