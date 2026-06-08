import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ModeBadge from '@/components/ui/ModeBadge';
import { useAiTrainerStore } from '@/store/aiTrainerStore';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

export default function AiProgress() {
  const router = useRouter();
  const activePlan = useAiTrainerStore(s => s.activePlan);
  const weeklyReviews = useAiTrainerStore(s => s.weeklyReviews);
  const latestReview = weeklyReviews[0] || null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <ModeBadge mode="ai_trainer" onPress={() => router.push('/settings/mode-switcher')} />
      </View>

      {activePlan && (
        <LinearGradient colors={['#0f0a1a', '#1a0f2e']} style={styles.planBanner}>
          <Feather name="bar-chart-2" size={14} color="#C8FF00" />
          <Text style={styles.planBannerText}>
            Week {activePlan.currentWeek} of {activePlan.maxDurationWeeks} · {activePlan.goal} · {activePlan.splitType}
          </Text>
        </LinearGradient>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {/* Weekly Review Card */}
        {latestReview ? (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Feather name="clipboard" size={16} color="#C8FF00" />
              <Text style={styles.reviewTitle}>Week {latestReview.weekNumber} Review</Text>
            </View>
            <Text style={styles.reviewSummary}>{latestReview.summary}</Text>
            <View style={styles.reviewStats}>
              <View style={styles.reviewStat}>
                <Text style={styles.reviewStatValue}>{Math.round(latestReview.adherenceScore)}%</Text>
                <Text style={styles.reviewStatLabel}>Adherence</Text>
              </View>
              <View style={styles.reviewStat}>
                <Text style={styles.reviewStatValue}>{latestReview.sessionsCompleted}/{latestReview.sessionsPlanned}</Text>
                <Text style={styles.reviewStatLabel}>Sessions</Text>
              </View>
              {latestReview.weightTrend && (
                <View style={styles.reviewStat}>
                  <Text style={[styles.reviewStatValue, latestReview.weightTrend.weeklyChange < 0 ? { color: '#22C55E' } : { color: '#F59E0B' }]}>
                    {latestReview.weightTrend.weeklyChange > 0 ? '+' : ''}{latestReview.weightTrend.weeklyChange.toFixed(1)} kg
                  </Text>
                  <Text style={styles.reviewStatLabel}>This week</Text>
                </View>
              )}
            </View>
            {latestReview.adjustments.length > 0 && (
              <View style={styles.adjustments}>
                <Text style={styles.adjustmentsTitle}>Adjustments</Text>
                {latestReview.adjustments.slice(0, 2).map((adj, i) => (
                  <View key={i} style={styles.adjustmentRow}>
                    <Feather name="arrow-right" size={10} color="#A78BFA" />
                    <Text style={styles.adjustmentText}>{adj.action}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.bigCard}>
            <Text style={styles.bigLabel}>4-WEEK TREND</Text>
            <View style={styles.trendRow}>
              <View>
                <Text style={styles.trendValue}>No data yet</Text>
                <Text style={styles.trendSub}>Log workouts to see progress</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Plan Context Card */}
        {activePlan && (
          <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.contextCard}>
            <View style={styles.contextHeader}>
              <Feather name="info" size={14} color="#A78BFA" />
              <Text style={styles.contextTitle}>Plan Context</Text>
            </View>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Goal</Text>
              <Text style={styles.contextValue}>{activePlan.goal}</Text>
            </View>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Split</Text>
              <Text style={styles.contextValue}>{activePlan.splitType}</Text>
            </View>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Progression</Text>
              <Text style={styles.contextValue}>{activePlan.progressionStrategy}</Text>
            </View>
            <View style={styles.contextRow}>
              <Text style={styles.contextLabel}>Cardio</Text>
              <Text style={styles.contextValue}>{activePlan.cardioStrategy}</Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F5F5F5' },
  planBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(200,255,0,0.1)',
  },
  planBannerText: { fontSize: 11, color: '#C8FF00', fontWeight: '600', letterSpacing: 0.5 },
  bigCard: { padding: 20, borderRadius: 20, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F' },
  bigLabel: { fontSize: 11, color: '#7A7A7A', fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendValue: { fontSize: 24, fontWeight: '800', color: '#F5F5F5' },
  trendSub: { fontSize: 12, color: '#7A7A7A', marginTop: 4 },

  // Review Card
  reviewCard: { padding: 20, borderRadius: 20, backgroundColor: '#141414', borderWidth: 1, borderColor: 'rgba(200,255,0,0.12)' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  reviewTitle: { fontSize: 14, fontWeight: '700', color: '#F5F5F5' },
  reviewSummary: { fontSize: 13, color: '#C4B5FD', lineHeight: 18, marginBottom: 12 },
  reviewStats: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  reviewStat: { flex: 1, alignItems: 'center' },
  reviewStatValue: { fontSize: 20, fontWeight: '800', color: '#F5F5F5' },
  reviewStatLabel: { fontSize: 10, color: '#7A7A7A', marginTop: 2, textTransform: 'uppercase' },
  adjustments: { borderTopWidth: 1, borderTopColor: '#1F1F1F', paddingTop: 10 },
  adjustmentsTitle: { fontSize: 11, color: '#7A7A7A', fontWeight: '600', marginBottom: 6 },
  adjustmentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  adjustmentText: { fontSize: 12, color: '#A78BFA', flex: 1 },

  // Plan Context
  contextCard: { padding: 20, borderRadius: 20, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F' },
  contextHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  contextTitle: { fontSize: 12, color: '#A78BFA', fontWeight: '600' },
  contextRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  contextLabel: { fontSize: 13, color: '#9CA3AF' },
  contextValue: { fontSize: 13, fontWeight: '600', color: '#F5F5F5' },
});
