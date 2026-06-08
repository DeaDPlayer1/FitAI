import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAiTrainerStore } from '@/store/aiTrainerStore';
import { useUserStore } from '@/store/userStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { runWeeklyReview, type WeeklyReviewInput, type WeeklyReviewOutput } from '@/lib/weeklyReviewEngine';
import { getRecentWorkoutSessions, getRecentNutritionDays, getUserContextHistory } from '@/lib/memoryService';
import { savePlan, saveReview, generatePlanId, generateReviewId } from '@/lib/aiTrainerPlanManager';
import WeeklyReviewCard from '@/components/ui/WeeklyReviewCard';

export default function WeeklyReviewModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ weekNumber?: string }>();
  const user = useUserStore(s => s.user);
  const { activePlan, addWeeklyReview, setActivePlan, addPlanToHistory, setPhase } = useAiTrainerStore();
  const { days } = useSplitBuilderStore();
  const { setCalorieGoal } = useNutritionStore();

  const [review, setReview] = useState<WeeklyReviewOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user?.id || !activePlan) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const sessions = await getRecentWorkoutSessions(user.id, 20);
        const nutritionDays = await getRecentNutritionDays(user.id, 14);
        const ctxHistory = await getUserContextHistory(user.id, 7);

        const input: WeeklyReviewInput = {
          userId: user.id,
          activePlan,
          sessions,
          nutritionDays,
          ctxHistory,
          weightLogs: [],
          conditions: user.health_profile?.conditions || [],
          gender: user.health_profile?.gender || undefined,
        };
        const result = await runWeeklyReview(input);
        setReview(result);
      } catch (e) {
        console.error('Weekly review failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, activePlan?.id]);

  const handleApply = async () => {
    if (!user?.id || !activePlan || !review) return;
    setApplying(true);
    try {
      const updatedPlan = {
        ...activePlan,
        version: activePlan.version + 1,
        weekNumber: activePlan.weekNumber + 1,
        phase: 'plan_active' as const,
        id: await generatePlanId(user.id),
        appliedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      if (review.adjustments.length > 0 && review.adjustments[0].type !== 'none') {
        const calAdj = review.adjustments.find(a => a.type === 'calories');
        if (calAdj && calAdj.action.includes('Drop')) {
          const dropMatch = calAdj.action.match(/Drop calories by (\d+)/);
          if (dropMatch) {
            updatedPlan.calorieTarget = Math.max(1400, activePlan.calorieTarget - parseInt(dropMatch[1]));
          }
        }
      }

      await savePlan(updatedPlan);
      const reviewRecord = {
        id: await generateReviewId(user.id),
        userId: user.id,
        weekNumber: review.weekNumber,
        planVersion: activePlan.version,
        sessionsCompleted: review.sessionsCompleted,
        sessionsPlanned: review.sessionsPlanned,
        adherenceScore: review.adherenceScore,
        calAvg: review.calAvg,
        calTarget: review.calTarget,
        proteinAvg: review.proteinAvg,
        weightTrend: review.weightTrend,
        adjustments: review.adjustments,
        summary: review.summary,
        userFeedback: 'approved' as const,
        createdAt: new Date().toISOString(),
      };
      await saveReview(reviewRecord);
      addWeeklyReview(reviewRecord);
      addPlanToHistory(updatedPlan);
      setActivePlan(updatedPlan);
      setPhase('plan_updated');

      try {
        setCalorieGoal(updatedPlan.calorieTarget);
      } catch {}

      Alert.alert('Week Updated', `Week ${updatedPlan.weekNumber} is ready. Your plan has been adjusted based on last week's data.`, [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', `Failed to apply review: ${e?.message || 'Unknown'}`);
    } finally {
      setApplying(false);
    }
  };

  const handleDismiss = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Analysing your week...</Text>
        </View>
      ) : review ? (
        <WeeklyReviewCard
          review={review}
          onApply={applying ? undefined : handleApply}
          onDismiss={handleDismiss}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to generate review. Start a conversation with Pulse AI first to create a plan.</Text>
          <View style={{ height: 16 }} />
          <View style={{ padding: 16, paddingBottom: Platform.OS === 'ios' ? 120 : 100 }}>
            <View style={styles.applyBtn} onTouchEnd={() => router.back()}>
              <Text style={styles.applyBtnText}>Go Back</Text>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  applyBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#7C3AED', padding: 16, borderRadius: 16,
  },
  applyBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
});
