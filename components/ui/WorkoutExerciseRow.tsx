// UI: Single exercise row inside workout card with safe property rendering
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

interface WorkoutExerciseRowProps {
  item: any;
}

export const WorkoutExerciseRow: React.FC<WorkoutExerciseRowProps> = ({ item }) => {
  const name = item?.exercise_name ?? item?.name ?? item?.exercise ?? 'Exercise';
  
  // Safely parse sets and reps
  const setNum = Array.isArray(item?.sets) ? item.sets.length : (item?.sets || 0);
  
  let repsDisplay = String(item?.reps || '');
  if (Array.isArray(item?.sets) && item.sets.length > 0 && !item?.reps) {
    repsDisplay = `${item.sets[0].reps}`;
  } else if (!repsDisplay || repsDisplay === 'undefined') {
    repsDisplay = '--';
  }

  const restDisplay = item?.rest_seconds || item?.restTime || 0;

  return (
    <View style={styles.container}>
      <View style={styles.dotContainer}>
        <View style={styles.dot} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            <Text style={styles.mono}>{setNum}</Text> sets × <Text style={styles.mono}>{repsDisplay}</Text> reps
          </Text>
          <Text style={styles.metaDivider}>·</Text>
          <Text style={styles.metaText}>
            rest <Text style={styles.mono}>{restDisplay}</Text>s
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.solid,
    backgroundColor: 'transparent',
  },
  dotContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent.primary,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: theme.text.primary,
    fontSize: theme.font.size.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: theme.text.muted,
    fontSize: theme.font.size.sm,
  },
  metaDivider: {
    color: theme.text.muted,
    marginHorizontal: theme.spacing.sm,
  },
  mono: {
    fontVariant: ['tabular-nums'],
    color: theme.text.secondary,
  },
});
