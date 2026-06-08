import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert,
} from 'react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useWorkoutTrackingStore, type ExerciseRecord, type SetRecord } from '@/store/workoutTrackingStore';

interface ExerciseSwapModalProps {
  visible: boolean;
  exercise: ExerciseRecord | null;
  onClose: () => void;
  onDelete: () => void;
  onFeedbackSubmit: (exerciseName: string, feedback: string) => Promise<void>;
}

const ALTERNATIVE_GROUPS: Record<string, string[]> = {
  'bench press': ['Incline Bench Press', 'Dumbbell Bench Press', 'Dumbbell Floor Press', 'Push-ups', 'Machine Chest Press'],
  'incline bench': ['Incline Dumbbell Press', 'Low Cable Fly', 'Machine Shoulder Press', 'Pec Deck'],
  'incline bench press': ['Incline Dumbbell Press', 'Machine Chest Press', 'Pec Deck', 'Cable Crossover'],
  'overhead press': ['Seated Dumbbell Press', 'Arnold Press', 'Machine Shoulder Press', 'Pike Push-ups'],
  'shoulder press': ['Seated Dumbbell Press', 'Arnold Press', 'Cable Lateral Raise'],
  'lateral raise': ['Cable Lateral Raise', 'Dumbbell Lateral Raise', 'Machine Lateral Raise', 'Upright Row'],
  'pull-ups': ['Lat Pulldown', 'Chin-ups', 'Assisted Pull-ups', 'Inverted Row'],
  'pullup': ['Lat Pulldown', 'Chin-ups', 'Assisted Pull-ups', 'Inverted Row'],
  'barbell row': ['Dumbbell Row', 'Cable Row', 'T-bar Row', 'Chest-Supported Row'],
  'bent over row': ['Dumbbell Row', 'Cable Row', 'T-bar Row', 'Chest-Supported Row'],
  'cable row': ['Barbell Row', 'Dumbbell Row', 'T-bar Row', 'Machine Row'],
  'face pull': ['Band Pull-Apart', 'Reverse Fly', 'Cable External Rotation', 'Rear Delt Fly'],
  'bicep curl': ['Hammer Curl', 'Cable Curl', 'Preacher Curl', 'Incline Curl'],
  'squat': ['Front Squat', 'Goblet Squat', 'Leg Press', 'Hack Squat'],
  'front squat': ['Goblet Squat', 'Leg Press', 'Hack Squat', 'Bulgarian Split Squat'],
  'romanian deadlift': ['Stiff-Leg Deadlift', 'Good Morning', 'Lying Leg Curl', 'Nordic Curl'],
  'leg press': ['Hack Squat', 'Belt Squat', 'Smith Squat', 'Goblet Squat'],
  'leg curl': ['Nordic Curl', 'Lying Leg Curl', 'Seated Leg Curl', 'Stiff-Leg Deadlift'],
  'calf raise': ['Seated Calf Raise', 'Donkey Calf Raise', 'Leg Press Calf Raise', 'Smith Calf Raise'],
  'deadlift': ['Romanian Deadlift', 'Sumo Deadlift', 'Trap Bar Deadlift', 'Rack Pull'],
  'incline dumbbell press': ['Flat Dumbbell Bench', 'Machine Chest Press', 'Push-ups', 'Cable Crossover'],
  'dumbbell row': ['Barbell Row', 'Cable Row', 'T-bar Row', 'Machine Row'],
};

function getAlternatives(name: string): string[] {
  const key = name.toLowerCase().trim();
  for (const [pattern, alts] of Object.entries(ALTERNATIVE_GROUPS)) {
    if (key.includes(pattern)) return alts;
  }
  return [];
}

