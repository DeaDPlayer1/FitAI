/**
 * WeekCalendar — Compact Activity Strip (Redesigned)
 * Replaces oversized calendar with a slim 72px weekly strip
 * Performance: React.memo, useCallback, useMemo, Reanimated press scale
 */
import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface WeekCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  activeDates?: string[];
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

// Isolated day cell — memo prevents full week re-render on single day change
const DayCell = memo(({
  date,
  dayLabel,
  isSelected,
  isToday,
  hasData,
  onPress,
}: {
  date: Date;
  dayLabel: string;
  isSelected: boolean;
  isToday: boolean;
  hasData: boolean;
  onPress: (d: Date) => void;
}) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.88, { damping: 12, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
    onPress(date);
  }, [scale, onPress, date]);

  return (
    <Animated.View style={[styles.dayWrapper, animStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.dayTouchable}
      >
        {/* Day name */}
        <Text style={[styles.dayLabel, isToday && !isSelected && styles.dayLabelToday]}>
          {dayLabel}
        </Text>

        {/* Date circle */}
        <View
          style={[
            styles.dateCircle,
            isSelected && styles.dateCircleSelected,
            isToday && !isSelected && styles.dateCircleToday,
          ]}
        >
          <Text
            style={[
              styles.dateText,
              isSelected && styles.dateTextSelected,
              isToday && !isSelected && styles.dateTextToday,
            ]}
          >
            {date.getDate()}
          </Text>
        </View>

        {/* Activity dot */}
        <View style={styles.dotArea}>
          {hasData && !isSelected && (
            <View style={styles.activityDot} />
          )}
          {isToday && !isSelected && !hasData && (
            <View style={[styles.activityDot, styles.todayDot]} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});
DayCell.displayName = 'DayCell';

const WeekCalendarComponent = ({
  selectedDate,
  onDateChange,
  activeDates = [],
}: WeekCalendarProps) => {
  const today = useMemo(() => new Date(), []);
  const activeSet = useMemo(
    () => new Set(activeDates.map((d) => new Date(d).toDateString())),
    [activeDates]
  );

  // Build the week array from the Sunday of the selected date's week
  const week = useMemo(() => {
    const base = new Date(selectedDate);
    const start = new Date(base);
    start.setDate(base.getDate() - base.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const monthLabel = useMemo(
    () => selectedDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
    [selectedDate]
  );

  const goToPrevWeek = useCallback(() => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() - 7);
    onDateChange(next);
  }, [selectedDate, onDateChange]);

  const goToNextWeek = useCallback(() => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    onDateChange(next);
  }, [selectedDate, onDateChange]);

  return (
    <View style={styles.container}>
      {/* Inline month nav row */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.navBtn} hitSlop={NAV_HIT_SLOP}>
          <Feather name="chevron-left" size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <TouchableOpacity onPress={goToNextWeek} style={styles.navBtn} hitSlop={NAV_HIT_SLOP}>
          <Feather name="chevron-right" size={18} color={theme.colors.text.muted} />
        </TouchableOpacity>
      </View>

      {/* Day strip */}
      <View style={styles.strip}>
        {week.map((date, i) => (
          <DayCell
            key={date.toDateString()}
            date={date}
            dayLabel={DAY_LABELS[i]}
            isSelected={date.toDateString() === selectedDate.toDateString()}
            isToday={date.toDateString() === today.toDateString()}
            hasData={activeSet.has(date.toDateString())}
            onPress={onDateChange}
          />
        ))}
      </View>
    </View>
  );
};

// Static hitSlop to avoid inline object
const NAV_HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export const WeekCalendar = memo(WeekCalendarComponent);
export default WeekCalendar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    gap: 8,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 13,
    fontFamily: theme.family.heading,
    color: theme.colors.text.primary,
    letterSpacing: 0.3,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  dayWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  dayTouchable: {
    alignItems: 'center',
    gap: 3,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: theme.family.medium,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
  },
  dayLabelToday: {
    color: theme.colors.accent.green,
  },
  dateCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: theme.colors.accent.green,
  },
  dateCircleToday: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  dateText: {
    fontSize: 14,
    fontFamily: theme.family.medium,
    color: theme.colors.text.primary,
  },
  dateTextSelected: {
    color: '#FFFFFF',
    fontFamily: theme.family.heading,
  },
  dateTextToday: {
    color: theme.colors.accent.green,
    fontFamily: theme.family.heading,
  },
  dotArea: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.green,
  },
  todayDot: {
    backgroundColor: '#FF9500',
  },
});
