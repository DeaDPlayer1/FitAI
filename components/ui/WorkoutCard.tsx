import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import GlassCard from './GlassCard';
import { safeDate, safeJSON, safeNum, safeText } from '@/utils/safeRender';

interface WorkoutCardProps {
  item: {
    id: string;
    plan_name?: string | null;
    exercises: any;
    source?: string | null;
    logged_at?: string | null;
    duration_minutes?: number | null;
  };
  onPress?: () => void;
}

const WorkoutCardComponent = ({ item, onPress }: WorkoutCardProps) => {
  const exercises = safeJSON(item.exercises);
  const sourceLabel = item?.source === 'ai_generated' ? 'AI Generated' : 'Manual';
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
      <GlassCard variant="standard" glowColor="orange">
        <View style={styles.headerRow}>
          <Text style={styles.title}>{safeText(item?.plan_name, 'Workout')}</Text>
          <View style={[styles.badge, { backgroundColor: item?.source === 'ai_generated' ? theme.colors.accent.greenSoft : theme.colors.accent.orangeSoft }]}>
            <Text style={[styles.badgeText, { color: item?.source === 'ai_generated' ? theme.colors.accent.green : theme.colors.accent.orange }]}>{sourceLabel}</Text>
          </View>
        </View>
        <Text style={styles.date}>{safeDate(item?.logged_at ?? null)}</Text>
        <View style={styles.divider} />
        {exercises.length ? exercises.map((ex, i) => (
          <View key={`${item.id}-${i}`} style={styles.exRow}>
            <View style={styles.dot}><Text style={styles.dotText}>{i + 1}</Text></View>
            <View style={styles.exInfo}>
              <Text style={styles.exName}>{safeText(ex?.exercise_name ?? ex?.name ?? ex?.exercise, 'Exercise')}</Text>
              <Text style={styles.rest}>Rest {safeNum(ex?.rest_seconds)}s</Text>
            </View>
            <Text style={styles.meta}>{safeNum(ex?.sets)}x{safeText(ex?.reps, '--')}</Text>
          </View>
        )) : <Text style={styles.empty}>No exercises recorded</Text>}
      </GlassCard>
    </TouchableOpacity>
  );
};

export const WorkoutCard = memo(WorkoutCardComponent);
export default WorkoutCard;

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: theme.colors.text.primary, fontSize: 18, fontWeight: '600', flex: 1, marginRight: 8 },
  badge: { borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  date: { color: theme.colors.text.muted, fontSize: 12, marginTop: 8 },
  divider: { height: 1, backgroundColor: theme.colors.border.subtle, marginVertical: 12 },
  exRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.accent.orange, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  dotText: { color: theme.colors.text.onAccent, fontSize: 11, fontWeight: '700' },
  exInfo: { flex: 1 },
  exName: { color: theme.colors.text.primary, fontSize: 14 },
  rest: { color: theme.colors.text.muted, fontSize: 12, marginTop: 2 },
  meta: { color: theme.colors.accent.orange, fontSize: 14, fontWeight: '600' },
  empty: { textAlign: 'center', color: theme.colors.text.muted, fontSize: 13 },
});

