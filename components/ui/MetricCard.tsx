import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import GlassCard from './GlassCard';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onPress?: () => void;
}

const MetricCardComponent = ({
  label,
  value,
  unit = '',
  icon,
  iconBg = theme.colors.accent.orangeSoft,
  trend = 'neutral',
  trendValue = '',
  onPress,
}: MetricCardProps) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={!onPress}>
    <GlassCard variant="compact" style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.row}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
      {trend !== 'neutral' && trendValue ? (
        <View style={styles.trendWrap}>
          <Feather name={trend === 'up' ? 'arrow-up-right' : 'arrow-down-right'} size={12} color={trend === 'up' ? theme.colors.accent.green : theme.colors.danger} />
          <Text style={[styles.trendValue, { color: trend === 'up' ? theme.colors.accent.green : theme.colors.danger }]}>{trendValue}</Text>
        </View>
      ) : null}
    </GlassCard>
  </TouchableOpacity>
);

export const MetricCard = memo(MetricCardComponent);
export default MetricCard;

const styles = StyleSheet.create({
  card: { minHeight: theme.card.height.metric },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  value: { color: theme.colors.text.primary, fontSize: 24, fontWeight: '700' },
  unit: { color: theme.colors.text.muted, fontSize: 12, marginBottom: 3 },
  label: { marginTop: 8, color: theme.colors.text.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  trendWrap: { position: 'absolute', right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 2 },
  trendValue: { fontSize: 11, fontWeight: '600' },
});

