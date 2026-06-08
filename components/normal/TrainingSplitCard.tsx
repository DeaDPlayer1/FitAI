import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface DayData {
  day: string;
  label: string;
  isRest: boolean;
  isCompleted: boolean;
  isToday: boolean;
}

interface Props {
  splitName: string;
  splitDesc: string;
  days: DayData[];
  onEdit: () => void;
  onManage: () => void;
}

export default function TrainingSplitCard({ splitName, splitDesc, days, onEdit, onManage }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.splitName}>{splitName || 'Current Split'}</Text>
          <Text style={styles.splitDesc} numberOfLines={1}>{splitDesc}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.editIcon}>✎</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayStrip}>
        {days.map((d, i) => (
          <View key={i} style={styles.dayCol}>
            <Text style={styles.dayAbbr}>{d.day.slice(0, 3)}</Text>
            <View
              style={[
                styles.dayCircle,
                d.isCompleted && styles.dayCompleted,
                d.isToday && !d.isCompleted && styles.dayActive,
                d.isRest && !d.isCompleted && styles.dayRest,
              ]}
            >
              {d.isCompleted && <Text style={styles.checkmark}>✓</Text>}
              {d.isToday && !d.isCompleted && <View style={styles.activeDot} />}
            </View>
            <Text style={[styles.muscleLabel, d.isRest && styles.muscleRest]} numberOfLines={1}>
              {d.isRest ? 'Rest' : d.label}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.manageBtn} onPress={onManage} activeOpacity={0.7}>
        <Text style={styles.manageArrow}>›</Text>
        <Text style={styles.manageText}> Manage Training</Text>
      </TouchableOpacity>
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  splitName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  splitDesc: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  editIcon: { fontSize: 18, color: '#9CA3AF' },
  dayStrip: { flexDirection: 'row', marginTop: 14, justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', flex: 1 },
  dayAbbr: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayCompleted: { backgroundColor: '#22C55E' },
  dayActive: { borderWidth: 2, borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.1)' },
  dayRest: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D1D5DB', backgroundColor: 'transparent' },
  checkmark: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6' },
  muscleLabel: { fontSize: 11, color: '#111827', marginTop: 4, maxWidth: 40 },
  muscleRest: { color: '#9CA3AF' },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  manageArrow: { fontSize: 16, color: '#8B5CF6', fontWeight: '700' },
  manageText: { fontSize: 15, fontWeight: '600', color: '#8B5CF6' },
});
