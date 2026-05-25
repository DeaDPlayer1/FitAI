import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import OnboardingShell from '@/components/OnboardingShell';
import { GlassInput } from '@/components/ui/GlassInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/constants/theme';

const GOALS = [
  {
    id: 'fat_loss',
    name: 'Fat Loss',
    desc: 'Burn fat while preserving muscle',
    icon: 'flame' as const,
    color: theme.COLORS.warning,
    bg: theme.COLORS.warningLight,
  },
  {
    id: 'muscle_gain',
    name: 'Muscle Gain',
    desc: 'Build strength and size safely',
    icon: 'barbell' as const,
    color: theme.COLORS.purple,
    bg: theme.COLORS.primaryLight,
  },
  {
    id: 'stamina',
    name: 'Stamina',
    desc: 'Improve endurance and cardio',
    icon: 'flash' as const,
    color: theme.COLORS.success,
    bg: theme.COLORS.successLight,
  },
];

export default function Step2Goal() {
  const router = useRouter();
  const { setHealthProfile } = useUserStore();

  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [targetWeight, setTargetWeight] = useState('');

  const handleNext = () => {
    setHealthProfile({
      goal: selectedGoal as any,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
    });
    const { setOnboardingStep } = useUserStore.getState();
    setOnboardingStep(2);
    AsyncStorage.setItem('@onboarding_step', '2').catch(() => {});
    router.push('/onboarding/step3-health');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingShell
        step={2}
        title="What's your main goal?"
        subtitle="Your AI trainer adapts to this"
        onSkip={() => router.push('/onboarding/step3-health')}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.id;
            return (
              <TouchableOpacity
                key={goal.id}
                onPress={() => setSelectedGoal(goal.id)}
                activeOpacity={0.8}
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardActive,
                ]}
              >
                <View style={styles.goalLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: goal.bg }]}>
                    <Ionicons name={goal.icon} size={24} color={goal.color} />
                  </View>
                  <View style={styles.goalTextCol}>
                    <Text style={[styles.goalName, isSelected && styles.goalNameActive]}>{goal.name}</Text>
                    <Text style={styles.goalDesc}>{goal.desc}</Text>
                  </View>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}

          {selectedGoal && (
            <View style={{ marginTop: theme.SPACING.lg }}>
              <GlassInput
                label="Target weight (kg)"
                placeholder="e.g. 75"
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="decimal-pad"
                icon={<Ionicons name="flag-outline" size={20} color={theme.TEXT.muted} />}
              />
            </View>
          )}

          <PrimaryButton 
            label="Continue" 
            onPress={handleNext} 
            disabled={!selectedGoal}
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
  goalCard: {
    backgroundColor: theme.BACKGROUND.input,
    borderRadius: theme.RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: theme.SPACING.lg,
    marginBottom: theme.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalCardActive: {
    backgroundColor: theme.COLORS.primaryLight,
    borderColor: theme.COLORS.primary,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.SPACING.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTextCol: {
    flex: 1,
  },
  goalName: {
    color: theme.TEXT.primary,
    fontSize: theme.FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  goalNameActive: {
    color: theme.COLORS.primary,
  },
  goalDesc: {
    color: theme.TEXT.secondary,
    fontSize: theme.FONT_SIZE.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.BACKGROUND.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.COLORS.primary,
  },
});
