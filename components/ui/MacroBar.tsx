/**
 * MacroBar — Tinted progress bar for a single macro (protein/carbs/fat).
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color: string;
  unit?: string;
  delay?: number;
  showValue?: boolean;
}

export function MacroBar({ label, value, target, color, unit = 'g', delay = 0, showValue = true }: MacroBarProps) {
  const progress = useSharedValue(0);
  const pct = target > 0 ? Math.max(0, Math.min(value / target, 1)) : 0;

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(pct, { duration: 900 }));
  }, [pct, delay, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        {showValue && (
          <Text style={styles.value}>
            {Math.round(value)}<Text style={styles.target}>/{Math.round(target)}{unit}</Text>
          </Text>
        )}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: theme.font.size.body,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  value: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  target: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  track: {
    height: 6,
    backgroundColor: '#F0EEFC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default MacroBar;
