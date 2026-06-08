import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import StrengthChart from './StrengthChart';
import CalorieChart from './CalorieChart';
import WeightChart from './WeightChart';
import type { WeeklyReviewOutput } from '@/lib/weeklyReviewEngine';

interface Props {
  review: WeeklyReviewOutput;
  onApply?: () => void;
  onDismiss?: () => void;
}

function getAdherenceColor(score: number): string {
  if (score >= 80) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}

export default function WeeklyReviewCard({ review, onApply, onDismiss }: Props) {
  const adjColor = getAdherenceColor(review.adherenceScore);
  const strengthData = review.e1rmTrends.map(t => ({
    name: t.exerciseName,
    data: [
      { label: 'Prev Avg', value: t.previousAvg },
      { label: 'Recent', value: t.recentAvg },
    ],
    color: t.trend === 'up' ? '#10B981' : t.trend === 'down' ? '#EF4444' : '#6B7280',
  }));

  const calData = review.adherenceScore > 0
    ? [{ label: 'Avg', value: review.calAvg }, { label: 'Target', value: review.calTarget }]
    : [];

  const weightData = review.weightTrend.weeklyAvg > 0
    ? [
        ...(review.weightTrend.weeklyChange !== 0
          ? [{ label: 'Δ', value: Math.abs(review.weightTrend.weeklyChange) }]
          : []),
      ]
    : [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.weekLabel}>Week {review.weekNumber} Review</Text>
        <View style={styles.headerBadge}>
          <Feather name={review.flareDetected ? 'alert-triangle' : 'check-circle'} size={14} color="white" />
          <Text style={styles.headerBadgeText}>
            {review.flareDetected ? 'Health Event Detected' : `${review.adherenceScore}% Adherence`}
          </Text>
        </View>
      </LinearGradient>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.summary}>{review.summary}</Text>
      </View>

      {/* Adherence Ring */}
      <View style={styles.adherenceRow}>
        <View style={[styles.adherenceCircle, { borderColor: adjColor }]}>
          <Text style={[styles.adherenceValue, { color: adjColor }]}>{review.adherenceScore}</Text>
          <Text style={styles.adherenceUnit}>%</Text>
        </View>
        <View style={styles.adherenceDetails}>
          <Text style={styles.adherenceLabel}>{review.sessionsCompleted}/{review.sessionsPlanned} sessions</Text>
          <Text style={styles.adherenceLabel}>{review.calAdherencePct}% nutrition adherence</Text>
          <Text style={styles.adherenceLabel}>Recovery: {review.avgRecoveryScore}/100</Text>
        </View>
      </View>

      {/* Charts */}
      {strengthData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartSectionTitle}>Strength Trends</Text>
          <StrengthChart series={strengthData} width={300} height={180} />
        </View>
      )}

      {calData.length > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartSectionTitle}>Calories</Text>
          <CalorieChart data={calData} target={review.calTarget} width={300} height={150} />
        </View>
      )}

      {review.weightTrend.weeklyAvg > 0 && (
        <View style={styles.chartSection}>
          <Text style={styles.chartSectionTitle}>Weight</Text>
          <Text style={styles.weightValue}>{review.weightTrend.weeklyAvg.toFixed(1)} kg</Text>
          <Text style={styles.weightRate}>
            {review.weightTrend.direction === 'losing' ? '↓' : review.weightTrend.direction === 'gaining' ? '↑' : '→'}
            {' '}{Math.abs(review.weightTrend.ratePct).toFixed(2)}% BW/week
            {' '}({review.weightTrend.inTargetZone ? 'In target zone ✅' : 'Outside target ⚠️'})
          </Text>
        </View>
      )}

      {/* Adjustments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adjustments</Text>
        {review.adjustments.map((adj, i) => (
          <View key={i} style={styles.adjustmentRow}>
            <View style={[styles.adjDot, {
              backgroundColor: adj.type === 'none' ? '#10B981' :
                adj.type === 'recovery' || adj.type === 'deload' ? '#F59E0B' : '#7C3AED',
            }]} />
            <View style={styles.adjContent}>
              <Text style={styles.adjAction}>{adj.action}</Text>
              <Text style={styles.adjReason}>{adj.reasoning}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Health Alert */}
      {review.flareDetected && (
        <View style={styles.flareBanner}>
          <Feather name="alert-triangle" size={16} color="#EF4444" />
          <Text style={styles.flareText}>Health flare detected. Switching to recovery mode.</Text>
        </View>
      )}

      {/* Actions */}
      {(onApply || onDismiss) && (
        <View style={styles.actions}>
          {onApply && (
            <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
              <Feather name="check" size={18} color="white" />
              <Text style={styles.applyText}>Apply Changes</Text>
            </TouchableOpacity>
          )}
          {onDismiss && (
            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, alignItems: 'center', gap: 8 },
  weekLabel: { fontSize: 22, fontWeight: '800', color: 'white' },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  headerBadgeText: { fontSize: 13, color: 'white', fontWeight: '600' },
  section: { padding: 16 },
  summary: { fontSize: 14, color: '#374151', lineHeight: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  adherenceRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  adherenceCircle: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  adherenceValue: { fontSize: 24, fontWeight: '800' },
  adherenceUnit: { fontSize: 10, color: '#9CA3AF', marginTop: -2 },
  adherenceDetails: { flex: 1 },
  adherenceLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  chartSection: { padding: 16 },
  chartSectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  weightValue: { fontSize: 32, fontWeight: '800', color: '#111827' },
  weightRate: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  adjustmentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  adjDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  adjContent: { flex: 1 },
  adjAction: { fontSize: 14, fontWeight: '600', color: '#111827' },
  adjReason: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 18 },
  flareBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', marginHorizontal: 16, padding: 12,
    borderRadius: 12, borderWidth: 1, borderColor: '#FECACA',
  },
  flareText: { fontSize: 13, color: '#991B1B', flex: 1 },
  actions: { padding: 16, gap: 10, paddingBottom: 40 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7C3AED', padding: 16, borderRadius: 16,
  },
  applyText: { fontSize: 16, fontWeight: '700', color: 'white' },
  dismissBtn: { alignItems: 'center', padding: 12 },
  dismissText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});
