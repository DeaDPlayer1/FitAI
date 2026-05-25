import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import OnboardingShell from '@/components/OnboardingShell';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/constants/theme';

const CONDITIONS = [
  { id: 'ckd', label: 'Chronic Kidney Disease', icon: 'heart', color: theme.COLORS.purple, advice: 'AI will recommend: Low-volume training, extra rest days, kidney-safe diet' },
  { id: 'diabetes', label: 'Diabetes Type 1 or 2', icon: 'water', color: theme.COLORS.primary, advice: 'AI will: Time workouts to avoid blood sugar spikes, suggest pre/post workout meals' },
  { id: 'hypertension', label: 'Hypertension', icon: 'pulse', color: theme.COLORS.danger, advice: 'AI will: Avoid isometric holds, keep RPE below 8, monitor intensity' },
  { id: 'lupus', label: 'SLE / Lupus', icon: 'shield-checkmark', color: theme.COLORS.success, advice: 'AI will: Prioritize low-impact exercises, include recovery protocols' },
  { id: 'heart', label: 'Heart Condition', icon: 'fitness', color: theme.COLORS.danger, advice: 'AI will: Keep HR below 130bpm, recommend medical clearance first' },
  { id: 'pcod', label: 'PCOD / PCOS', icon: 'female', color: theme.COLORS.purple, advice: 'AI will: Emphasize strength training, limit excessive cardio, include rest days' },
  { id: 'none', label: 'None of the above', icon: 'checkmark-circle', color: theme.COLORS.success, advice: '' },
] as const;

export default function Step3Health() {
  const router = useRouter();
  const { setHealthProfile } = useUserStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleCondition = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (id === 'none') {
        return next.has('none') ? new Set() : new Set(['none']);
      }
      next.delete('none');
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNext = () => {
    const conditions = selected.has('none') ? [] : Array.from(selected);
    setHealthProfile({ conditions });
    const { setOnboardingStep } = useUserStore.getState();
    setOnboardingStep(3);
    AsyncStorage.setItem('@onboarding_step', '3').catch(() => {});
    router.push('/onboarding/step4-permissions');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingShell
        step={3}
        title="Any health conditions?"
        subtitle="Your AI trainer will create a safe plan. This info stays private."
        onSkip={() => router.push('/onboarding/step4-permissions')}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Privacy Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="shield-checkmark" size={18} color={theme.COLORS.success} />
            </View>
            <Text style={styles.infoText}>Your health data is encrypted and never sold</Text>
          </View>

          {/* Conditions */}
          {CONDITIONS.map((cond) => {
            const isOn = selected.has(cond.id);
            return (
              <View key={cond.id}>
                <TouchableOpacity
                  style={[styles.conditionRow, isOn && styles.conditionRowActive]}
                  onPress={() => toggleCondition(cond.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.condLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: cond.color + '15' }]}>
                      <Ionicons name={cond.icon as any} size={18} color={cond.color} />
                    </View>
                    <Text style={[styles.condLabel, isOn && styles.condLabelActive]}>{cond.label}</Text>
                  </View>
                  <Switch
                    value={isOn}
                    onValueChange={() => toggleCondition(cond.id)}
                    trackColor={{ false: theme.BACKGROUND.cardBorder, true: theme.COLORS.primary }}
                    thumbColor="white"
                  />
                </TouchableOpacity>

                {/* Advice card when toggled on */}
                {isOn && cond.advice ? (
                  <View style={[styles.adviceCard, { borderColor: cond.color + '40', backgroundColor: cond.color + '08' }]}>
                    <Ionicons name="information-circle" size={16} color={cond.color} />
                    <Text style={[styles.adviceText, { color: cond.color }]}>{cond.advice}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}

          <PrimaryButton 
            label="Continue" 
            onPress={handleNext} 
            disabled={selected.size === 0}
            style={{ marginTop: theme.SPACING.lg }} 
          />
        </ScrollView>
      </OnboardingShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.BACKGROUND.page },
  scroll: { paddingBottom: 40 },
  infoCard: {
    backgroundColor: theme.COLORS.successLight,
    borderRadius: theme.RADIUS.md,
    padding: theme.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.SPACING.md,
    marginBottom: theme.SPACING.lg,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: theme.COLORS.success,
    fontSize: 13,
    flex: 1,
    fontWeight: '600',
  },
  conditionRow: {
    backgroundColor: theme.BACKGROUND.input,
    borderRadius: theme.RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: theme.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.sm,
  },
  conditionRowActive: {
    backgroundColor: theme.COLORS.primaryLight,
    borderColor: theme.COLORS.primary,
  },
  condLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.SPACING.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  condLabel: {
    color: theme.TEXT.primary,
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '600',
    flex: 1,
  },
  condLabelActive: {
    color: theme.COLORS.primary,
  },
  adviceCard: {
    borderWidth: 1,
    borderRadius: theme.RADIUS.md,
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    marginTop: -theme.SPACING.xs,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.SPACING.sm,
  },
  adviceText: {
    fontSize: theme.FONT_SIZE.sm,
    flex: 1,
    lineHeight: 18,
    fontWeight: '500',
  },
});
