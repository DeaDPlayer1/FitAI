/**
 * NutritionAnalyticsCard — Compact Calorie + Macro Analytics
 * Layout: Left = calories remaining ring + number | Right = 3 macro bars
 * Performance: React.memo, useMemo, AnimatedProgressBar for 60fps fills
 */
import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  delay: number;
}

// Isolated macro bar — memo + Reanimated for 60fps fill
const MacroBar = memo(({ label, value, goal, unit, color, delay }: MacroBarProps) => {
  const progress = useSharedValue(0);
  const pct = useMemo(() => Math.min(value / Math.max(goal, 1), 1), [value, goal]);

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(pct, { duration: 900 }));
  }, [pct, delay]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  return (
    <View style={styles.macroItem}>
      <View style={styles.macroLabelRow}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {Math.round(value)}<Text style={styles.macroUnit}>/{goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.macroTrack}>
        <Animated.View style={[styles.macroFill, { backgroundColor: color }, barStyle]} />
      </View>
    </View>
  );
});
MacroBar.displayName = 'MacroBar';

// Remaining calories donut ring
interface CalRingProps {
  remaining: number;
  goal: number;
}

const CAL_RING_SIZE = 80;
const CAL_STROKE = 8;
const CAL_RADIUS = (CAL_RING_SIZE - CAL_STROKE) / 2;
const CAL_CIRCUMFERENCE = CAL_RADIUS * 2 * Math.PI;

const CalRemainingRing = memo(({ remaining, goal }: CalRingProps) => {
  const progress = useSharedValue(0);
  const pct = useMemo(() => Math.min(1 - remaining / Math.max(goal, 1), 1), [remaining, goal]);

  useEffect(() => {
    progress.value = withDelay(200, withTiming(pct, { duration: 1200 }));
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CAL_CIRCUMFERENCE - progress.value * CAL_CIRCUMFERENCE,
  }));

  return (
    <View style={styles.ringContainer}>
      <Svg width={CAL_RING_SIZE} height={CAL_RING_SIZE}>
        <Defs>
          <SvgLinearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={theme.colors.accent.green} />
            <Stop offset="100%" stopColor="#06D6A0" />
          </SvgLinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={CAL_RING_SIZE / 2}
          cy={CAL_RING_SIZE / 2}
          r={CAL_RADIUS}
          stroke="#F3F4F6"
          strokeWidth={CAL_STROKE}
          fill="none"
        />
        {/* Fill */}
        <AnimatedCircle
          cx={CAL_RING_SIZE / 2}
          cy={CAL_RING_SIZE / 2}
          r={CAL_RADIUS}
          stroke="url(#calGrad)"
          strokeWidth={CAL_STROKE}
          strokeDasharray={CAL_CIRCUMFERENCE}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${CAL_RING_SIZE / 2} ${CAL_RING_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.ringTextBox}>
        <Text style={styles.ringNumber}>{Math.round(remaining)}</Text>
        <Text style={styles.ringLabel}>left</Text>
      </View>
    </View>
  );
});
CalRemainingRing.displayName = 'CalRemainingRing';

interface NutritionAnalyticsCardProps {
  caloriesLogged: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
}

const NutritionAnalyticsCardComponent = ({
  caloriesLogged,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fat,
  fatGoal,
}: NutritionAnalyticsCardProps) => {
  const remaining = useMemo(() => Math.max(calorieGoal - caloriesLogged, 0), [calorieGoal, caloriesLogged]);
  const percentConsumed = useMemo(
    () => Math.min(Math.round((caloriesLogged / Math.max(calorieGoal, 1)) * 100), 100),
    [caloriesLogged, calorieGoal]
  );

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Nutrition</Text>
        <View style={styles.percentBadge}>
          <Text style={styles.percentText}>{percentConsumed}% consumed</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Left: Remaining Ring */}
        <View style={styles.leftCol}>
          <CalRemainingRing remaining={remaining} goal={calorieGoal} />
          <Text style={styles.goalLabel}>of {calorieGoal} kcal</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Right: Macro Bars */}
        <View style={styles.rightCol}>
          <MacroBar
            label="Protein"
            value={protein}
            goal={proteinGoal}
            unit="g"
            color={theme.colors.accent.green}
            delay={300}
          />
          <MacroBar
            label="Carbs"
            value={carbs}
            goal={carbsGoal}
            unit="g"
            color="#FF9500"
            delay={450}
          />
          <MacroBar
            label="Fat"
            value={fat}
            goal={fatGoal}
            unit="g"
            color={theme.colors.accent.blue}
            delay={600}
          />
        </View>
      </View>
    </View>
  );
};

export const NutritionAnalyticsCard = memo(NutritionAnalyticsCardComponent);
export default NutritionAnalyticsCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  percentBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
  },
  percentText: {
    fontSize: 10,
    fontFamily: theme.family.medium,
    color: theme.colors.accent.green,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  leftCol: {
    alignItems: 'center',
    gap: 4,
    minWidth: 88,
  },
  ringContainer: {
    width: CAL_RING_SIZE,
    height: CAL_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTextBox: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringNumber: {
    fontSize: 18,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  ringLabel: {
    fontSize: 9,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalLabel: {
    fontSize: 10,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginHorizontal: 14,
  },
  rightCol: {
    flex: 1,
    gap: 10,
  },
  macroItem: {
    gap: 5,
  },
  macroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  macroLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: theme.family.medium,
    color: theme.colors.text.secondary,
  },
  macroValue: {
    fontSize: 11,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
  },
  macroUnit: {
    fontSize: 10,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
  },
  macroTrack: {
    height: 5,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: 5,
    borderRadius: 3,
  },
});
