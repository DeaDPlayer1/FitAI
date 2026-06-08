/**
 * DayStrip — 7-column day strip for week views.
 */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

type DayState = 'completed' | 'today' | 'upcoming' | 'rest' | 'past-rest';

interface DayStripProps {
  days: { day: string; label?: string; state: DayState }[];
  onDayPress?: (index: number) => void;
  selectedIndex?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DayStrip({ days, onDayPress, selectedIndex, size = 'md', style }: DayStripProps) {
  const sizes = {
    sm: { width: 38, height: 70, fontSize: 10, labelSize: 9 },
    md: { width: 44, height: 80, fontSize: 11, labelSize: 9 },
    lg: { width: 56, height: 92, fontSize: 12, labelSize: 10 },
  };
  const s = sizes[size];

  return (
    <View style={[styles.row, style]}>
      {days.map((d, i) => {
        const isToday = d.state === 'today';
        const isCompleted = d.state === 'completed';
        const isRest = d.state === 'rest' || d.state === 'past-rest';
        const isSelected = selectedIndex === i;

        return (
          <Pressable
            key={i}
            onPress={() => onDayPress?.(i)}
            style={({ pressed }) => [
              styles.day,
              { width: s.width, height: s.height, opacity: pressed ? 0.6 : 1 },
              isSelected && { transform: [{ scale: 1.05 }] },
            ]}
          >
            <Text style={[styles.dayLabel, { fontSize: s.labelSize }]}>{DAY_LABELS[i] || d.day.slice(0, 1)}</Text>
            <View
              style={[
                styles.circle,
                isToday && {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                },
                isCompleted && { backgroundColor: theme.colors.success },
                isRest && {
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderColor: '#D1D5DB',
                  borderStyle: 'dashed',
                },
                d.state === 'upcoming' && { backgroundColor: theme.colors.surfaceTint },
              ]}
            >
              {isCompleted ? (
                <Feather name="check" size={14} color="#FFFFFF" />
              ) : isToday ? (
                <View style={styles.todayDot} />
              ) : isRest ? (
                <Text style={styles.restMark}>—</Text>
              ) : null}
            </View>
            {d.label && !isRest && (
              <Text
                style={[
                  styles.label,
                  { fontSize: s.fontSize },
                  isToday && { color: theme.colors.primary, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {d.label}
              </Text>
            )}
            {isRest && (
              <Text style={[styles.label, { fontSize: s.fontSize, color: theme.colors.text.muted }]}>Rest</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  day: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    color: theme.colors.text.muted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  restMark: {
    color: theme.colors.text.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

export default DayStrip;
