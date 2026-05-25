import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams();
  const { user } = useUserStore();
  const { workoutName, exercises, startWorkout, endWorkout } = useWorkoutTrackingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId) {
      initSession();
    } else if (exercises.length === 0) {
      setLoading(false);
    } else {
      setLoading(false);
    }
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
          sectionName: se.section_name,
          restTimeSeconds: 90, // Default
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

      startWorkout(data.session.id, data.session.name, storeExercises);
    } catch (err: any) {
      console.error('Error initializing session:', err);
      Alert.alert('Workout Error', err.message || 'Failed to start workout. Check your database connections.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    Alert.alert('Finish Workout', 'Ready to save your progress?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Finish', 
        style: 'default',
        onPress: () => {
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
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Feather name="chevron-down" size={28} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.workoutName}>{workoutName || 'Active Workout'}</Text>
          <Text style={styles.timer}>00:00</Text>
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

        <TouchableOpacity style={styles.addExerciseButton}>
          <Feather name="plus" size={20} color="#10B981" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <RestTimerOverlay />
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  loadingText: { marginTop: 12, color: '#6B7280', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconButton: { padding: 4 },
  headerTitleContainer: { alignItems: 'center' },
  workoutName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  timer: { fontSize: 14, color: '#10B981', fontWeight: '700', marginTop: 2 },
  finishButton: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  finishText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addExerciseText: { color: '#10B981', fontWeight: '700', fontSize: 16, marginLeft: 8 },
});
