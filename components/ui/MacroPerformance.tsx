import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface MacroPerformanceProps {
  macros: {
    label: string;
    value: number;
    target: number;
    color: string;
    softColor: string;
    gradient: [string, string];
    icon: React.ComponentProps<typeof Feather>['name'];
    insight: string;
  }[];
}

function MacroCard({
  macro,
  index,
}: {
  macro: MacroPerformanceProps['macros'][0];
  index: number;
}) {
  const progress = macro.target > 0 ? Math.min(macro.value / macro.target, 1) : 0;
  const fillWidth = useSharedValue(0);

  useEffect(() => {
    fillWidth.value = withDelay(200 + index * 150, withTiming(progress, { duration: 900, easing: Easing.out(Easing.quad) }));
  }, [progress, index, fillWidth]);

  const barAnim = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  const isComplete = macro.value >= macro.target;

  return (
    <LinearGradient
      colors={macro.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: macro.color + '20' }]}>
          <Feather name={macro.icon} size={16} color={macro.color} />
        </View>
        {isComplete && (
          <View style={[styles.goalBadge, { backgroundColor: macro.color + '20' }]}>
            <Feather name="check" size={10} color={macro.color} />
            <Text style={[styles.goalBadgeText, { color: macro.color }]}>Goal</Text>
          </View>
        )}
      </View>

      <Text style={styles.label}>{macro.label}</Text>

      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: macro.color }]}>{Math.round(macro.value)}</Text>
        <Text style={styles.target}> / {macro.target}g</Text>
      </View>

      <View style={[styles.track, { backgroundColor: macro.color + '15' }]}>
        <Animated.View style={[styles.fill, { backgroundColor: macro.color }, barAnim]} />
      </View>

      <Text style={styles.insight}>{macro.insight}</Text>
    </LinearGradient>
  );
}

export function MacroPerformance({ macros }: MacroPerformanceProps) {
  if (macros.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {macros.map((m, i) => (
        <MacroCard key={m.label} macro={m} index={i} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    width: 160,
    borderRadius: theme.radius.xl,
    padding: 16,
    gap: 8,
    ...theme.shadow.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
  },
  goalBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  label: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: theme.font.family.heading,
    fontVariant: ['tabular-nums'],
  },
  target: {
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    color: theme.colors.text.muted,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  insight: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    lineHeight: 14,
  },
});

export default MacroPerformance;
