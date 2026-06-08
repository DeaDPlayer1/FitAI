import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const DAY_W = (SCREEN_W - 64) / 7;

interface TrainingDay {
  dayLabel: string;
  workoutName?: string;
  isRest: boolean;
  isToday: boolean;
  isCompleted: boolean;
  intensity?: 'low' | 'moderate' | 'high';
  muscleGroup?: string;
  onPress?: () => void;
}

interface TrainingTimelineProps {
  days: TrainingDay[];
  splitName?: string;
  onEdit?: () => void;
}

function getIntensityColor(intensity?: string): string {
  switch (intensity) {
    case 'high': return theme.colors.danger;
    case 'moderate': return theme.colors.warning;
    case 'low': return theme.colors.success;
    default: return theme.colors.primarySoft;
  }
}

function DayCell({ day }: { day: TrainingDay }) {
  const intensityColor = day.isRest
    ? theme.colors.border.soft
    : getIntensityColor(day.intensity);

  return (
    <View style={styles.dayCell}>
      <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>
        {day.dayLabel.slice(0, 2)}
      </Text>
      <TouchableOpacity
        onPress={day.onPress}
        activeOpacity={0.7}
        style={[
          styles.dayCircle,
          day.isToday && styles.dayCircleToday,
          day.isCompleted && styles.dayCircleCompleted,
          day.isRest && styles.dayCircleRest,
          { borderColor: day.isRest ? theme.colors.border.soft : intensityColor },
        ]}
      >
        {day.isCompleted ? (
          <Feather name="check" size={14} color="#FFFFFF" />
        ) : day.isRest ? (
          <Feather name="moon" size={12} color={theme.colors.text.muted} />
        ) : (
          <View style={[styles.intensityDot, { backgroundColor: intensityColor }]} />
        )}
      </TouchableOpacity>
      <Text style={styles.dayWorkoutName} numberOfLines={1}>
        {day.isRest ? 'Rest' : day.workoutName || 'Workout'}
      </Text>
      {day.isToday && !day.isRest && (
        <View style={styles.todayIndicator}>
          <Text style={styles.todayIndicatorText}>TODAY</Text>
        </View>
      )}
    </View>
  );
}

export function TrainingTimeline({ days, splitName, onEdit }: TrainingTimelineProps) {
  if (days.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Feather name="calendar" size={24} color={theme.colors.text.muted} />
        <Text style={styles.emptyTitle}>No training split</Text>
        <Text style={styles.emptySub}>Create a split to see your weekly plan</Text>
        {onEdit && (
          <TouchableOpacity style={styles.createBtn} onPress={onEdit} activeOpacity={0.7}>
            <Text style={styles.createBtnText}>Create Split</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {splitName && (
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Feather name="layers" size={14} color={theme.colors.primary} />
            </View>
            <Text style={styles.headerTitle}>{splitName}</Text>
          </View>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.editBtn} activeOpacity={0.7}>
              <Feather name="edit-2" size={14} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.weekRow}>
        {days.map((day, i) => (
          <DayCell key={i} day={day} />
        ))}
      </View>

      {days.filter(d => !d.isRest).length > 0 && (
        <View style={styles.legendRow}>
          <Text style={styles.legendText}>
            {days.filter(d => d.isCompleted).length}/{days.filter(d => !d.isRest).length} workouts done
          </Text>
          <Text style={styles.legendTextSep}>·</Text>
          <Text style={styles.legendText}>
            {days.filter(d => !d.isRest).length} days this week
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 18,
    marginHorizontal: 20,
    ...theme.shadow.card,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 24,
    marginHorizontal: 20,
    alignItems: 'center',
    gap: 8,
    ...theme.shadow.card,
  },
  emptyTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  emptySub: {
    fontSize: theme.font.size.caption,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  createBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: theme.font.size.caption,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: DAY_W,
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.text.muted,
  },
  dayLabelToday: {
    color: theme.colors.primary,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceTint,
    borderWidth: 2,
    borderColor: theme.colors.border.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    ...theme.shadow.soft,
  },
  dayCircleCompleted: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  dayCircleRest: {
    backgroundColor: theme.colors.surfaceTint,
    borderColor: theme.colors.border.soft,
  },
  intensityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayWorkoutName: {
    fontSize: 9,
    color: theme.colors.text.muted,
    fontWeight: '500',
    textAlign: 'center',
    width: DAY_W,
  },
  todayIndicator: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  todayIndicatorText: {
    fontSize: 7,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.muted,
    fontWeight: '500',
  },
  legendTextSep: {
    fontSize: theme.font.size.micro,
    color: theme.colors.text.disabled,
    fontWeight: '500',
  },
});

export default TrainingTimeline;
