import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemoryStore } from '@/store/memoryStore';
import { useAiTrainerStore } from '@/store/aiTrainerStore';
import { useUserStore } from '@/store/userStore';

interface Props {
  onComplete?: () => void;
  onSkip?: () => void;
}

const MOODS: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'great', label: 'Great', icon: 'sun', color: '#F59E0B' },
  { key: 'good', label: 'Good', icon: 'smile', color: '#10B981' },
  { key: 'okay', label: 'Okay', icon: 'meh', color: '#6B7280' },
  { key: 'low', label: 'Low', icon: 'frown', color: '#8B5CF6' },
  { key: 'poor', label: 'Poor', icon: 'cloud-rain', color: '#EF4444' },
];

export default function DailyWellnessCheckin({ onComplete, onSkip }: Props) {
  const user = useUserStore(s => s.user);
  const conditions = user?.health_profile?.conditions || [];
  const hasLupus = conditions.some(c => c.toLowerCase().includes('lupus'));
  const hasCkd = conditions.some(c => c.toLowerCase().includes('ckd') || c.toLowerCase().includes('kidney'));
  const needsSymptomCheck = hasLupus || hasCkd;

  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [soreness, setSoreness] = useState(3);
  const [jointPain, setJointPain] = useState(1);
  const [mood, setMood] = useState('good');
  const [medicationAdhered, setMedicationAdhered] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');

  const { addWellnessEntry, setLastCheckinDate } = useAiTrainerStore();

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    const entry = {
      id: `wellness_${today}_morning`,
      date: today,
      type: 'morning' as const,
      energyLevel: energy,
      stressLevel: stress,
      soreness,
      jointPain: needsSymptomCheck ? jointPain : undefined,
      medicationAdhered,
      symptomNotes: notes || undefined,
      mood: mood as any,
    };
    addWellnessEntry(entry);
    setLastCheckinDate(today);

    const { addRecoveryDay } = useMemoryStore.getState();
    addRecoveryDay({
      logDate: today,
      energyLevel: energy,
      stressScore: stress,
      sorenessScore: soreness,
      fatigueScore: 10 - energy,
    });

    onComplete?.();
  };

  const renderSlider = (label: string, value: number, setValue: (v: number) => void, min = 1, max = 10) => (
    <View style={styles.sliderSection}>
      <Text style={styles.sliderLabel}>{label}: {value}/10</Text>
      <View style={styles.sliderRow}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.sliderDot, value >= v && styles.sliderDotActive]}
            onPress={() => setValue(v)}
          >
            <Text style={[styles.sliderDotText, value >= v && styles.sliderDotTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7C3AED', '#6D28D9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Feather name="sun" size={24} color="white" />
        <Text style={styles.title}>Morning Check-in</Text>
        <Text style={styles.subtitle}>How are you feeling today?</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mood */}
        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Mood</Text>
          <View style={styles.moodRow}>
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.moodBtn, mood === m.key && { backgroundColor: m.color + '20', borderColor: m.color }]}
                onPress={() => setMood(m.key)}
              >
                <Feather name={m.icon as any} size={20} color={mood === m.key ? m.color : '#9CA3AF'} />
                <Text style={[styles.moodLabel, mood === m.key && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderSlider('Energy Level', energy, setEnergy)}
        {renderSlider('Stress Level', stress, setStress)}
        {renderSlider('Muscle Soreness', soreness, setSoreness)}

        {needsSymptomCheck && (
          <>
            {renderSlider('Joint Pain', jointPain, setJointPain)}
            {hasLupus && (
              <View style={styles.medicationSection}>
                <Text style={styles.sliderLabel}>Medication Adherence</Text>
                <View style={styles.medicationRow}>
                  <TouchableOpacity
                    style={[styles.medBtn, medicationAdhered === true && styles.medBtnYes]}
                    onPress={() => setMedicationAdhered(true)}
                  >
                    <Feather name="check" size={16} color={medicationAdhered === true ? 'white' : '#10B981'} />
                    <Text style={[styles.medBtnText, medicationAdhered === true && styles.medBtnTextActive]}>Taken</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.medBtn, medicationAdhered === false && styles.medBtnNo]}
                    onPress={() => setMedicationAdhered(false)}
                  >
                    <Feather name="x" size={16} color={medicationAdhered === false ? 'white' : '#EF4444'} />
                    <Text style={[styles.medBtnText, medicationAdhered === false && styles.medBtnTextActive]}>Missed</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.sliderSection}>
          <Text style={styles.sliderLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Any symptoms, feelings, or things to note..."
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Feather name="check" size={18} color="white" />
            <Text style={styles.submitText}>Save Check-in</Text>
          </TouchableOpacity>
          {onSkip && (
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip for Today</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden' },
  header: { alignItems: 'center', padding: 24, gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: 'white' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 20, maxHeight: 500 },
  sliderSection: { marginBottom: 20 },
  sliderLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  sliderDotActive: { backgroundColor: '#7C3AED' },
  sliderDotText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  sliderDotTextActive: { color: 'white' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  moodBtn: {
    alignItems: 'center', gap: 4, padding: 10, borderRadius: 12,
    borderWidth: 2, borderColor: '#F3F4F6', width: 60,
  },
  moodLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  medicationSection: { marginBottom: 20 },
  medicationRow: { flexDirection: 'row', gap: 12 },
  medBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
    borderWidth: 2, borderColor: '#E5E7EB',
  },
  medBtnYes: { backgroundColor: '#10B981', borderColor: '#10B981' },
  medBtnNo: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  medBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  medBtnTextActive: { color: 'white' },
  notesInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 14, color: '#111827', minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: { gap: 10, marginTop: 8, paddingBottom: 20 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#111827', padding: 16, borderRadius: 16,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: 'white' },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});
