import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function GenderScreen() {
  const router = useRouter();
  const { setGender } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGender(selected);
    router.push('/onboarding/stats');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1B1B1F" />
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.dot, i <= 1 && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>What's your sex?</Text>
        <Text style={styles.subtitle}>Used for accurate calorie calculation.</Text>

        <View style={styles.options}>
          {[
            { key: 'male', icon: 'man', label: 'Male' },
            { key: 'female', icon: 'woman', label: 'Female' },
          ].map((g) => (
            <TouchableOpacity
              key={g.key}
              activeOpacity={0.85}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(g.key); }}
              style={[styles.optionCard, selected === g.key && styles.optionCardActive]}
            >
              <View style={[styles.iconWrap, selected === g.key && styles.iconWrapActive]}>
                <Ionicons name={g.icon as any} size={28} color={selected === g.key ? '#6A49FA' : '#6E6E73'} />
              </View>
              <Text style={[styles.optionLabel, selected === g.key && styles.optionLabelActive]}>{g.label}</Text>
              {selected === g.key && <Ionicons name="checkmark-circle" size={22} color="#6A49FA" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
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
  optionLabel: { fontSize: 16, fontWeight: '700', color: '#1B1B1F', flex: 1 },
  optionLabelActive: { color: '#6A49FA' },
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
