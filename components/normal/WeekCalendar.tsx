import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Props {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function WeekCalendar({ selectedDate, onDateChange }: Props) {
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, [selectedDate]);

  const monthLabel = useMemo(() => {
    const m = MONTHS[selectedDate.getMonth()];
    const y = selectedDate.getFullYear();
    return `${m} ${y}`;
  }, [selectedDate]);

  const dates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const goBack = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };

  const goForward = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };

  const today = new Date();
  const todayStr = today.toDateString();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.month}>{monthLabel}</Text>
        <TouchableOpacity onPress={goForward} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayRow}>
        {DAYS.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.dayCol}>
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.dateRow}>
        {dates.map((d, i) => {
          const isToday = d.toDateString() === todayStr;
          const isSelected = d.toDateString() === selectedDate.toDateString();
          const isSat = d.getDay() === 6;
          return (
            <TouchableOpacity
              key={i}
              style={styles.dateCol}
              onPress={() => onDateChange(d)}
            >
              <View style={[styles.dateCircle, isToday && styles.dateToday, isSelected && !isToday && styles.dateSelected]}>
                <Text style={[styles.dateNum, isToday && styles.dateNumToday]}>
                  {d.getDate()}
                </Text>
              </View>
              {isSat && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { fontSize: 20, color: '#9CA3AF', paddingHorizontal: 4 },
  month: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dayRow: { flexDirection: 'row', marginTop: 12 },
  dayCol: { flex: 1, alignItems: 'center' },
  dayLabel: { fontSize: 12, color: '#9CA3AF' },
  dateRow: { flexDirection: 'row', marginTop: 8 },
  dateCol: { flex: 1, alignItems: 'center' },
  dateCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dateToday: { backgroundColor: '#22C55E' },
  dateSelected: { backgroundColor: 'rgba(34,197,94,0.15)' },
  dateNum: { fontSize: 16, color: '#111827' },
  dateNumToday: { color: '#FFFFFF', fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B', marginTop: 4 },
});
