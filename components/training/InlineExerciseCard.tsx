import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import type { ExercisePerformanceData, SessionSetGroup } from '@/lib/workoutDataService';

interface InlineExerciseCardProps {
  name: string;
  sets: number;
  reps: string;
  performance?: ExercisePerformanceData;
}

function fmtShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getPrevWeight(currentSetNum: number, prevSesh: SessionSetGroup | undefined): number | null {
  if (!prevSesh) return null;
  const match = prevSesh.sets.find(s => s.setNumber === currentSetNum);
  return match ? match.weight : null;
}

export default function InlineExerciseCard({
  name, sets, reps, performance,
}: InlineExerciseCardProps) {
  const lastSesh = performance?.sessionHistory?.[0];
  const prevSesh = performance?.sessionHistory?.[1];
  const hasData = lastSesh && lastSesh.sets.length > 0;

  return (
    <Animated.View entering={FadeIn.duration(250)} style={s.card}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.iconBox}>
            <Feather name="activity" size={16} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.exName}>{name}</Text>
            <Text style={s.exTarget}>{sets} × {reps}</Text>
          </View>
        </View>
        {performance?.lastSessionDate && (
          <Text style={s.lastDate}>{fmtShort(performance.lastSessionDate)}</Text>
        )}
      </View>

      {/* ── Set Table ── */}
      {hasData ? (
        <>
          <View style={s.colHeaders}>
            <Text style={[s.colLabel, s.colSet]}>SET</Text>
            <Text style={[s.colLabel, s.colWeight]}>WEIGHT</Text>
            <Text style={[s.colLabel, s.colRepsLbl]}>REPS</Text>
          </View>
          {lastSesh!.sets.map((set, idx) => {
            const prevWeight = getPrevWeight(set.setNumber, prevSesh);
            const delta = prevWeight !== null ? Number((set.weight - prevWeight).toFixed(1)) : null;
            return (
              <View key={set.setNumber} style={[s.setRow, idx % 2 === 1 && s.setRowAlt]}>
                <Text style={s.setNum}>{set.setNumber}</Text>
                <View style={s.weightCell}>
                  <Text style={s.setWeight}>{set.weight}<Text style={s.setUnit}> kg</Text></Text>
                  {delta !== null && delta !== 0 && (
                    <Text style={[s.deltaBadge, delta > 0 ? s.deltaUp : s.deltaDown]}>
                      {delta > 0 ? '+' : ''}{delta}
                    </Text>
                  )}
                </View>
                <Text style={s.setReps}>{set.reps}</Text>
              </View>
            );
          })}
        </>
      ) : (
        <Text style={s.noData}>No sets logged yet</Text>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.primary,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8,
  },
  iconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: theme.colors.bg.tertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  exName: {
    fontSize: 15, fontWeight: '700', color: theme.colors.text.primary,
  },
  exTarget: {
    fontSize: 11, color: theme.colors.text.secondary, fontWeight: '500',
    marginTop: 1,
  },
  lastDate: {
    fontSize: 10, color: theme.colors.text.muted, fontWeight: '500',
    marginTop: 2,
  },
  noData: {
    fontSize: 11, color: theme.colors.text.disabled, fontWeight: '500',
    fontStyle: 'italic', textAlign: 'center', paddingVertical: 8,
  },

  // ── Columns ──
  colHeaders: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, gap: 4,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle,
  },
  colLabel: {
    fontSize: 9, fontWeight: '700', color: theme.colors.text.disabled,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  colSet: { width: 28, textAlign: 'center' },
  colWeight: { flex: 1, textAlign: 'center' },
  colRepsLbl: { width: 44, textAlign: 'center' },

  // ── Set Rows ──
  setRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 5, paddingHorizontal: 4, gap: 4,
    borderRadius: 6,
  },
  setRowAlt: {
    backgroundColor: theme.colors.bg.tertiary,
  },
  setNum: {
    width: 28, textAlign: 'center',
    fontSize: 12, fontWeight: '700', color: theme.colors.text.primary,
  },
  weightCell: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  setWeight: {
    fontSize: 13, fontWeight: '700', color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  setUnit: {
    fontSize: 9, fontWeight: '600', color: theme.colors.text.muted,
  },
  deltaBadge: {
    fontSize: 10, fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  deltaUp: { color: '#00D68F' },
  deltaDown: { color: '#EF4444' },
  setReps: {
    width: 44, textAlign: 'center',
    fontSize: 13, fontWeight: '700', color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
});
