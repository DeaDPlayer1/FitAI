import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { ACTIVITY_LABELS } from '@/lib/tdee';

const LEVELS = [
  { key: 'sedentary' as const, icon: 'bed', ...ACTIVITY_LABELS.sedentary },
  { key: 'light' as const, icon: 'walk', ...ACTIVITY_LABELS.light },
  { key: 'moderate' as const, icon: 'fitness', ...ACTIVITY_LABELS.moderate },
  { key: 'active' as const, icon: 'barbell', ...ACTIVITY_LABELS.active },
  { key: 'very_active' as const, icon: 'flame', ...ACTIVITY_LABELS.very_active },
];

export default function ActivityScreen() {
  const router = useRouter();
  const { data, setActivityLevel } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(data.activityLevel);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivityLevel(selected);

    if (data.goal === 'lose' || data.goal === 'gain') {
      router.push('/onboarding/pace');
    } else {
      router.push('/onboarding/create-account');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1B1B1F" />
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.dot, i <= 3 && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>How active are you?</Text>
        <Text style={styles.subtitle}>This helps us calculate your daily calorie needs.</Text>

        <View style={styles.options}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l.key}
              activeOpacity={0.85}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(l.key); }}
              style={[styles.optionCard, selected === l.key && styles.optionCardActive]}
            >
              <View style={[styles.iconWrap, selected === l.key && styles.iconWrapActive]}>
                <Ionicons name={l.icon as any} size={22} color={selected === l.key ? '#6A49FA' : '#6E6E73'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, selected === l.key && styles.optionLabelActive]}>{l.title}</Text>
                <Text style={styles.optionDesc}>{l.desc}</Text>
              </View>
              {selected === l.key && <Ionicons name="checkmark-circle" size={22} color="#6A49FA" />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          disabled={!selected}
          onPress={handleContinue}
        >
          <Text style={[styles.continueText, !selected && styles.continueTextDisabled]}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  dotActive: { backgroundColor: '#6A49FA', width: 20, borderRadius: 4 },
  content: { flex: 1, paddingHorizontal: 24 },
  scrollContent: { paddingTop: 16, paddingBottom: 24 },
  heading: { fontSize: 28, fontWeight: '800', color: '#1B1B1F', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6E6E73', marginBottom: 28 },
  options: { gap: 12 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  optionCardActive: { borderColor: '#6A49FA', backgroundColor: '#F5F3FF' },
  iconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: '#EDE9FE' },
  optionLabel: { fontSize: 16, fontWeight: '700', color: '#1B1B1F' },
  optionLabelActive: { color: '#6A49FA' },
  optionDesc: { fontSize: 13, color: '#6E6E73', marginTop: 2 },
  bottom: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 8 },
  continueBtn: {
    backgroundColor: '#6A49FA', borderRadius: 16, height: 54,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6A49FA', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  continueBtnDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0 },
  continueText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  continueTextDisabled: { color: '#9CA3AF' },
});
