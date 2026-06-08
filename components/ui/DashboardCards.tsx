import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  bg: '#F9FAFB',
  card: '#FFFFFF',
  primary: '#7C3AED',
  primaryLight: '#EDE9FE',
  text: '#111827',
  subtext: '#6B7280',
  border: '#E5E7EB',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
};

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function CardTitle({ icon, label, right }: { icon?: keyof typeof Feather.glyphMap; label: string; right?: React.ReactNode }) {
  return (
    <View style={styles.cardTitleRow}>
      <View style={styles.cardTitleLeft}>
        {icon && <Feather name={icon} size={16} color={COLORS.primary} style={{ marginRight: 8 }} />}
        <Text style={styles.cardTitle}>{label}</Text>
      </View>
      {right}
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function StatRow({ label, value, unit, trend }: { label: string; value: string | number; unit?: string; trend?: 'up' | 'down' | 'stable' }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
        {trend === 'up' && <Feather name="trending-up" size={14} color={COLORS.green} style={{ marginLeft: 6 }} />}
        {trend === 'down' && <Feather name="trending-down" size={14} color={COLORS.red} style={{ marginLeft: 6 }} />}
      </View>
    </View>
  );
}

export function SectionHeader({ label, icon }: { label: string; icon?: keyof typeof Feather.glyphMap }) {
  return (
    <View style={styles.sectionHeader}>
      {icon && <Feather name={icon} size={16} color={COLORS.primary} style={{ marginRight: 8 }} />}
      <Text style={styles.sectionHeaderText}>{label}</Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );
}

export function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const color = score >= 80 ? COLORS.green : score >= 60 ? COLORS.blue : score >= 40 ? COLORS.yellow : COLORS.red;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;

  return (
    <View style={styles.ringContainer}>
      <View style={[styles.ringOuter, { width: size, height: size }]}>
        <View style={[styles.ringFill, {
          width: size, height: size,
          borderWidth: strokeWidth,
          borderColor: color + '30',
        }]}>
          <View style={[styles.ringProgress, {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
          }]}>
            <Text style={[styles.ringScore, { color }]}>{score}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '60',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.subtext,
    flex: 1,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  statUnit: {
    fontSize: 12,
    color: COLORS.subtext,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 12,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  ringContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  ringOuter: {
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringFill: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringProgress: {
    borderRadius: 999,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringScore: {
    fontSize: 22,
    fontWeight: '700',
  },
  ringLabel: {
    fontSize: 11,
    color: COLORS.subtext,
    marginTop: 4,
    textAlign: 'center',
  },
});
