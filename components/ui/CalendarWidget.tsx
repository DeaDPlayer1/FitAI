import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_W - 80) / 7);
const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarWidgetProps {
  completedDates?: Set<string>;
  onDayPress?: (date: Date) => void;
  workoutDates?: Set<string>;
  selectedDate?: Date;
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    week.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return week;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function dateToStr(d: Date): string {
  return d.toDateString();
}

function WeekCell({
  date,
  isToday,
  isCompleted,
  isWorkoutDay,
  isSelected,
  onPress,
}: {
  date: Date;
  isToday: boolean;
  isCompleted: boolean;
  isWorkoutDay: boolean;
  isSelected: boolean;
  onPress: (d: Date) => void;
}) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withTiming(isSelected ? 1.1 : 1, { duration: 200, easing: Easing.out(Easing.quad) });
  }, [isSelected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let bgColor: string | undefined;
  let txtColor: string;

  if (isSelected) {
    bgColor = theme.colors.primary;
    txtColor = '#FFFFFF';
  } else if (isCompleted) {
    bgColor = theme.colors.successSoft;
    txtColor = theme.colors.success;
  } else if (isToday) {
    bgColor = undefined;
    txtColor = theme.colors.primary;
  } else {
    bgColor = undefined;
    txtColor = theme.colors.text.primary;
  }

  return (
    <TouchableOpacity onPress={() => onPress(date)} activeOpacity={0.75} style={styles.cell}>
      <Animated.View style={[styles.dayCircle, bgColor ? { backgroundColor: bgColor } : null, animStyle]}>
        <Text style={[styles.dayText, { color: txtColor }]}>
          {date.getDate()}
        </Text>
      </Animated.View>
      <View style={styles.dotRow}>
        {isCompleted && <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />}
        {isWorkoutDay && !isCompleted && <View style={[styles.dot, { backgroundColor: theme.colors.primaryGlow }]} />}
      </View>
    </TouchableOpacity>
  );
}

export function CalendarWidget({
  completedDates = new Set(),
  onDayPress,
  workoutDates = new Set(),
  selectedDate: externalSelectedDate,
}: CalendarWidgetProps) {
  const today = new Date();
  const [internalSelected, setInternalSelected] = useState(today);
  const selectedDate = externalSelectedDate ?? internalSelected;
  const [baseDate, setBaseDate] = useState(today);

  const week = useMemo(() => getWeekDates(baseDate), [baseDate]);

  const weekLabel = useMemo(() => {
    const start = week[0];
    const end = week[6];
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} — ${fmt(end)}`;
  }, [week]);

  const goPrev = useCallback(() => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  }, [baseDate]);

  const goNext = useCallback(() => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  }, [baseDate]);

  const goToday = useCallback(() => {
    const now = new Date();
    setBaseDate(now);
    if (!externalSelectedDate) setInternalSelected(now);
    onDayPress?.(now);
  }, [externalSelectedDate, onDayPress]);

  const handlePress = useCallback((d: Date) => {
    if (!externalSelectedDate) setInternalSelected(d);
    const isInWeek = week.some((w) => isSameDay(w, d));
    if (!isInWeek) setBaseDate(d);
    onDayPress?.(d);
  }, [externalSelectedDate, onDayPress, week]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrev} style={styles.navBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToday} activeOpacity={0.7}>
          <Text style={styles.headerTitle}>{weekLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goNext} style={styles.navBtn} activeOpacity={0.7}>
          <Feather name="chevron-right" size={18} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <Animated.View entering={FadeIn.duration(250)} key={dateToStr(week[0])}>
        <View style={styles.dayHeadersRow}>
          {DAY_HEADERS.map((d) => (
            <Text key={d} style={styles.dayHeaderText}>{d}</Text>
          ))}
        </View>
        <View style={styles.weekRow}>
          {week.map((date) => (
            <WeekCell
              key={dateToStr(date)}
              date={date}
              isToday={isSameDay(date, today)}
              isCompleted={completedDates.has(dateToStr(date))}
              isWorkoutDay={workoutDates.has(dateToStr(date))}
              isSelected={isSameDay(date, selectedDate)}
              onPress={handlePress}
            />
          ))}
        </View>
      </Animated.View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 16,
    marginHorizontal: 20,
    ...theme.shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  dayHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  dayHeaderText: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.text.muted,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cell: {
    width: CELL_SIZE,
    alignItems: 'center',
    gap: 2,
  },
  dayCircle: {
    width: CELL_SIZE - 4,
    height: CELL_SIZE - 4,
    borderRadius: (CELL_SIZE - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: theme.font.size.caption,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default CalendarWidget;
