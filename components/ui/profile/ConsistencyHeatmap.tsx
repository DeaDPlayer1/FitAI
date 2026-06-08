import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_PADDING = 40;
const CELL_SIZE = Math.floor((SCREEN_W - GRID_PADDING - 28) / 13);
const CELL_GAP = 2;

const LEVELS = [
  { min: 0, color: theme.colors.bg.tertiary },
  { min: 1, color: '#EDE9FE' },
  { min: 3, color: '#C4B5FD' },
  { min: 5, color: '#8B5CF6' },
  { min: 7, color: theme.colors.primary },
];

function getColor(value: number): string {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (value >= LEVELS[i].min) return LEVELS[i].color;
  }
  return LEVELS[0].color;
}

interface ActivityEntry {
  logged_at: string;
  minutes_active: number;
  workout_completed: boolean;
}

interface ConsistencyHeatmapProps {
  data: ActivityEntry[];
  monthsToShow?: number;
}

export function ConsistencyHeatmap({ data, monthsToShow = 3 }: ConsistencyHeatmapProps) {
  const cells = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      const dateKey = d.logged_at ? d.logged_at.split('T')[0] : '';
      if (dateKey) map.set(dateKey, d.minutes_active);
    });

    const result: { date: string; value: number; key: string }[] = [];
    const now = new Date();
    const totalDays = monthsToShow * 30;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const value = map.get(key) || 0;
      result.push({ date: key, value, key });
    }
    return result;
  }, [data, monthsToShow]);

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekCol}>
            {week.map((cell, ci) => (
              <Animated.View
                key={cell.key}
                entering={FadeIn.delay((wi * 7 + ci) * 4).duration(200)}
                style={[styles.cell, { backgroundColor: getColor(cell.value) }]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {LEVELS.map((l, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: l.color }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 14,
    ...theme.shadow.card,
  },
  grid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekCol: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  legendLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: theme.colors.text.muted,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});

export default ConsistencyHeatmap;
