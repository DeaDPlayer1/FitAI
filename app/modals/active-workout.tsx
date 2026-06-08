import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Dimensions, Vibration
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, FadeIn, ZoomIn,
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  interpolate, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { WorkoutService } from '../../lib/workoutService';
import { useUserStore } from '../../store/userStore';
import { useWorkoutTrackingStore, ExerciseRecord, SetRecord } from '../../store/workoutTrackingStore';
import { supabase } from '../../lib/supabase';
import FinishModal from '@/components/ui/FinishModal';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Breathing Ring ───────────────────────────────────────────────────────────

function BreathingRing({ seconds, total }: { seconds: number; total: number }) {
  const progress = useSharedValue(0);
  const breathe = useSharedValue(0);
  const pct = Math.max(0, seconds / Math.max(total, 1));

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 300, easing: Easing.out(Easing.quad) });
  }, [pct]);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ), -1, true
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [0.92, 1.08]) }],
    opacity: interpolate(breathe.value, [0, 1], [0.6, 1]),
    borderColor: seconds <= 10
      ? '#EF4444'
      : interpolate(progress.value, [0, 0.5, 1], ['#6A49FA', '#00D68F', '#6A49FA'] as any) as any,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.04]) }],
  }));

  return (
    <Animated.View style={[s.restCircle, ringStyle]}>
      <Animated.View style={[s.restCircleInner, innerStyle]}>
        <Text style={[s.restTimerText, seconds <= 10 && { color: '#EF4444' }]}>
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Immersive Rest Overlay ───────────────────────────────────────────────────

const REST_TIPS = [
  'Deep breath in... slow breath out.',
  'Shake out your arms and legs.',
  'Visualise your next set with perfect form.',
  'Hydrate — even 1% dehydration drops performance.',
  'Set your grip and brace your core.',
  'Controlled reps beat heavy cheats.',
];

function RestTimerOverlay({
  seconds, onSkip, onAdd30,
}: {
  seconds: number; onSkip: () => void; onAdd30: () => void;
}) {
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTipIdx((p) => (p + 1) % REST_TIPS.length), 4000);
    return () => clearInterval(iv);
  }, []);

  return (
    <Animated.View entering={FadeInUp.springify().damping(14)} style={s.restOverlay}>
      <View style={s.restContent}>
        <Text style={s.restHeading}>REST</Text>
        <BreathingRing seconds={seconds} total={90} />
        <Text style={s.restTip}>“{REST_TIPS[tipIdx]}”</Text>
        <View style={s.restBtns}>
          <TouchableOpacity style={s.addTimeBtn} onPress={onAdd30} activeOpacity={0.8}>
            <Feather name="plus" size={14} color="#6A49FA" />
            <Text style={s.addTimeBtnText}>+30s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.skipBtn} onPress={onSkip} activeOpacity={0.8}>
            <Text style={s.skipBtnText}>Skip</Text>
            <Feather name="skip-forward" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Glow Burst ────────────────────────────────────────────────────────────────

function CompletionGlow({ visible }: { visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0;
      opacity.value = 1;
      scale.value = withTiming(2, { duration: 500, easing: Easing.out(Easing.quad) });
      opacity.value = withTiming(0, { duration: 500 });
    }
  }, [visible]);

  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;
  return <Animated.View style={[s.glowBurst, glow]} />;
}

// ─── Set Card — Premium ────────────────────────────────────────────────────────

