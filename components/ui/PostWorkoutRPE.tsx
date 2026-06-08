import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { useMemoryStore } from '@/store/memoryStore';
import { SESSION_RPE_MIN, SESSION_RPE_MAX, WELLNESS_MIN, WELLNESS_MAX } from '@/constants/aiTrainerStates';

interface Props {
  onComplete?: () => void;
  onSkip?: () => void;
}

const RPE_LABELS = ['Warm-up', 'Very Light', 'Light', 'Moderate', 'Somewhat Hard', 'Hard', 'Very Hard', 'Extremely Hard', 'Maximal', 'Absolute Max'];

export default function PostWorkoutRPE({ onComplete, onSkip }: Props) {
  const [rpe, setRpe] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [fatigue, setFatigue] = useState(5);
  const { addRecoveryDay, addBehavioralEvent } = useMemoryStore();

  const handleSubmit = () => {
    const today = new Date().toISOString().split('T')[0];
    addRecoveryDay({
      logDate: today,
      sorenessScore: soreness,
      fatigueScore: fatigue,
      recoveryScore: Math.round((1 - (soreness + fatigue) / 20) * 100),
    });
    addBehavioralEvent({
      eventType: 'completed_session',
      context: `RPE ${rpe}, soreness ${soreness}, fatigue ${fatigue}`,
      createdAt: new Date().toISOString(),
    });
    onComplete?.();
  };

  const renderSlider = (label: string, value: number, setValue: (v: number) => void, labels: string[], min = 1, max = 10) => (
    <View style={styles.sliderSection}>
      <Text style={styles.sliderLabel}>{label}: {value}/10</Text>
      <Text style={styles.sliderDesc}>{labels[value - 1] || ''}</Text>
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
        <Feather name="activity" size={24} color="white" />
        <Text style={styles.title}>Rate Your Session</Text>
        <Text style={styles.subtitle}>How did that feel?</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSlider('Session RPE', rpe, setRpe, RPE_LABELS)}
        {renderSlider('Muscle Soreness', soreness, setSoreness,
          ['None', 'Very Mild', 'Mild', 'Slight', 'Moderate', 'Noticeable', 'Uncomfortable', 'Painful', 'Very Painful', 'Excruciating'])}
        {renderSlider('Fatigue Level', fatigue, setFatigue,
          ['Fully Energized', 'Slightly Tired', 'Mildly Fatigued', 'Moderate', 'Noticeably Fatigued', 'Tired', 'Very Tired', 'Exhausted', 'Drained', 'Completely Exhausted'])}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Feather name="check" size={18} color="white" />
            <Text style={styles.submitText}>Save & Continue</Text>
          </TouchableOpacity>
          {onSkip && (
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
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
  sliderSection: { marginBottom: 24 },
  sliderLabel: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  sliderDesc: { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  sliderDotActive: { backgroundColor: '#7C3AED' },
  sliderDotText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  sliderDotTextActive: { color: 'white' },
  actions: { gap: 10, marginTop: 8, paddingBottom: 20 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#111827', padding: 16, borderRadius: 16,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: 'white' },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
});
