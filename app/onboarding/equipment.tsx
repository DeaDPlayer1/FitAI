import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { COLORS, theme } from '@/constants/theme';

const OPTIONS = [
  { id: 'gym', label: 'Full Gym', icon: 'fitness', desc: 'Access to a fully equipped gym' },
  { id: 'home_full', label: 'Home + Equipment', icon: 'home', desc: 'Dumbbells, bands, or basic gear' },
  { id: 'none', label: 'Bodyweight Only', icon: 'body', desc: 'No equipment — just you' },
];

export default function EquipmentScreen() {
  const router = useRouter();
  const { data, setEquipment } = useOnboardingStore();
  const [selected, setSelected] = useState<string | null>(data.equipment);

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEquipment(selected);
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
            <View key={i} style={[styles.dot, i <= 4 && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.heading}>What do you have access to?</Text>
        <Text style={styles.subtitle}>We'll match exercises to your setup.</Text>

        <View style={styles.list}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.id;
            const IconComponent = opt.id === 'none' ? Ionicons : Ionicons;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.8}
                onPress={() => handleSelect(opt.id)}
                style={[styles.card, isSelected && styles.cardSelected]}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Ionicons
                    name={opt.icon as any}
                    size={28}
                    color={isSelected ? '#6A49FA' : '#6E6E73'}
                  />
                </View>
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.cardDesc}>{opt.desc}</Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={22} color="#6A49FA" />
                  </View>
                )}
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
  list: { gap: 14 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20,
    borderWidth: 1.5, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  cardSelected: {
    borderColor: '#6A49FA',
    shadowColor: '#6A49FA', shadowOpacity: 0.10, shadowRadius: 12, elevation: 3,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  iconBoxSelected: { backgroundColor: '#EDE9FE' },
  cardLabel: { fontSize: 17, fontWeight: '700', color: '#1B1B1F', marginBottom: 4 },
  cardLabelSelected: { color: '#6A49FA' },
  cardDesc: { fontSize: 13, color: '#6E6E73', lineHeight: 18 },
  checkBadge: { position: 'absolute', top: 14, right: 14 },
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
