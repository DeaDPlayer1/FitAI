import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAiTrainerStore, type ActivePlan } from '@/store/aiTrainerStore';
import { useNutritionStore } from '@/store/nutritionStore';
import { useSplitBuilderStore } from '@/store/splitBuilderStore';
import { useUserStore } from '@/store/userStore';
import { savePlan, generatePlanId } from '@/lib/aiTrainerPlanManager';

export default function ConfirmPlanModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planJson?: string }>();
  const user = useUserStore(s => s.user);
  const { setActivePlan, setPhase, addPlanToHistory } = useAiTrainerStore();
  const { setCalorieGoal } = useNutritionStore();
  const { days } = useSplitBuilderStore();

  const plan: ActivePlan | null = useMemo(() => {
    if (!params.planJson) return null;
    try {
      return JSON.parse(params.planJson) as ActivePlan;
    } catch { return null; }
  }, [params.planJson]);

  const [applying, setApplying] = useState(false);

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Feather name="alert-triangle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>No Plan Data</Text>
          <Text style={styles.errorBody}>The plan could not be loaded. Please return to the chat and try again.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleApply = async () => {
    if (!user?.id) return;
    setApplying(true);
    try {
      const now = new Date().toISOString();
      const planWithId: ActivePlan = {
        ...plan,
        id: await generatePlanId(user.id),
        userId: user.id,
        phase: 'plan_active',
        appliedAt: now,
        createdAt: plan.createdAt || now,
      };
      try {
        await savePlan(planWithId);
      } catch (dbErr) {
        console.warn('SQLite savePlan failed, continuing with in-memory only:', dbErr);
      }
      setActivePlan(planWithId);
      addPlanToHistory(planWithId);
      setPhase('plan_active');
      try {
        setCalorieGoal(plan.calorieTarget);
      } catch {}
      Alert.alert('Plan Applied', 'Your AI Trainer plan is now active. Weekly reviews will auto-adjust as you log data.', [
        { text: 'Great!', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.error('apply plan error:', e);
      Alert.alert('Error', `Failed to apply plan: ${e?.message || 'Unknown error'}`);
    } finally {
      setApplying(false);
    }
  };

  const conditionCount = plan.conditionAdaptations?.length || 0;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Feather name="x" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Your Plan</Text>
          <View style={styles.headerBtn} />
        </View>
        <Text style={styles.headerSub}>Week {plan.weekNumber} · Version {plan.version}</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Training Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={18} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Training</Text>
          </View>
          <Text style={styles.sectionBody}>{plan.trainingSplitSummary || days.filter(d => !d.isRest).map(d => d.dayName).join(', ') || 'Custom plan'}</Text>
          <Text style={styles.sectionDetail}>Weekly volume target: {plan.weeklyVolumeTarget || 'Adaptive'} kg</Text>
        </View>

        {/* Nutrition Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="pie-chart" size={18} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Nutrition Targets</Text>
          </View>
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plan.calorieTarget}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plan.proteinTarget}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plan.carbTarget}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{plan.fatTarget}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
          <Text style={styles.sectionDetail}>Sodium limit: {plan.sodiumLimit}mg</Text>
        </View>

        {/* Health Section */}
        {conditionCount > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="shield" size={18} color="#7C3AED" />
              <Text style={styles.sectionTitle}>Health Adaptations</Text>
            </View>
            {plan.conditionAdaptations.map((a, i) => (
              <View key={i} style={styles.adaptationRow}>
                <Feather name="check-circle" size={14} color="#10B981" />
                <Text style={styles.adaptationText}>{a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="message-circle" size={18} color="#7C3AED" />
            <Text style={styles.sectionTitle}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{plan.aiSummary}</Text>
        </View>

        {/* Safety Notes */}
        {plan.safetyNotes?.length > 0 && (
          <View style={[styles.section, styles.safetySection]}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={18} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Safety Notes</Text>
            </View>
            {plan.safetyNotes.map((n, i) => (
              <Text key={i} style={styles.safetyText}>⚠️ {n}</Text>
            ))}
          </View>
        )}

        <View style={styles.disclaimer}>
          <Feather name="alert-circle" size={14} color="#9CA3AF" />
          <Text style={styles.disclaimerText}>
            I recommend discussing this plan with your healthcare provider before starting.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.applyBtn, applying && styles.applyBtnDisabled]}
          onPress={handleApply}
          disabled={applying}
        >
          <Feather name="check" size={20} color="white" />
          <Text style={styles.applyBtnText}>{applying ? 'Applying...' : 'Apply Plan'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: Platform.OS === 'ios' ? 0 : 16, paddingBottom: 16, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  section: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
  sectionDetail: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  macroGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  macroLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  adaptationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  adaptationText: { fontSize: 13, color: '#374151', flex: 1, lineHeight: 18 },
  summaryText: { fontSize: 14, color: '#374151', lineHeight: 22, fontStyle: 'italic' },
  safetySection: { borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  safetyText: { fontSize: 12, color: '#92400E', lineHeight: 18, marginBottom: 4 },
  disclaimer: { flexDirection: 'row', gap: 8, padding: 16, alignItems: 'flex-start' },
  disclaimerText: { fontSize: 12, color: '#9CA3AF', flex: 1, lineHeight: 18 },
  footer: { padding: 16, paddingBottom: Platform.OS === 'ios' ? 120 : 100 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#7C3AED', padding: 16, borderRadius: 16,
  },
  applyBtnDisabled: { opacity: 0.5 },
  applyBtnText: { fontSize: 16, fontWeight: '700', color: 'white' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  errorBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  backBtn: { backgroundColor: '#111827', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: 'white' },
});
