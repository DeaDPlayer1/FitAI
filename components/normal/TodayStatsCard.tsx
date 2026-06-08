import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

function MiniCard({
  icon,
  label,
  value,
  progress,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  progress: number;
  color: string;
}) {
  return (
    <View style={styles.miniCard}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[styles.miniValue, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
      <View style={styles.miniBarTrack}>
        <View style={[styles.miniBarFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

interface Props {
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  water: number;
  waterGoal: number;
  steps: number;
  stepsGoal: number;
  streakDays: number;
}

export default function TodayStatsCard({
  calories, calorieGoal, protein, proteinGoal, water, waterGoal, steps, stepsGoal, streakDays,
}: Props) {
  const pct = calorieGoal > 0 ? (calories / calorieGoal) * 100 : 0;
  const remaining = calorieGoal - calories;
  const circumference = 2 * Math.PI * 42;
  const fillLen = (pct / 100) * circumference;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.todayLabel}>TODAY</Text>
          <View style={styles.ringWrap}>
            <Svg width={100} height={100} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="8" fill="none" />
              <Circle
                cx="50" cy="50" r="42"
                stroke="#22C55E"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${fillLen} ${circumference - fillLen}`}
                strokeLinecap="round"
                rotation="-90"
                origin="50, 50"
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringNumber}>{calories}</Text>
              <Text style={styles.ringLabel}>KCAL</Text>
            </View>
          </View>
          <Text style={[styles.leftText, remaining < 0 && { color: '#FF6B6B' }]}>{remaining} kcal {remaining < 0 ? 'over' : 'left'}</Text>
        </View>

        <View style={styles.right}>
          <View style={styles.grid}>
            <MiniCard icon="⚡" label="PROTEIN" value={`${protein}g`} progress={(protein / Math.max(proteinGoal, 1)) * 100} color="#22C55E" />
            <MiniCard icon="💧" label="WATER" value={`${water}`} progress={(water / Math.max(waterGoal, 1)) * 100} color="#60A5FA" />
            <MiniCard icon="📈" label="STEPS" value={`${steps}`} progress={(steps / Math.max(stepsGoal, 1)) * 100} color="#F59E0B" />
            <MiniCard icon="🏅" label="STREAK" value={`${streakDays}`} progress={Math.min(streakDays * 10, 100)} color="#EF4444" />
          </View>
        </View>
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
  row: { flexDirection: 'row' },
  left: { width: '38%', alignItems: 'center' },
  todayLabel: { fontSize: 12, fontWeight: '600', color: '#22C55E', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 8 },
  ringWrap: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringNumber: { fontSize: 28, fontWeight: '700', color: '#111827' },
  ringLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  leftText: { fontSize: 13, color: '#9CA3AF', marginTop: 6 },
  right: { flex: 1, paddingLeft: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniCard: {
    width: '46%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
  },
  miniValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  miniLabel: { fontSize: 10, color: '#9CA3AF', letterSpacing: 0.5, marginTop: 1, textTransform: 'uppercase' },
  miniBarTrack: { height: 3, borderRadius: 2, backgroundColor: '#E5E7EB', marginTop: 6, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },
});
