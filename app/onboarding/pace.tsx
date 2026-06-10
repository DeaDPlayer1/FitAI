import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';

const PACE_OPTIONS: Record<string, { key: string; icon: string; label: string; desc: string }[]> = {
  lose: [
    { key: '0.25', icon: 'leaf', label: '0.25 kg/week', desc: 'Slow and steady — minimal calorie cut' },
    { key: '0.5', icon: 'walk', label: '0.5 kg/week', desc: 'Recommended — balanced deficit' },
    { key: '1', icon: 'fitness', label: '1 kg/week', desc: 'Faster results, more aggressive' },
    { key: '1.5', icon: 'barbell', label: '1.5 kg/week', desc: 'Quick loss, harder to sustain' },
    { key: '2', icon: 'flame', label: '2 kg/week', desc: 'Very aggressive — not recommended' },
  ],
  gain: [
    { key: '0.25', icon: 'leaf', label: 'Mild gain', desc: '+200 cal/day — lean bulk' },
    { key: '0.5', icon: 'walk', label: 'Moderate gain', desc: '+350 cal/day — steady growth' },
    { key: '1', icon: 'fitness', label: 'Steady gain', desc: '+500 cal/day — solid bulk' },
    { key: '1.5', icon: 'barbell', label: 'Aggressive', desc: '+700 cal/day — fast mass' },
    { key: '2', icon: 'flame', label: 'Very aggressive', desc: '+900 cal/day — max bulk' },
  ],
};

export default function PaceScreen() {
  const router = useRouter();
  const { data, setWeeklyPace } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(data.goal === 'lose' ? '0.5' : '0.5');

  const options = PACE_OPTIONS[data.goal || 'lose'] || PACE_OPTIONS.lose;

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWeeklyPace(selected);
    router.push('/onboarding/create-account');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1B1B1F" />
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.dot, i <= 4 && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>How fast do you want to{'\n'}{data.goal === 'lose' ? 'lose' : 'gain'}?</Text>
        <Text style={styles.subtitle}>Choose a pace that works for you. You can change it later.</Text>

        <View style={styles.options}>
          {options.map((p) => (
            <TouchableOpacity
              key={p.key}
              activeOpacity={0.85}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelected(p.key); }}
              style={[styles.optionCard, selected === p.key && styles.optionCardActive]}
            >
              <View style={[styles.iconWrap, selected === p.key && styles.iconWrapActive]}>
                <Ionicons name={p.icon as any} size={22} color={selected === p.key ? '#6A49FA' : '#6E6E73'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, selected === p.key && styles.optionLabelActive]}>{p.label}</Text>
                <Text style={styles.optionDesc}>{p.desc}</Text>
              </View>
              {selected === p.key && <Ionicons name="checkmark-circle" size={22} color="#6A49FA" />}
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
