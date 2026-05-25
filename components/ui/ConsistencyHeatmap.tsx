import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface ConsistencyHeatmapProps {
  // array of ISO date strings when user worked out
  workoutDates: string[];
}

export default function ConsistencyHeatmap({ workoutDates }: ConsistencyHeatmapProps) {
  // Generate last 28 days
  const grid = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const workedOut = workoutDates.some(wd => wd.startsWith(iso));
      days.push({
        date: iso,
        active: workedOut,
      });
    }
    return days;
  }, [workoutDates]);

  // Group into weeks (columns)
  const weeks = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consistency</Text>
      <View style={styles.grid}>
        {weeks.map((week, wIdx) => (
          <View key={`week-${wIdx}`} style={styles.column}>
            {week.map((day, dIdx) => (
              <View
                key={`day-${dIdx}`}
                style={[
                  styles.cell,
                  day.active ? styles.cellActive : styles.cellInactive
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.cell, styles.cellInactive]} />
        <View style={[styles.cell, styles.cellActive, { opacity: 0.5 }]} />
        <View style={[styles.cell, styles.cellActive]} />
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: theme.radius.xl,
    ...theme.shadow.card,
  },
  title: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    gap: 8,
  },
  cell: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  cellInactive: {
    backgroundColor: '#F3F4F6',
  },
  cellActive: {
    backgroundColor: theme.colors.accent.brand,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
});
