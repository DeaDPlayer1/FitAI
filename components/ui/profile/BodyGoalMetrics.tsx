import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export interface StatEntry {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  color?: string;
}

interface BodyGoalMetricsProps {
  stats: StatEntry[];
}

export function BodyGoalMetrics({ stats }: BodyGoalMetricsProps) {
  return (
    <View style={styles.grid}>
      {stats.map((s, i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.iconBg, { backgroundColor: (s.color || theme.colors.primary) + '14' }]}>
            <Feather name={s.icon} size={16} color={s.color || theme.colors.primary} />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    gap: 8,
  },
  card: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    ...theme.shadow.soft,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  value: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: theme.font.size.micro,
    fontWeight: '500',
    color: theme.colors.text.muted,
    marginTop: 1,
  },
});

export default BodyGoalMetrics;
