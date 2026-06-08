import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface HealthMetric {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  status?: 'good' | 'moderate' | 'low';
}

interface HealthRecoveryProps {
  conditions: string[];
  aiAdaptation?: string | null;
  metrics: HealthMetric[];
}

const STATUS_COLORS = {
  good: { text: theme.colors.success, bg: theme.colors.successSoft },
  moderate: { text: theme.colors.warning, bg: theme.colors.warningSoft },
  low: { text: theme.colors.danger, bg: theme.colors.dangerSoft },
};

export function HealthRecovery({ conditions, aiAdaptation, metrics }: HealthRecoveryProps) {
  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8F7FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.title}>
        <Feather name="heart" size={16} color={theme.colors.primary} /> Health & Recovery
      </Text>

      {conditions.length > 0 && (
        <View style={styles.conditionsRow}>
          {conditions.map((c, i) => (
            <View key={i} style={styles.conditionBadge}>
              <Text style={styles.conditionText}>{c}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.metricsGrid}>
        {metrics.map((m, i) => {
          const sc = STATUS_COLORS[m.status || 'moderate'];
          return (
            <View key={i} style={styles.metricCard}>
              <View style={[styles.iconBg, { backgroundColor: sc.bg }]}>
                <Feather name={m.icon} size={14} color={sc.text} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          );
        })}
      </View>

      {aiAdaptation && (
        <View style={styles.adaptation}>
          <Feather name="cpu" size={14} color={theme.colors.primary} />
          <Text style={styles.adaptationText}>{aiAdaptation}</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    padding: 18,
    marginHorizontal: 20,
    ...theme.shadow.card,
  },
  title: {
    fontSize: theme.font.size.body,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  conditionBadge: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  conditionText: {
    fontSize: theme.font.size.micro,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.bg.primary,
    borderRadius: theme.radius.lg,
    padding: 10,
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: theme.font.size.body,
    fontWeight: '800',
    color: theme.colors.text.primary,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  adaptation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  adaptationText: {
    flex: 1,
    fontSize: theme.font.size.caption,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
});

export default HealthRecovery;
