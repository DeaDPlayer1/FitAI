import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutTrackingStore } from '../../store/workoutTrackingStore';
import { useUserStore } from '../../store/userStore';
import { WorkoutService } from '../../lib/workoutService';
import ExerciseCard from '../../components/workout/ExerciseCard';
import RestTimerOverlay from '../../components/workout/RestTimerOverlay';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams();
  const { user } = useUserStore();
  const { workoutName, exercises, startWorkout, endWorkout, stopElapsedTimer, clearRestTimer, getElapsedFormatted } = useWorkoutTrackingStore();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newExName, setNewExName] = useState('');

  useEffect(() => {
    if (templateId) {
      initSession();
    } else if (exercises.length === 0) {
      setLoading(false);
    } else {
      setLoading(false);
    }
    return () => {
      stopElapsedTimer();
      clearRestTimer();
    };
  }, [templateId]);

  const initSession = async () => {
    setLoading(true);
    try {
      if (__DEV__) console.log('Starting session for template:', templateId);
      const data = await WorkoutService.initializeSessionFromTemplate(user?.id || '', templateId as string);
      if (__DEV__) console.log('Session initialized:', data.session.id);
      
      if (!data.exercises || data.exercises.length === 0) {
        throw new Error('This template has no exercises. Please add some in the builder first.');
      }

      // Transform DB records to Store format
      const storeExercises = data.exercises.map((se: any) => {
        // Find matching history
        const historyForEx = data.previousPerformance.filter((h: any) => h.exercise_id === se.exercise_id);
        
        return {
          id: se.id,
          exerciseId: se.exercise_id,
          name: se.exercises?.name || 'Exercise',
          notes: '',
          sectionName: se.section_name,
          restTimeSeconds: 90,
          sets: data.sets
            .filter((s: any) => s.session_exercise_id === se.id)
            .map((s: any) => {
              const hist = historyForEx.find((h: any) => h.set_number === s.set_number);
              return {
                id: s.id,
                setNumber: s.set_number,
                weight: '',
                reps: '',
                rir: '',
                isCompleted: false,
                previousWeight: hist?.weight?.toString(),
                previousReps: hist?.reps?.toString(),
                previousRir: hist?.rir?.toString()
              };
            })
        };
      });

      startWorkout(data.session.id, user?.id || '', data.session.name, storeExercises);
    } catch (err: any) {
      console.error('Error initializing session:', err);
      Alert.alert('Workout Error', err.message || 'Failed to start workout. Check your database connections.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async () => {
    try {
      const exId = `temp-${Date.now()}`;
      const newExercise = {
        id: exId,
        exerciseId: exId,
        name: newExName.trim(),
        sectionName: 'Added',
        restTimeSeconds: 90,
        notes: '',
        sets: [{ id: `set-${Date.now()}`, setNumber: 1, weight: '', reps: '', rir: '', isCompleted: false }],
      };
      useWorkoutTrackingStore.getState().exercises.push(newExercise);
      useWorkoutTrackingStore.getState().exercises = [...useWorkoutTrackingStore.getState().exercises];
      setShowAddModal(false);
      setNewExName('');
    } catch (err) {
      Alert.alert('Error', 'Failed to add exercise.');
    }
  };

  const handleFinish = async () => {
    const store = useWorkoutTrackingStore.getState();
    const currentSessionId = store.sessionId;
    const currentElapsed = store.elapsedSeconds;
    const completedSets = store.exercises.filter(e => e.sets.some(s => s.isCompleted)).length;

    Alert.alert('Finish Workout', 'Ready to save your progress?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Finish', 
        style: 'default',
        onPress: async () => {
          try {
            if (currentSessionId) {
              await WorkoutService.completeSession(currentSessionId, {
                duration_seconds: currentElapsed,
                exercises_completed: completedSets,
              });
            }
          } catch (err) {
            console.error('Failed to save session:', err);
          }
          endWorkout();
          router.replace('/(tabs)/workout');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Skeleton Header */}
        <View style={styles.header}>
          <View style={styles.iconButton}>
            <SkeletonLoader width={28} height={28} borderRadius={14} />
          </View>
          <View style={styles.headerTitleContainer}>
            <SkeletonLoader width={140} height={20} borderRadius={4} />
            <View style={{ marginTop: 4 }}>
              <SkeletonLoader width={40} height={14} borderRadius={4} />
            </View>
          </View>
          <View style={styles.finishButton}>
            <SkeletonLoader width={50} height={16} borderRadius={4} />
          </View>
        </View>

        {/* Skeleton Content */}
        <View style={styles.scrollContent}>
          <View style={{ marginBottom: 12, marginTop: 8 }}>
            <SkeletonLoader width={100} height={14} borderRadius={4} />
          </View>
          
          {/* Skeleton Exercise Card 1 */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, ...theme.shadow.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <SkeletonLoader width={160} height={20} borderRadius={4} />
              <SkeletonLoader width={24} height={24} borderRadius={12} />
            </View>
            <View style={{ gap: 12 }}>
              <SkeletonLoader width="100%" height={40} borderRadius={8} />
              <SkeletonLoader width="100%" height={40} borderRadius={8} />
              <SkeletonLoader width="100%" height={40} borderRadius={8} />
            </View>
          </View>

          {/* Skeleton Exercise Card 2 */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, ...theme.shadow.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <SkeletonLoader width={140} height={20} borderRadius={4} />
              <SkeletonLoader width={24} height={24} borderRadius={12} />
            </View>
            <View style={{ gap: 12 }}>
              <SkeletonLoader width="100%" height={40} borderRadius={8} />
              <SkeletonLoader width="100%" height={40} borderRadius={8} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Animated.View style={[styles.safeArea, { backgroundColor: '#FFFFFF' }]} entering={FadeIn}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header — minimal, dark focus mode */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            Alert.alert('End Workout?', 'Your progress will be lost if you go back.', [
              { text: 'Stay', style: 'cancel' },
              { text: 'Discard', style: 'destructive', onPress: () => router.back() },
            ]);
          }} style={styles.iconButton}>
            <Feather name="chevron-down" size={24} color="#1B1B1F" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.workoutName}>{workoutName || 'Active Workout'}</Text>
            <Text style={styles.timer}>{getElapsedFormatted()}</Text>
          </View>

          <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {exercises.map((exercise, index) => (
            <View key={exercise.id}>
              {index === 0 || exercises[index - 1].sectionName !== exercise.sectionName ? (
                <Text style={styles.sectionHeader}>{exercise.sectionName || 'Exercises'}</Text>
              ) : null}
              <ExerciseCard exercise={exercise} />
            </View>
          ))}

          <TouchableOpacity style={styles.addExerciseButton} onPress={() => setShowAddModal(true)}>
            <Feather name="plus" size={20} color={theme.colors.primary} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Exercise name"
                placeholderTextColor="#999"
                value={newExName}
                onChangeText={setNewExName}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCancel}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddExercise} style={styles.modalConfirm} disabled={!newExName.trim()}>
                  <Text style={styles.modalConfirmText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <RestTimerOverlay />
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadingText: { marginTop: 12, color: theme.colors.text.secondary, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  iconButton: { padding: 4 },
  headerTitleContainer: { alignItems: 'center' },
  workoutName: { fontSize: theme.font.size.title, fontWeight: '700', color: theme.colors.text.primary },
  timer: { fontSize: theme.font.size.caption, color: theme.colors.primary, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  finishButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.radius.pill },
  finishText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  sectionHeader: {
    fontSize: theme.font.size.micro,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.lg,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderStyle: 'dashed',
  },
  addExerciseText: { color: theme.colors.primary, fontWeight: '600', fontSize: 15, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1B1B1F' },
  modalInput: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 14, fontSize: 16, color: '#1B1B1F', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 20 },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  modalConfirm: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
