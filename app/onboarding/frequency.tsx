import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { COLORS } from '@/constants/theme';

const OPTIONS = [3, 4, 5, 6];

export default function FrequencyScreen() {
  const router = useRouter();
  const { data, setFrequency } = useOnboardingStore();
  const [selected, setSelected] = useState<number | null>(data.frequency);

  const handleSelect = (days: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(days);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFrequency(selected);
    router.push('/onboarding/equipment');
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

      <View style={styles.content}>
        <Text style={styles.heading}>How many days a week?</Text>
        <Text style={styles.subtitle}>We'll build your weekly split around this.</Text>

        <View style={styles.segmentedRow}>
          {OPTIONS.map((days) => {
            const isSelected = selected === days;
            return (
              <TouchableOpacity
                key={days}
                activeOpacity={0.8}
                onPress={() => handleSelect(days)}
                style={[styles.segment, isSelected && styles.segmentSelected]}
              >
                <Text style={[styles.segmentNum, isSelected && styles.segmentNumSelected]}>
                  {days}
                </Text>
                <Text style={[styles.segmentLabel, isSelected && styles.segmentLabelSelected]}>
                  days
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle-outline" size={18} color="#6A49FA" />
          <Text style={styles.noteText}>
            We'll build your weekly split around this.
          </Text>
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
  subtitle: { fontSize: 15, color: '#6E6E73', marginBottom: 32 },
  segmentedRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  segment: {
    flex: 1, aspectRatio: 0.85, borderRadius: 16,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  segmentSelected: {
    borderColor: '#6A49FA', backgroundColor: '#6A49FA',
    shadowColor: '#6A49FA', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
  },
  segmentNum: { fontSize: 28, fontWeight: '800', color: '#1B1B1F' },
  segmentNumSelected: { color: '#FFFFFF' },
  segmentLabel: { fontSize: 12, color: '#6E6E73', marginTop: 2, fontWeight: '500' },
  segmentLabelSelected: { color: 'rgba(255,255,255,0.75)' },
  noteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EDE9FE', borderRadius: 12, padding: 16, marginTop: 24,
  },
  noteText: { fontSize: 14, color: '#453284', fontWeight: '500', flex: 1 },
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
