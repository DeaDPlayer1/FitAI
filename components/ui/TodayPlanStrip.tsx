/**
 * TodayPlanStrip — Horizontal Scrollable Quick Status Cards
 * Shows: Workout, Meals Remaining, Water Remaining, Steps Target
 * Performance: React.memo, useMemo, static styles, useCallback handlers
 */
import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface PlanCard {
  id: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  value: string;
  subtext: string;
  progress: number;
  color: string;
  actionLabel: string;
}

interface TodayPlanStripProps {
  mealsLogged: number;
  mealsTotal?: number;
  waterLogged: number;
  waterGoal?: number;
  stepsLogged: number;
  stepsGoal?: number;
  hasWorkout?: boolean;
  onStartWorkout?: () => void;
  onAddMeal?: () => void;
  onAddWater?: () => void;
  onViewSteps?: () => void;
}

// Isolated animated card — prevents full list rerender on single tap
const PlanCardItem = memo(({ card, onPress }: { card: PlanCard; onPress: (id: string) => void }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(card.id);
  }, [onPress, card.id]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const progressPct = useMemo(() => Math.min(card.progress * 100, 100), [card.progress]);

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.cardTouchable}
      >
        {/* Icon Badge */}
        <View style={[styles.cardIcon, { backgroundColor: card.color + '1A' }]}>
          <Feather name={card.icon} size={16} color={card.color} />
        </View>

        {/* Title */}
        <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>

        {/* Value */}
        <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
        <Text style={styles.cardSub}>{card.subtext}</Text>

        {/* Mini Progress */}
        <View style={styles.miniTrack}>
          <View
            style={[
              styles.miniFill,
              {
                width: `${progressPct}%` as any,
                backgroundColor: card.color,
              },
            ]}
          />
        </View>

        {/* Action */}
        <Text style={[styles.cardAction, { color: card.color }]}>{card.actionLabel}</Text>
      </Pressable>
    </Animated.View>
  );
});

PlanCardItem.displayName = 'PlanCardItem';

const TodayPlanStripComponent = ({
  mealsLogged,
  mealsTotal = 3,
  waterLogged,
  waterGoal = 8,
  stepsLogged,
  stepsGoal = 10000,
  hasWorkout = false,
  onStartWorkout,
  onAddMeal,
  onAddWater,
  onViewSteps,
}: TodayPlanStripProps) => {
  const handleCardPress = useCallback(
    (id: string) => {
      if (id === 'workout') onStartWorkout?.();
      else if (id === 'meals') onAddMeal?.();
      else if (id === 'water') onAddWater?.();
      else if (id === 'steps') onViewSteps?.();
    },
    [onStartWorkout, onAddMeal, onAddWater, onViewSteps]
  );

  const cards = useMemo<PlanCard[]>(() => [
    {
      id: 'workout',
      icon: hasWorkout ? 'check-circle' : 'play-circle',
      title: 'Workout',
      value: hasWorkout ? 'Done' : 'Start',
      subtext: hasWorkout ? 'Completed' : 'Ready',
      progress: hasWorkout ? 1 : 0,
      color: theme.colors.accent.green,
      actionLabel: hasWorkout ? '✓ Complete' : 'Tap to Start →',
    },
    {
      id: 'meals',
      icon: 'coffee',
      title: 'Meals',
      value: `${mealsLogged}/${mealsTotal}`,
      subtext: `${mealsTotal - mealsLogged} remaining`,
      progress: mealsLogged / mealsTotal,
      color: '#FF9500',
      actionLabel: 'Log meal →',
    },
    {
      id: 'water',
      icon: 'droplet',
      title: 'Water',
      value: `${waterLogged}/${waterGoal}`,
      subtext: `${Math.max(waterGoal - waterLogged, 0)} more glasses`,
      progress: waterLogged / waterGoal,
      color: theme.colors.accent.blue,
      actionLabel: 'Add glass →',
    },
    {
      id: 'steps',
      icon: 'activity',
      title: 'Steps',
      value: stepsLogged >= 1000 ? `${(stepsLogged / 1000).toFixed(1)}k` : `${stepsLogged}`,
      subtext: `of ${(stepsGoal / 1000).toFixed(0)}k goal`,
      progress: stepsLogged / stepsGoal,
      color: '#FF6B6B',
      actionLabel: 'View trend →',
    },
  ], [hasWorkout, mealsLogged, mealsTotal, waterLogged, waterGoal, stepsLogged, stepsGoal]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Plan</Text>
        <Feather name="chevron-right" size={16} color={theme.colors.text.muted} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={128}
        snapToAlignment="start"
      >
        {cards.map((card) => (
          <PlanCardItem key={card.id} card={card} onPress={handleCardPress} />
        ))}
      </ScrollView>
    </View>
  );
};

export const TodayPlanStrip = memo(TodayPlanStripComponent);
export default TodayPlanStrip;

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingRight: 16,
    gap: 10,
  },
  card: {
    width: 118,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardTouchable: {
    padding: 14,
    gap: 4,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: theme.family.medium,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardValue: {
    fontSize: 20,
    fontFamily: theme.family.heading,
    lineHeight: 24,
    marginTop: 2,
  },
  cardSub: {
    fontSize: 10,
    fontFamily: theme.family.body,
    color: theme.colors.text.muted,
  },
  miniTrack: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  miniFill: {
    height: 3,
    borderRadius: 2,
  },
  cardAction: {
    fontSize: 10,
    fontFamily: theme.family.medium,
    letterSpacing: 0.3,
  },
});