export default function ExerciseSwapModal({ visible, exercise, onClose, onDelete, onFeedbackSubmit }: ExerciseSwapModalProps) {
  const swapExercise = useWorkoutTrackingStore(s => s.swapExercise);
  const [customName, setCustomName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const alternatives = useMemo(() => {
    if (!exercise) return [];
    return getAlternatives(exercise.name);
  }, [exercise]);

  const handleSwap = useCallback((newName: string) => {
    if (!exercise) return;
    const newExercise: ExerciseRecord = {
      ...exercise,
      name: newName,
      exerciseId: exercise.exerciseId,
    };
    swapExercise(exercise.id, newExercise);
    onClose();
    setCustomName('');
    setFeedback('');
  }, [exercise, swapExercise, onClose]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Remove Exercise',
      `Remove "${exercise?.name}" from this workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onDelete();
            onClose();
          },
        },
      ]
    );
  }, [exercise, onDelete, onClose]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!exercise || !feedback.trim()) return;
    setSubmitting(true);
    try {
      await onFeedbackSubmit(exercise.name, feedback.trim());
      setFeedback('');
      Alert.alert('Thanks!', 'Your feedback will be considered in your next plan adaptation.');
    } catch (e) {
      Alert.alert('Error', 'Could not save feedback.');
    } finally {
      setSubmitting(false);
    }
  }, [exercise, feedback, onFeedbackSubmit]);

  if (!exercise) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.duration(300).springify()} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Edit Exercise</Text>
              <Text style={styles.subtitle}>{exercise.name} · {exercise.sets.length} sets</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#F5F5F5" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>SWAP WITH</Text>
            {alternatives.length > 0 ? (
              <View style={styles.altGrid}>
                {alternatives.map((alt) => (
                  <TouchableOpacity
                    key={alt}
                    style={styles.altChip}
                    onPress={() => handleSwap(alt)}
                    activeOpacity={0.7}
                  >
                    <Feather name="refresh-cw" size={14} color="#C8FF00" />
                    <Text style={styles.altChipText}>{alt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No pre-built swaps for this exercise.</Text>
            )}

            <Text style={styles.sectionLabel}>CUSTOM EXERCISE</Text>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="e.g. Cable Crossover"
                placeholderTextColor="#7A7A7A"
                value={customName}
                onChangeText={setCustomName}
              />
              <TouchableOpacity
                style={[styles.customBtn, !customName.trim() && styles.customBtnDisabled]}
                onPress={() => customName.trim() && handleSwap(customName.trim())}
                disabled={!customName.trim()}
              >
                <Text style={styles.customBtnText}>Use</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>TELL AI WHY (OPTIONAL)</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="e.g. My shoulder hurts with this exercise, prefer chest-supported"
              placeholderTextColor="#7A7A7A"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.feedbackBtn, (!feedback.trim() || submitting) && styles.feedbackBtnDisabled]}
              onPress={handleSubmitFeedback}
              disabled={!feedback.trim() || submitting}
            >
              <Feather name="message-circle" size={14} color={feedback.trim() && !submitting ? '#0A0A0A' : '#555'} />
              <Text style={[styles.feedbackBtnText, (!feedback.trim() || submitting) && styles.feedbackBtnTextDisabled]}>
                {submitting ? 'Saving…' : 'Save Feedback'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.feedbackHint}>
              The AI will factor this in when adapting your plan next week.
            </Text>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
              <Feather name="trash-2" size={16} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Remove from this workout</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 32,
    maxHeight: '85%',
    borderTopWidth: 1, borderColor: '#2A2A2A',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A2A2A', marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#F5F5F5' },
  subtitle: { fontSize: 12, color: '#A78BFA', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: { fontSize: 11, color: '#7A7A7A', fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 10 },
  altGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  altChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(200,255,0,0.08)', borderWidth: 1, borderColor: 'rgba(200,255,0,0.2)',
  },
  altChipText: { fontSize: 13, color: '#F5F5F5', fontWeight: '500' },
  emptyText: { fontSize: 12, color: '#7A7A7A', fontStyle: 'italic' },
  customRow: { flexDirection: 'row', gap: 8 },
  customInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#141414', borderRadius: 12,
    borderWidth: 1, borderColor: '#1F1F1F', fontSize: 14, color: '#F5F5F5',
  },
  customBtn: {
    paddingHorizontal: 18, justifyContent: 'center',
    backgroundColor: '#C8FF00', borderRadius: 12,
  },
  customBtnDisabled: { backgroundColor: '#1F1F1F' },
  customBtnText: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  feedbackInput: {
    padding: 12, backgroundColor: '#141414', borderRadius: 12,
    borderWidth: 1, borderColor: '#1F1F1F',
    fontSize: 14, color: '#F5F5F5', minHeight: 80, textAlignVertical: 'top',
  },
  feedbackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, marginTop: 8,
    backgroundColor: '#C8FF00', borderRadius: 12,
  },
  feedbackBtnDisabled: { backgroundColor: '#1F1F1F' },
  feedbackBtnText: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
  feedbackBtnTextDisabled: { color: '#555' },
  feedbackHint: { fontSize: 11, color: '#7A7A7A', marginTop: 6, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: '#1F1F1F', marginVertical: 20 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
});
