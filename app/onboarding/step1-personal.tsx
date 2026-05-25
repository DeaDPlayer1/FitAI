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

const GENDERS = ['Male', 'Female', 'Other'] as const;

export default function Step1Personal() {
  const router = useRouter();
  const { user, setHealthProfile } = useUserStore();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const handleNext = () => {
    setHealthProfile({
      age: age ? parseInt(age) : null,
      gender: gender?.toLowerCase() as any,
      height: height ? parseFloat(height) : null,
      heightUnit,
      weight: weight ? parseFloat(weight) : null,
      weightUnit,
    });
    const { setOnboardingStep } = useUserStore.getState();
    setOnboardingStep(1);
    AsyncStorage.setItem('@onboarding_step', '1').catch(() => {});
    router.push('/onboarding/step2-goal');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OnboardingShell
        step={1}
        title="Tell us about you"
        subtitle="We use this to personalize your experience"
        showBack={false}
        onSkip={() => router.push('/onboarding/step2-goal')}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <GlassInput
            label="Full Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            icon={<Ionicons name="person-outline" size={20} color={theme.TEXT.muted} />}
          />

          <GlassInput
            label="Age"
            placeholder="25"
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
            icon={<Ionicons name="calendar-outline" size={20} color={theme.TEXT.muted} />}
          />

          {/* Gender Selector */}
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.pillRow}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGender(g)}
                style={[
                  styles.pill,
                  gender === g && styles.pillActive,
                ]}
              >
                <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Height */}
          <View style={styles.unitRow}>
            <View style={styles.unitInput}>
              <GlassInput
                label="Height"
                placeholder={heightUnit === 'cm' ? '170' : '5.7'}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                icon={<Ionicons name="resize-outline" size={20} color={theme.TEXT.muted} />}
              />
            </View>
            <View style={styles.unitToggle}>
              {(['cm', 'ft'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setHeightUnit(u)}
                  style={[styles.unitPill, heightUnit === u && styles.unitPillActive]}
                >
                  <Text style={[styles.unitPillText, heightUnit === u && styles.unitPillTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weight */}
          <View style={styles.unitRow}>
            <View style={styles.unitInput}>
              <GlassInput
                label="Current Weight"
                placeholder={weightUnit === 'kg' ? '70' : '154'}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                icon={<Ionicons name="scale-outline" size={20} color={theme.TEXT.muted} />}
              />
            </View>
            <View style={styles.unitToggle}>
              {(['kg', 'lbs'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  onPress={() => setWeightUnit(u)}
                  style={[styles.unitPill, weightUnit === u && styles.unitPillActive]}
                >
                  <Text style={[styles.unitPillText, weightUnit === u && styles.unitPillTextActive]}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <PrimaryButton 
            label="Continue" 
            onPress={handleNext} 
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
  fieldLabel: {
    color: theme.TEXT.secondary,
    fontSize: theme.FONT_SIZE.sm,
    fontWeight: '600',
    marginBottom: theme.SPACING.xs,
    paddingHorizontal: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.SPACING.sm,
    marginBottom: theme.SPACING.lg,
  },
  pill: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.RADIUS.pill,
    backgroundColor: theme.BACKGROUND.input,
    borderWidth: 1,
    borderColor: theme.BACKGROUND.cardBorder,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: theme.COLORS.primaryLight,
    borderColor: theme.COLORS.primary,
  },
  pillText: {
    color: theme.TEXT.secondary,
    fontSize: theme.FONT_SIZE.md,
    fontWeight: '500',
  },
  pillTextActive: {
    color: theme.COLORS.primary,
    fontWeight: '700',
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.SPACING.md,
  },
  unitInput: { flex: 1 },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: theme.BACKGROUND.input,
    borderRadius: theme.RADIUS.pill,
    padding: 4,
    marginBottom: theme.SPACING.lg + 12, // Align with input
    borderWidth: 1,
    borderColor: theme.BACKGROUND.cardBorder,
  },
  unitPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.RADIUS.pill,
    minWidth: 44,
    alignItems: 'center',
  },
  unitPillActive: {
    backgroundColor: theme.COLORS.primary,
    ...theme.SHADOW,
  },
  unitPillText: {
    color: theme.TEXT.muted,
    fontSize: theme.FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  unitPillTextActive: {
    color: 'white',
  },
});