function SetCard({
  set, index, isActive, onUpdateField, onToggleComplete,
}: {
  set: SetRecord; index: number; isActive: boolean;
  onUpdateField: (field: keyof SetRecord, value: string) => void;
  onToggleComplete: () => void;
}) {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleToggle = () => {
    if (!set.isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate(30);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggleComplete();
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify().damping(16)}
      style={[
        s.setCard,
        set.isCompleted && s.setCardDone,
        isActive && !set.isCompleted && s.setCardActive,
      ]}
    >
      <CompletionGlow visible={justCompleted} />
      <View style={[s.setNumBox, set.isCompleted && s.setNumBoxDone]}>
        <Text style={[s.setNumText, set.isCompleted && s.setNumTextDone]}>{index + 1}</Text>
      </View>

      <View style={s.setInputs}>
        {(set.previousWeight || set.previousReps) && (
          <Text style={s.prevPerf}>
            Prev: {set.previousWeight || '—'}kg × {set.previousReps || '—'}
          </Text>
        )}
        <View style={s.inputsRow}>
          <View style={s.inputGroup}>
            <TextInput
              style={[s.setInput, set.isCompleted && s.setInputDone]}
              keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
              placeholder={set.previousWeight || '0'}
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={set.weight}
              onChangeText={(v) => onUpdateField('weight', v)}
              editable={!set.isCompleted}
            />
            <Text style={s.unitLabel}>kg</Text>
          </View>
          <View style={s.inputSep} />
          <View style={s.inputGroup}>
            <TextInput
              style={[s.setInput, set.isCompleted && s.setInputDone]}
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              placeholder={set.previousReps || '0'}
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={set.reps}
              onChangeText={(v) => onUpdateField('reps', v)}
              editable={!set.isCompleted}
            />
            <Text style={s.unitLabel}>reps</Text>
          </View>
          <View style={s.inputSep} />
          <View style={s.inputGroup}>
            <TextInput
              style={[s.setInput, set.isCompleted && s.setInputDone]}
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              placeholder="—"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={set.rir}
              onChangeText={(v) => onUpdateField('rir', v)}
              editable={!set.isCompleted}
            />
            <Text style={s.unitLabel}>RIR</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[s.checkBtn, set.isCompleted && s.checkBtnDone]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Feather
          name={set.isCompleted ? 'check' : 'circle'}
          size={20}
          color={set.isCompleted ? '#0D0D0F' : (isActive ? '#6A49FA' : 'rgba(255,255,255,0.35)')}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Exercise Card — Immersive ─────────────────────────────────────────────────

function ExerciseCard({
  exercise, isActive, onToggleSet, onUpdateSetField, onAddSet, onUpdateNotes,
}: {
  exercise: ExerciseRecord; isActive: boolean;
  onToggleSet: (setId: string) => void;
  onUpdateSetField: (setId: string, field: keyof SetRecord, value: string) => void;
  onAddSet: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const setsDone = exercise.sets.filter((s) => s.isCompleted).length;
  const setsTotal = exercise.sets.length;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={s.exCard}>
      <View style={s.exCardHeader}>
        <View style={s.exCardIconBox}>
          <MaterialCommunityIcons name="dumbbell" size={22} color="#6A49FA" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.exName}>{exercise.name}</Text>
          <Text style={s.exSubtitle}>
            {setsDone}/{setsTotal} sets · {exercise.restTimeSeconds}s rest
          </Text>
        </View>
        <View style={s.exProgressBadge}>
          <Text style={s.exProgressText}>{setsDone}/{setsTotal}</Text>
        </View>
      </View>

      {setsDone > 0 && setsDone < setsTotal && (
        <View style={s.aiCue}>
          <Feather name="zap" size={12} color="#00D68F" />
          <Text style={s.aiCueText}>
            {setsDone >= setsTotal - 1 ? 'Final set — leave it all out' : 'You\'re strong today'}
          </Text>
        </View>
      )}

      <View style={s.colHeaders}>
        <View style={{ width: 36 }} />
        <View style={s.setInputs}>
          <View style={s.inputsRow}>
            <Text style={s.colHeader}>KG</Text>
            <View style={s.inputSep} />
            <Text style={s.colHeader}>REPS</Text>
            <View style={s.inputSep} />
            <Text style={s.colHeader}>RIR</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {exercise.sets.map((set, idx) => (
        <SetCard
          key={set.id}
          set={set}
          index={idx}
          isActive={false}
          onUpdateField={(field, val) => onUpdateSetField(set.id, field, val)}
          onToggleComplete={() => onToggleSet(set.id)}
        />
      ))}

      <TouchableOpacity style={s.addSetBtn} onPress={onAddSet} activeOpacity={0.7}>
        <Feather name="plus" size={14} color="#6A49FA" />
        <Text style={s.addSetText}>Add Set</Text>
      </TouchableOpacity>

      <TextInput
        style={s.notesInput}
        placeholder="Notes..."
        placeholderTextColor="rgba(255,255,255,0.25)"
        value={exercise.notes}
        onChangeText={onUpdateNotes}
        multiline
      />
    </Animated.View>
  );
}

// ─── Floating Volume Counter ───────────────────────────────────────────────────

function VolumeCounter() {
  const store = useWorkoutTrackingStore();
  const total = store.exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((ss, set) =>
      ss + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0), 0);
  const display = total >= 1000 ? `${(total / 1000).toFixed(1)}k` : String(total);

  return (
    <View style={s.volumePill}>
      <Feather name="trending-up" size={12} color="#00D68F" />
      <Text style={s.volumeText}>{display} kg</Text>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ActiveWorkoutModal() {
  const router = useRouter();
  const { user } = useUserStore();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const {
    sessionId, workoutName, exercises, activeRestTimer,
    elapsedSeconds, getElapsedFormatted,
    startWorkout, endWorkout, updateSet, updateExerciseNotes,
    toggleSetComplete, addSet,
    startRestTimer, addRestTime, clearRestTimer,
  } = useWorkoutTrackingStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);

  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showJumpModal, setShowJumpModal] = useState(false);

  const currentEx = exercises[currentExIdx] || null;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.isCompleted).length, 0);
  const progressPct = totalSets > 0 ? completedSets / totalSets : 0;

  const totalVolume = exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((ss, set) =>
      ss + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0), 0);

  useEffect(() => {
    if (sessionId) { setIsLoading(false); return; }
    if (user?.id) {
      if (templateId) init(templateId);
      else fetchTemplates();
    }
  }, [user?.id, templateId, sessionId]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('id, name, notes')
        .eq('user_id', user!.id);
      if (error) throw error;
      setTemplates(data || []);
      setShowTemplatePicker(true);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to fetch templates.');
      router.back();
    } finally { setIsLoading(false); }
  };

  const init = async (idToUse: string) => {
    setIsLoading(true);
    try {
      const data = await WorkoutService.initializeSessionFromTemplate(user!.id, idToUse);
      const exRecords: ExerciseRecord[] = data.exercises.map((se: any) => {
        const matchingSets = data.sets
          .filter((s: any) => s.session_exercise_id === se.id)
          .sort((a: any, b: any) => a.set_number - b.set_number);
        const setRecords: SetRecord[] = matchingSets.map((s: any) => {
          const prev = data.previousPerformance?.find(
            (p: any) => p.exercise_id === se.exercise_id && p.set_number === s.set_number
          );
          return {
            id: s.id, setNumber: s.set_number, weight: '', reps: '', rir: '',
            isCompleted: false,
            previousWeight: prev?.weight ? String(prev.weight) : undefined,
            previousReps: prev?.reps ? String(prev.reps) : undefined,
            previousRir: prev?.rir != null ? String(prev.rir) : undefined,
          };
        });
        return {
          id: se.id, exerciseId: se.exercise_id, name: se.exercises?.name || 'Exercise',
          notes: '', sets: setRecords, restTimeSeconds: 90,
        };
      });
      startWorkout(data.session.id, user!.id, data.session.name, exRecords);
      if (exRecords.length > 0 && exRecords[0].sets.length > 0) {
        useWorkoutTrackingStore.getState().setActiveSet(exRecords[0].sets[0].id);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start session');
      router.back();
    } finally { setIsLoading(false); }
  };

  const handleFinishWorkout = async () => {
    setFinishing(true);
    try {
      if (sessionId) {
        await supabase.from('workout_sessions').update({
          end_time: new Date().toISOString(), status: 'completed', volume_load: totalVolume,
        }).eq('id', sessionId);
      }
      const summaryExercises = exercises.map(ex => ({
        name: ex.name,
        volume: ex.sets.reduce((s, set) => s + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)), 0),
        completedSets: ex.sets.filter(s => s.isCompleted).length,
        totalSets: ex.sets.length,
      }));
      endWorkout();
      router.replace({
        pathname: '/workout/summary',
        params: {
          duration: getElapsedFormatted(),
          totalVolume: String(totalVolume),
          completedSets: String(completedSets),
          totalSets: String(totalSets),
          exerciseCount: String(exercises.length),
          workoutName: workoutName || 'Workout',
          exercises: JSON.stringify(summaryExercises),
        },
      });
    } catch (e) {
      endWorkout();
      router.replace('/(tabs)/workout');
    } finally { setFinishing(false); }
  };

  const goToExercise = (idx: number) => {
    setCurrentExIdx(idx);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: '#111114' }]} edges={['top', 'bottom']}>
        <View style={s.header}>
          <View style={{ width: 44, height: 44 }} />
          <View style={s.headerCenter}>
            <View style={{ width: 140, height: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 }} />
            <View style={{ width: 60, height: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, marginTop: 6 }} />
          </View>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ paddingHorizontal: 20, marginBottom: 16, paddingTop: 8 }}>
          <View style={{ width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <Animated.View entering={FadeIn.duration(800)} style={{ width: '30%', height: 3, backgroundColor: 'rgba(106,73,250,0.4)', borderRadius: 2 }} />
          </View>
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} entering={FadeInDown.delay(i * 120).springify()}
              style={{ backgroundColor: '#1A1A1F', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ width: 120, height: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 7 }} />
                  <View style={{ width: 80, height: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 5 }} />
                </View>
              </View>
              {[0, 1, 2].map((j) => (
                <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)' }} />
                  <View style={{ flex: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />
                  <View style={{ flex: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />
                </View>
              ))}
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (showTemplatePicker) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: '#111114' }]} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} activeOpacity={0.7}>
            <Feather name="chevron-down" size={24} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { fontSize: 16 }]}>Select Workout</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView style={{ flex: 1, paddingHorizontal: 20, marginTop: 10 }}
          contentContainerStyle={{ paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.45)', lineHeight: 20, marginBottom: 8 }}>
            Choose a routine from your templates to start tracking.
          </Text>
          {templates.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="rgba(255,255,255,0.25)" />
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>No workout templates found.</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#6A49FA', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 10 }}
                onPress={() => { router.back(); router.push('/workout/builder'); }}>
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Create a Template</Text>
              </TouchableOpacity>
            </View>
          ) : (
            templates.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1F', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}
                onPress={() => { setShowTemplatePicker(false); init(tpl.id); }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(106,73,250,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color="#6A49FA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{tpl.name}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{tpl.notes ? 'Weekly Split' : 'Template'}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!currentEx) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: '#111114', alignItems: 'center', justifyContent: 'center' }]}>
        <MaterialCommunityIcons name="dumbbell" size={48} color="rgba(255,255,255,0.25)" />
        <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 16 }}>No exercises found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#6A49FA', borderRadius: 14 }}>
          <Text style={{ fontWeight: '700', color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: '#111114' }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Immersive Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.closeBtn} activeOpacity={0.7}>
            <Feather name="chevron-down" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{workoutName || 'Workout'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Feather name="clock" size={11} color="rgba(255,255,255,0.35)" />
              <Text style={s.headerElapsed}>{getElapsedFormatted()}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.finishBtn} onPress={() => setShowFinishModal(true)} activeOpacity={0.8}>
            <Text style={s.finishBtnText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* ── Animated Progress ── */}
        <View style={s.progressBarContainer}>
          <View style={s.progressBg}>
            <Animated.View
              style={[
                s.progressFill,
                { width: `${Math.max(progressPct * 100, 2)}%` },
                progressPct >= 1 && { backgroundColor: '#00D68F' },
              ]}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={s.progressLabel}>{Math.round(progressPct * 100)}%</Text>
            <VolumeCounter />
          </View>
        </View>

        {/* ── Horizontal Exercise Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.exTabsRow}
          style={{ maxHeight: 44, marginBottom: 8 }}
        >
          {exercises.map((ex, idx) => {
            const done = ex.sets.every(s => s.isCompleted);
            const isActive = idx === currentExIdx;
            return (
              <TouchableOpacity
                key={ex.id}
                style={[s.exTab, isActive && s.exTabActive, done && s.exTabDone]}
                onPress={() => goToExercise(idx)}
                activeOpacity={0.7}
              >
                <Text style={[s.exTabText, isActive && s.exTabTextActive]} numberOfLines={1}>
                  {ex.name}
                </Text>
                {done && <Feather name="check" size={10} color={isActive ? '#FFFFFF' : '#00D68F'} style={{ marginLeft: 4 }} />}
                <View style={[s.exTabDot, isActive && { backgroundColor: '#FFFFFF' }]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Current Exercise ── */}
          <ExerciseCard
            exercise={currentEx}
            isActive={true}
            onToggleSet={(setId) => {
              toggleSetComplete(currentEx.id, setId);
            }}
            onUpdateSetField={(setId, field, val) => updateSet(currentEx.id, setId, field, val)}
            onAddSet={() => addSet(currentEx.id)}
            onUpdateNotes={(v) => updateExerciseNotes(currentEx.id, v)}
          />

          {/* ── Navigation ── */}
          <View style={s.navRow}>
            <TouchableOpacity
              style={[s.navBtn, currentExIdx === 0 && s.navBtnDisabled]}
              onPress={() => goToExercise(Math.max(0, currentExIdx - 1))}
              disabled={currentExIdx === 0}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={16} color={currentExIdx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)'} />
            </TouchableOpacity>

            <TouchableOpacity style={s.exJumpBtn} onPress={() => setShowJumpModal(true)} activeOpacity={0.7}>
              <Text style={s.exJumpText}>{currentExIdx + 1}/{exercises.length}</Text>
            </TouchableOpacity>

            {currentExIdx < exercises.length - 1 ? (
              <TouchableOpacity
                style={s.nextExBtn}
                onPress={() => goToExercise(currentExIdx + 1)}
                activeOpacity={0.8}
              >
                <Text style={s.nextExBtnText}>Next</Text>
                <Feather name="chevron-right" size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[s.nextExBtn, { backgroundColor: '#00D68F' }]}
                onPress={() => setShowFinishModal(true)}
                activeOpacity={0.8}
              >
                <Text style={s.nextExBtnText}>Finish</Text>
                <Feather name="check" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* ── Rest Timer Overlay ── */}
        {activeRestTimer !== null && activeRestTimer > 0 && (
          <RestTimerOverlay
            seconds={activeRestTimer}
            onSkip={clearRestTimer}
            onAdd30={() => addRestTime(30)}
          />
        )}

        {/* ── Exercise Jump Modal ── */}
        {showJumpModal && (
          <TouchableOpacity style={s.jumpOverlay} activeOpacity={1} onPress={() => setShowJumpModal(false)}>
            <Animated.View entering={FadeInDown.springify()} style={s.jumpSheet}>
              <Text style={s.jumpTitle}>Jump to Exercise</Text>
              {exercises.map((ex, idx) => {
                const done = ex.sets.every(s => s.isCompleted);
                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={[s.jumpRow, idx === currentExIdx && s.jumpRowActive]}
                    onPress={() => { goToExercise(idx); setShowJumpModal(false); }}
                  >
                    <View style={[s.jumpDot, done && { backgroundColor: '#00D68F' }, idx === currentExIdx && { backgroundColor: '#6A49FA' }]} />
                    <Text style={[s.jumpExName, idx === currentExIdx && { color: '#FFFFFF' }]}>{ex.name}</Text>
                    <Text style={s.jumpExSets}>
                      {ex.sets.filter(s => s.isCompleted).length}/{ex.sets.length}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      <FinishModal
        visible={showFinishModal}
        completedSets={completedSets}
        totalSets={totalSets}
        elapsed={getElapsedFormatted()}
        onCancel={() => setShowFinishModal(false)}
        onConfirm={handleFinishWorkout}
        finishing={finishing}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#111114', gap: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  closeBtn: { padding: 4, width: 44 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  headerElapsed: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.45)', fontVariant: ['tabular-nums'] },
  finishBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12,
  },
  finishBtnText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },

  progressBarContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#111114', gap: 10,
  },
  progressBg: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6A49FA', borderRadius: 2 },
  progressLabel: { fontSize: 12, fontWeight: '800', color: '#6A49FA', minWidth: 36, textAlign: 'right', fontVariant: ['tabular-nums'] },

  volumePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,214,143,0.12)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  volumeText: { fontSize: 11, fontWeight: '700', color: '#00D68F', fontVariant: ['tabular-nums'] },

  exTabsRow: { paddingHorizontal: 16, gap: 8 },
  exTab: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, backgroundColor: '#1A1A1F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    maxWidth: 150,
  },
  exTabActive: { backgroundColor: '#6A49FA', borderColor: '#6A49FA' },
  exTabDone: { borderColor: '#00D68F' },
  exTabText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  exTabTextActive: { color: '#FFFFFF' },
  exTabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginLeft: 6 },

  exCard: {
    backgroundColor: '#1A1A1F', borderRadius: 24, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  exCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  exCardIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(106,73,250,0.15)', alignItems: 'center', justifyContent: 'center' },
  exName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  exSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.45)' },
  exProgressBadge: { backgroundColor: 'rgba(106,73,250,0.15)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  exProgressText: { fontSize: 13, fontWeight: '800', color: '#6A49FA' },

  aiCue: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, marginTop: -4,
    backgroundColor: 'rgba(0,214,143,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  aiCueText: { fontSize: 12, fontWeight: '500', color: '#00D68F', flex: 1 },

  colHeaders: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingHorizontal: 4 },
  colHeader: { flex: 1, fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.25)', textAlign: 'center', letterSpacing: 0.5 },

  setCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16,
    padding: 10, marginBottom: 8, gap: 8, borderWidth: 1, borderColor: 'transparent', overflow: 'hidden',
  },
  setCardDone: {
    backgroundColor: 'rgba(0,214,143,0.06)', borderColor: 'rgba(0,214,143,0.2)',
  },
  setCardActive: {
    borderColor: 'rgba(106,73,250,0.4)', backgroundColor: 'rgba(106,73,250,0.06)',
  },
  glowBurst: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,214,143,0.2)',
    top: -20, left: -20,
  },
  setNumBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  setNumBoxDone: { backgroundColor: '#00D68F' },
  setNumText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  setNumTextDone: { color: '#0D0D0F' },
  setInputs: { flex: 1 },
  prevPerf: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.25)', marginBottom: 4, textAlign: 'center' },
  inputsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  inputGroup: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3 },
  inputSep: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  setInput: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', minWidth: 36, textAlign: 'center', padding: 0, fontVariant: ['tabular-nums'] },
  setInputDone: { color: '#00D68F' },
  unitLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.25)' },
  checkBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  checkBtnDone: { backgroundColor: '#00D68F' },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 4, borderWidth: 1, borderColor: 'rgba(106,73,250,0.2)', borderStyle: 'dashed', borderRadius: 14, marginBottom: 12 },
  addSetText: { fontSize: 13, fontWeight: '600', color: '#6A49FA' },
  notesInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)', minHeight: 48, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  navBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1A1A1F', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  navBtnDisabled: { opacity: 0.3 },
  exJumpBtn: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(106,73,250,0.1)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(106,73,250,0.2)' },
  exJumpText: { fontSize: 14, fontWeight: '700', color: '#6A49FA' },
  nextExBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, backgroundColor: '#6A49FA', borderRadius: 16 },
  nextExBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },

  restOverlay: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#1A1A1F', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  restContent: { alignItems: 'center', gap: 16 },
  restHeading: { fontSize: 11, fontWeight: '700', color: '#6A49FA', letterSpacing: 2 },
  restCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(106,73,250,0.08)', alignItems: 'center', justifyContent: 'center' },
  restCircleInner: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#6A49FA', alignItems: 'center', justifyContent: 'center', gap: 2 },
  restTimerText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', fontVariant: ['tabular-nums'] },
  restTip: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.45)', textAlign: 'center', fontStyle: 'italic' },
  restBtns: { flexDirection: 'row', gap: 12 },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'rgba(106,73,250,0.12)', borderRadius: 14 },
  addTimeBtnText: { fontSize: 13, fontWeight: '700', color: '#6A49FA' },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#6A49FA', borderRadius: 14 },
  skipBtnText: { fontSize: 13, fontWeight: '700', color: 'white' },

  jumpOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end', paddingBottom: 40, paddingHorizontal: 20,
  },
  jumpSheet: { backgroundColor: '#1A1A1F', borderRadius: 24, padding: 20, gap: 4 },
  jumpTitle: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  jumpRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  jumpRowActive: { backgroundColor: 'rgba(106,73,250,0.12)' },
  jumpDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  jumpExName: { flex: 1, fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  jumpExSets: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)', fontVariant: ['tabular-nums'] },
});
