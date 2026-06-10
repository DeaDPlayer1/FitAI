import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/store/onboardingStore';
import { COLORS } from '@/constants/theme';

export default function StatsScreen() {
  const router = useRouter();
  const { data, setHeight, setHeightUnit, setWeight, setWeightUnit, setAge } = useOnboardingStore();

  const [height, setHeightLocal] = useState(data.height);
  const [heightUnit, setHeightUnitLocal] = useState<'cm' | 'ft'>(data.heightUnit);
  const [weight, setWeightLocal] = useState(data.weight);
  const [weightUnit, setWeightUnitLocal] = useState<'kg' | 'lbs'>(data.weightUnit);
  const [age, setAgeLocal] = useState(data.age);

  const [focused, setFocused] = useState<string | null>(null);

  const allFilled = height.trim() && weight.trim() && age.trim();

  const handleContinue = () => {
    if (!allFilled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHeight(height);
    setHeightUnit(heightUnit);
    setWeight(weight);
    setWeightUnit(weightUnit);
    setAge(age);
    router.push('/onboarding/activity');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>A few stats to{'\n'}personalise your plan</Text>
          <Text style={styles.subtitle}>We keep this encrypted and private.</Text>

          {/* Height */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Height</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.inputWrap, focused === 'height' && styles.inputWrapFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder={heightUnit === 'cm' ? '170' : '5.7'}
                  placeholderTextColor="#D1D5DB"
                  keyboardType="decimal-pad"
                  value={height}
                  onChangeText={setHeightLocal}
                  onFocus={() => setFocused('height')}
                  onBlur={() => setFocused(null)}
                />
              </View>
              <View style={styles.unitToggle}>
                {(['cm', 'ft'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setHeightUnitLocal(u)}
                    style={[styles.unitPill, heightUnit === u && styles.unitPillActive]}
                  >
                    <Text style={[styles.unitText, heightUnit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Weight</Text>
            <View style={styles.fieldRow}>
              <View style={[styles.inputWrap, focused === 'weight' && styles.inputWrapFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder={weightUnit === 'kg' ? '70' : '154'}
                  placeholderTextColor="#D1D5DB"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeightLocal}
                  onFocus={() => setFocused('weight')}
                  onBlur={() => setFocused(null)}
                />
              </View>
              <View style={styles.unitToggle}>
                {(['kg', 'lbs'] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setWeightUnitLocal(u)}
                    style={[styles.unitPill, weightUnit === u && styles.unitPillActive]}
                  >
                    <Text style={[styles.unitText, weightUnit === u && styles.unitTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Age */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Age</Text>
            <View style={[styles.inputWrap, styles.inputFull, focused === 'age' && styles.inputWrapFocused]}>
              <TextInput
                style={styles.input}
                placeholder="25"
                placeholderTextColor="#D1D5DB"
                keyboardType="number-pad"
                value={age}
                onChangeText={setAgeLocal}
                onFocus={() => setFocused('age')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.continueBtn, !allFilled && styles.continueBtnDisabled]}
            disabled={!allFilled}
            onPress={handleContinue}
          >
            <Text style={[styles.continueText, !allFilled && styles.continueTextDisabled]}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 14, fontWeight: '600', color: '#1B1B1F',
    marginBottom: 8, marginLeft: 4,
  },
  fieldRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  inputWrap: {
    flex: 1, height: 52, borderRadius: 14,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E5E7EB',
    paddingHorizontal: 16, justifyContent: 'center',
  },
  inputWrapFocused: { borderColor: '#6A49FA' },
  inputFull: {},
  input: { fontSize: 17, fontWeight: '600', color: '#1B1B1F', padding: 0 },
  unitToggle: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 3, borderWidth: 1, borderColor: '#E5E7EB',
  },
  unitPill: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
  },
  unitPillActive: { backgroundColor: '#6A49FA' },
  unitText: { fontSize: 13, fontWeight: '700', color: '#6E6E73' },
  unitTextActive: { color: '#FFFFFF' },
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
