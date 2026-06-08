import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { COLORS } from '@/constants/theme';

const GOALS = [
  { id: 'fat_loss', label: 'Lose Weight', icon: 'flame', color: '#F97316' },
  { id: 'muscle_gain', label: 'Build Muscle', icon: 'barbell', color: '#6A49FA' },
  { id: 'endurance', label: 'Improve Endurance', icon: 'speedometer', color: '#22C55E' },
  { id: 'active', label: 'Stay Active', icon: 'heart', color: '#EF4444' },
];

export default function GoalScreen() {
  const router = useRouter();
  const { data, setGoal } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(data.goal);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGoal(selected);
    router.push('/onboarding/experience');
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
        <Text style={styles.heading}>What's your goal?</Text>
        <Text style={styles.subtitle}>We'll tailor your plan around this.</Text>

        <View style={styles.grid}>
          {GOALS.map((g) => {
            const isSelected = selected === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                activeOpacity={0.8}
                onPress={() => handleSelect(g.id)}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <View style={[styles.iconBox, { backgroundColor: g.color + '15' }]}>
                  <Ionicons name={g.icon as any} size={28} color={g.color} />
                </View>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {g.label}
                </Text>
                {isSelected && <View style={[styles.checkRing, { borderColor: COLORS.primary }]}>
                  <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                </View>}
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
  subtitle: { fontSize: 15, color: '#6E6E73', marginBottom: 28 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
  },
  card: {
    width: '47%', aspectRatio: 1, borderRadius: 20,
    backgroundColor: '#FFFFFF', padding: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#6A49FA',
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  cardLabel: { fontSize: 15, fontWeight: '700', color: '#1B1B1F', textAlign: 'center' },
  cardLabelSelected: { color: '#6A49FA' },
  checkRing: {
    position: 'absolute', top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
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
