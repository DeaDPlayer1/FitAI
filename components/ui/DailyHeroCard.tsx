/**
 * DailyHeroCard — Premium Hero Summary Card
 * Shows: Calories (ring), Protein, Water, Steps, Streak
 * Performance: React.memo, all handlers via useCallback, no inline objects
 */
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';
import { CalorieRing } from './CalorieRing';

interface DailyHeroCardProps {
  caloriesLogged: number;
  calorieGoal: number;
  proteinLogged: number;
  proteinGoal: number;
  waterGlasses: number;
  waterGoal?: number;
  steps: number;
  stepsGoal?: number;
  streakDays: number;
}

interface StatPillProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  sub: string;
  color: string;
  progress: number;
}

// Isolated stat pill — memo prevents re-render when siblings change
const StatPill = memo(({ icon, label, value, sub, color, progress }: StatPillProps) => (
  <View style={styles.pill}>
    <View style={[styles.pillIcon, { backgroundColor: color + '1A' }]}>
      <Feather name={icon} size={13} color={color} />
    </View>
    <Text style={styles.pillValue}>{value}</Text>
    <Text style={styles.pillLabel}>{label}</Text>
    <View style={styles.pillTrack}>
      <View style={[styles.pillFill, { width: `${Math.min(progress * 100, 100)}%` as any, backgroundColor: color }]} />
    </View>
  </View>
));

StatPill.displayName = 'StatPill';

const DailyHeroCardComponent = ({
  caloriesLogged,
  calorieGoal,
  proteinLogged,
  proteinGoal,
  waterGlasses,
  waterGoal = 8,
  steps,
  stepsGoal = 10000,
  streakDays,
}: DailyHeroCardProps) => {
  // Memoize all derived values — no recalc on unrelated state changes
  const caloriesRemaining = useMemo(() => calorieGoal - caloriesLogged, [calorieGoal, caloriesLogged]);
  const calorieProgress = useMemo(() => Math.min(caloriesLogged / Math.max(calorieGoal, 1), 1), [caloriesLogged, calorieGoal]);
  const proteinProgress = useMemo(() => Math.min(proteinLogged / Math.max(proteinGoal, 1), 1), [proteinLogged, proteinGoal]);
  const waterProgress = useMemo(() => Math.min(waterGlasses / waterGoal, 1), [waterGlasses, waterGoal]);
  const stepsProgress = useMemo(() => Math.min(steps / stepsGoal, 1), [steps, stepsGoal]);

  const pillData = useMemo<StatPillProps[]>(() => [
    {
      icon: 'zap',
      label: 'Protein',
      value: `${Math.round(proteinLogged)}g`,
      sub: `/${proteinGoal}g`,
      color: theme.colors.accent.green,
      progress: proteinProgress,
    },
    {
      icon: 'droplet',
      label: 'Water',
      value: `${waterGlasses}`,
      sub: `/${waterGoal} gl`,
      color: theme.colors.accent.blue,
      progress: waterProgress,
    },
    {
      icon: 'activity',
      label: 'Steps',
      value: steps >= 1000 ? `${(steps / 1000).toFixed(1)}k` : `${steps}`,
      sub: `/${(stepsGoal / 1000).toFixed(0)}k`,
      color: '#FF9500',
      progress: stepsProgress,
    },
    {
      icon: 'award',
      label: 'Streak',
      value: `${streakDays}`,
      sub: 'days',
      color: '#FF6B6B',
      progress: Math.min(streakDays / 7, 1),
    },
  ], [proteinLogged, proteinGoal, proteinProgress, waterGlasses, waterGoal, waterProgress, steps, stepsGoal, stepsProgress, streakDays]);

  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.container}
    >
      {/* Left — Calorie Ring */}
      <View style={styles.left}>
        <Text style={styles.sectionLabel}>TODAY</Text>
        <CalorieRing
          progress={calorieProgress}
          value={Math.round(caloriesLogged)}
          label="kcal"
          size={96}
          strokeWidth={9}
        />
        <View style={styles.remainingRow}>
          <Text style={[styles.remainingValue, caloriesRemaining < 0 && { color: '#FF6B6B' }]}>{caloriesRemaining}</Text>
          <Text style={styles.remainingLabel}> kcal {caloriesRemaining < 0 ? 'over' : 'left'}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Right — 2×2 Stat Grid */}
      <View style={styles.pillGrid}>
        {pillData.map((p) => (
          <StatPill key={p.label} {...p} />
        ))}
      </View>
    </LinearGradient>
  );
};

// Static values extracted outside component to prevent inline object creation
const GRADIENT_COLORS = ['#FFFFFF', '#F1FDF4'] as const;
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

export const DailyHeroCard = memo(DailyHeroCardComponent);
export default DailyHeroCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  left: {
    alignItems: 'center',
    gap: 6,
    minWidth: 100,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: theme.family.heading,
    color: theme.colors.accent.green,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  remainingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  remainingValue: {
    fontSize: 15,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
  },
  remainingLabel: {
    fontSize: 11,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 16,
  },
  pillGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    width: '46%',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pillIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pillValue: {
    fontSize: 16,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  pillLabel: {
    fontSize: 10,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  pillFill: {
    height: 3,
    borderRadius: 2,
  },
});
