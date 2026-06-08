import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { COLORS } from '@/constants/theme';

const LEVELS = [
  {
    id: 'beginner', label: 'Beginner', desc: 'Less than 1 year',
    bars: 1, color: '#F97316',
  },
  {
    id: 'intermediate', label: 'Intermediate', desc: '1–3 years',
    bars: 2, color: '#6A49FA',
  },
  {
    id: 'advanced', label: 'Advanced', desc: '3+ years',
    bars: 3, color: '#22C55E',
  },
];

export default function ExperienceScreen() {
  const router = useRouter();
  const { data, setExperienceLevel } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(data.experienceLevel);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExperienceLevel(selected);
    router.push('/onboarding/frequency');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1B1B1F" />
        </TouchableOpacity>
        <View style={styles.dotsRow}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={[styles.dot, i <= 2 && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>How experienced are you?</Text>
        <Text style={styles.subtitle}>So we set the right starting intensity.</Text>

        <View style={styles.list}>
          {LEVELS.map((lvl) => {
            const isSelected = selected === lvl.id;
            return (
              <TouchableOpacity
                key={lvl.id}
                activeOpacity={0.8}
                onPress={() => handleSelect(lvl.id)}
                style={[styles.row, isSelected && styles.rowSelected]}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.barsRow, isSelected && { borderColor: lvl.color }]}>
                    {[1, 2, 3].map((b) => (
                      <View
                        key={b}
                        style={[
                          styles.bar,
                          { backgroundColor: b <= lvl.bars ? lvl.color : '#E5E7EB' },
                          b <= lvl.bars && isSelected && styles.barActive,
                        ]}
                      />
                    ))}
                  </View>
                  <View>
                    <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                      {lvl.label}
                    </Text>
                    <Text style={styles.rowDesc}>{lvl.desc}</Text>
                  </View>
                </View>
                <View style={[styles.radio, isSelected && { borderColor: lvl.color, backgroundColor: lvl.color + '15' }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: lvl.color }]} />}
                </View>
              </TouchableOpacity>
            );
          })}
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
  subtitle: { fontSize: 15, color: '#6E6E73', marginBottom: 24 },
  list: { gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  rowSelected: { borderColor: '#6A49FA', shadowOpacity: 0.08 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  barsRow: {
    flexDirection: 'row', gap: 4, padding: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
  },
  bar: { width: 6, height: 24, borderRadius: 3 },
  barActive: {},
  rowLabel: { fontSize: 16, fontWeight: '700', color: '#1B1B1F', marginBottom: 2 },
  rowLabelSelected: { color: '#6A49FA' },
  rowDesc: { fontSize: 13, color: '#6E6E73' },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
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
