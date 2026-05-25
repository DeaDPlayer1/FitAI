import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Modal, Dimensions, Vibration
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { WorkoutService } from '../../lib/workoutService';
import { useUserStore } from '../../store/userStore';
import { useWorkoutTrackingStore, ExerciseRecord, SetRecord } from '../../store/workoutTrackingStore';
import { supabase } from '../../lib/supabase';
import FinishModal from '@/components/ui/FinishModal';

const { width } = Dimensions.get('window');

// ─── Rest Timer Overlay ───────────────────────────────────────────────────────

function RestTimerOverlay({
  seconds,
  onSkip,
  onAdd30,
}: {
  seconds: number;
  onSkip: () => void;
  onAdd30: () => void;
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = Math.min(1, seconds / 90);

  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.restOverlay}>
      <View style={styles.restContent}>
        <Text style={styles.restHeading}>REST</Text>

        {/* Circle Timer */}
        <View style={styles.restCircle}>
          <View style={[styles.restCircleInner, { borderColor: seconds <= 10 ? '#EF4444' : theme.colors.accent.primary }]}>
            <Text style={[styles.restTimerText, seconds <= 10 && { color: '#EF4444' }]}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
            <Text style={styles.restTimerLabel}>remaining</Text>
          </View>
        </View>

        <View style={styles.restBtns}>
          <TouchableOpacity style={styles.addTimeBtn} onPress={onAdd30} activeOpacity={0.8}>
            <Feather name="plus" size={14} color={theme.colors.accent.primary} />
            <Text style={styles.addTimeBtnText}>+30s</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
            <Feather name="skip-forward" size={14} color="white" />
            <Text style={styles.skipBtnText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Set Card ─────────────────────────────────────────────────────────────────

function SetCard({
  set,
  index,
  isActive,
  onUpdateField,
  onToggleComplete,
}: {
  set: SetRecord;
  index: number;
  isActive: boolean;
  onUpdateField: (field: keyof SetRecord, value: string) => void;
  onToggleComplete: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={[
        styles.setCard,
        set.isCompleted && styles.setCardDone,
        isActive && !set.isCompleted && styles.setCardActive,
      ]}
    >
      {/* Set Number */}
      <View style={[styles.setNumBox, set.isCompleted && styles.setNumBoxDone]}>
        <Text style={[styles.setNumText, set.isCompleted && styles.setNumTextDone]}>{index + 1}</Text>
      </View>

      {/* Inputs */}
      <View style={styles.setInputs}>
        {/* Previous row */}
        {(set.previousWeight || set.previousReps) && (
          <Text style={styles.prevPerf}>
            Prev: {set.previousWeight || '—'}kg × {set.previousReps || '—'}
          </Text>
        )}
        <View style={styles.inputsRow}>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.setInput, set.isCompleted && styles.setInputDone]}
              keyboardType="numeric"
              placeholder={set.previousWeight || '0'}
              placeholderTextColor="#D1D5DB"
              value={set.weight}
              onChangeText={(v) => onUpdateField('weight', v)}
              editable={!set.isCompleted}
            />
            <Text style={styles.unitLabel}>kg</Text>
          </View>
          <View style={styles.inputSep} />
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.setInput, set.isCompleted && styles.setInputDone]}
              keyboardType="numeric"
              placeholder={set.previousReps || '0'}
              placeholderTextColor="#D1D5DB"
              value={set.reps}
              onChangeText={(v) => onUpdateField('reps', v)}
              editable={!set.isCompleted}
            />
            <Text style={styles.unitLabel}>reps</Text>
          </View>
          <View style={styles.inputSep} />
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.setInput, set.isCompleted && styles.setInputDone]}
              keyboardType="numeric"
              placeholder="—"
              placeholderTextColor="#D1D5DB"
              value={set.rir}
              onChangeText={(v) => onUpdateField('rir', v)}
              editable={!set.isCompleted}
            />
            <Text style={styles.unitLabel}>RIR</Text>
          </View>
        </View>
      </View>

      {/* Check Button */}
      <TouchableOpacity
        style={[styles.checkBtn, set.isCompleted && styles.checkBtnDone]}
        onPress={onToggleComplete}
        activeOpacity={0.7}
      >
        <Feather
          name={set.isCompleted ? 'check' : 'circle'}
          size={20}
          color={set.isCompleted ? 'white' : (isActive ? theme.colors.accent.primary : theme.colors.text.muted)}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActiveWorkoutModal() {
  const router = useRouter();
  const { user } = useUserStore();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const {
    sessionId, workoutName, exercises, activeSetId, activeRestTimer,
    elapsedSeconds, getElapsedFormatted,
    startWorkout, endWorkout, updateSet, updateExerciseNotes,
    toggleSetComplete, addSet, deleteSet, setActiveSet,
    startRestTimer, addRestTime, clearRestTimer,
  } = useWorkoutTrackingStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);

  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Computed values
  const currentEx = exercises[currentExIdx] || null;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const completedSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.isCompleted).length, 0);
  const progressPct = totalSets > 0 ? completedSets / totalSets : 0;

  useEffect(() => {
    if (sessionId) {
      setIsLoading(false);
      return;
    }
    if (user?.id) {
      if (templateId) {
        init(templateId);
      } else {
        fetchTemplates();
      }
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
      console.warn('Error fetching templates:', e);
      Alert.alert('Error', 'Failed to fetch templates.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const init = async (idToUse: string) => {
    setIsLoading(true);
    try {
      const data = await WorkoutService.initializeSessionFromTemplate(user!.id, idToUse);

      // Build ExerciseRecord[] with previous performance injected
      const exRecords: ExerciseRecord[] = data.exercises.map((se: any) => {
        const matchingSets = data.sets
          .filter((s: any) => s.session_exercise_id === se.id)
          .sort((a: any, b: any) => a.set_number - b.set_number);

        const setRecords: SetRecord[] = matchingSets.map((s: any) => {
          // Match previous perf by exercise_id + set_number
          const prev = data.previousPerformance?.find(
            (p: any) => p.exercise_id === se.exercise_id && p.set_number === s.set_number
          );
          return {
            id: s.id,
            setNumber: s.set_number,
            weight: '',
            reps: '',
            rir: '',
            isCompleted: false,
            previousWeight: prev?.weight ? String(prev.weight) : undefined,
            previousReps: prev?.reps ? String(prev.reps) : undefined,
            previousRir: prev?.rir != null ? String(prev.rir) : undefined,
          };
        });

        return {
          id: se.id,
          exerciseId: se.exercise_id,
          name: se.exercises?.name || 'Exercise',
          notes: '',
          sets: setRecords,
          restTimeSeconds: 90,
        };
      });

      startWorkout(data.session.id, user!.id, data.session.name, exRecords);

      // Highlight first set
      if (exRecords.length > 0 && exRecords[0].sets.length > 0) {
        setActiveSet(exRecords[0].sets[0].id);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start session');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishWorkout = async () => {
    setFinishing(true);
    try {
      if (sessionId) {
        const state = useWorkoutTrackingStore.getState();
        const totalVolume = state.exercises.reduce((sum, ex) => {
          return sum + ex.sets.reduce((setSum, set) => {
            return setSum + ((parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0));
          }, 0);
        }, 0);

        await supabase
          .from('workout_sessions')
          .update({
            end_time: new Date().toISOString(),
            status: 'completed',
            volume_load: totalVolume,
          })
          .eq('id', sessionId);
      }
      endWorkout();
      router.replace('/(tabs)/workout');
    } catch (e) {
      console.error('Error finishing workout:', e);
      endWorkout();
      router.replace('/(tabs)/workout');
    } finally {
      setFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Skeleton Header */}
        <View style={styles.header}>
          <View style={[styles.closeBtn, { opacity: 0.3 }]}>
            <Feather name="chevron-down" size={24} color={theme.colors.text.muted} />
          </View>
          <View style={styles.headerCenter}>
            <View style={{ width: 140, height: 16, backgroundColor: '#E5E7EB', borderRadius: 8 }} />
            <View style={{ width: 60, height: 12, backgroundColor: '#F3F4F6', borderRadius: 6, marginTop: 6 }} />
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* Skeleton Progress */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View style={{ width: '100%', height: 4, backgroundColor: '#F3F4F6', borderRadius: 2, overflow: 'hidden' }}>
            <Animated.View 
              entering={FadeIn.duration(800)} 
              style={{ width: '30%', height: 4, backgroundColor: theme.colors.accent.primary + '40', borderRadius: 2 }} 
            />
          </View>
        </View>

        {/* Skeleton Exercise Cards */}
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} removeClippedSubviews={Platform.OS === 'android'}>
          {[0, 1, 2].map((i) => (
            <Animated.View 
              key={i} 
              entering={FadeInDown.delay(i * 120).springify()} 
              style={{ 
                backgroundColor: 'white', 
                borderRadius: 20, 
                padding: 20, 
                marginBottom: 12, 
                ...theme.shadow.soft 
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F3F4F6' }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={{ width: 120, height: 14, backgroundColor: '#E5E7EB', borderRadius: 7 }} />
                  <View style={{ width: 80, height: 10, backgroundColor: '#F3F4F6', borderRadius: 5 }} />
                </View>
              </View>
              {[0, 1, 2].map((j) => (
                <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#F3F4F6' }} />
                  <View style={{ flex: 1, height: 36, backgroundColor: '#F9FAFB', borderRadius: 10 }} />
                  <View style={{ flex: 1, height: 36, backgroundColor: '#F9FAFB', borderRadius: 10 }} />
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6' }} />
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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
            <Feather name="chevron-down" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Select Workout</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.pickerContainer} contentContainerStyle={styles.pickerContent} showsVerticalScrollIndicator={false} removeClippedSubviews={Platform.OS === 'android'}>
          <Text style={styles.pickerIntro}>
            Choose a routine from your split or templates to start tracking.
          </Text>

          {templates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={theme.colors.text.muted} />
              <Text style={styles.emptyText}>No workout templates found.</Text>
              <TouchableOpacity 
                style={styles.emptyBtn} 
                onPress={() => {
                  router.back();
                  router.push('/workout/builder');
                }}
              >
                <Text style={styles.emptyBtnText}>Create a Template</Text>
              </TouchableOpacity>
            </View>
          ) : (
            templates.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={styles.templateCard}
                onPress={() => {
                  setShowTemplatePicker(false);
                  init(tpl.id);
                }}
              >
                <View style={styles.templateIconBox}>
                  <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.colors.accent.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.templateName}>{tpl.name}</Text>
                  <Text style={styles.templateSub}>{tpl.notes ? 'Weekly Split' : 'Template'}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={theme.colors.text.muted} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!currentEx) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <MaterialCommunityIcons name="dumbbell" size={48} color={theme.colors.accent.secondary} />
        <Text style={styles.loadingText}>No exercises found in this workout.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnAlt}>
          <Text style={styles.backBtnAltText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
            <Feather name="chevron-down" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{workoutName}</Text>
            <Text style={styles.headerElapsed}>{getElapsedFormatted()}</Text>
          </View>

          <TouchableOpacity
            style={styles.finishBtn}
            onPress={() => setShowFinishModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* ── Progress Bar ── */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{completedSets}/{totalSets} sets</Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
        >
          {/* ── Exercise Tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.exTabsRow}
            style={{ marginBottom: 20 }}
          >
            {exercises.map((ex, idx) => {
              const done = ex.sets.every(s => s.isCompleted);
              const isActive = idx === currentExIdx;
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[
                    styles.exTab,
                    isActive && styles.exTabActive,
                    done && styles.exTabDone,
                  ]}
                  onPress={() => setCurrentExIdx(idx)}
                  activeOpacity={0.7}
                >
                  {done && <Feather name="check" size={11} color={isActive ? 'white' : '#10B981'} style={{ marginRight: 3 }} />}
                  <Text style={[styles.exTabText, isActive && styles.exTabTextActive]} numberOfLines={1}>
                    {ex.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Current Exercise Card ── */}
          <Animated.View key={currentEx.id} entering={FadeIn.duration(250)} style={styles.exCard}>
            {/* Exercise Header */}
            <View style={styles.exCardHeader}>
              <View style={styles.exCardIconBox}>
                <MaterialCommunityIcons name="dumbbell" size={20} color={theme.colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exName}>{currentEx.name}</Text>
                <Text style={styles.exSubtitle}>{currentEx.sets.length} sets planned</Text>
              </View>
              <View style={styles.exProgressBadge}>
                <Text style={styles.exProgressText}>
                  {currentEx.sets.filter(s => s.isCompleted).length}/{currentEx.sets.length}
                </Text>
              </View>
            </View>

            {/* Column Headers */}
            <View style={styles.colHeaders}>
              <View style={{ width: 36 }} />
              <View style={styles.setInputs}>
                <View style={styles.inputsRow}>
                  <Text style={styles.colHeader}>KG</Text>
                  <View style={styles.inputSep} />
                  <Text style={styles.colHeader}>REPS</Text>
                  <View style={styles.inputSep} />
                  <Text style={styles.colHeader}>RIR</Text>
                </View>
              </View>
              <View style={{ width: 44 }} />
            </View>

            {/* Sets */}
            {currentEx.sets.map((set, idx) => (
              <SetCard
                key={set.id}
                set={set}
                index={idx}
                isActive={activeSetId === set.id}
                onUpdateField={(field, value) => updateSet(currentEx.id, set.id, field, value)}
                onToggleComplete={() => toggleSetComplete(currentEx.id, set.id)}
              />
            ))}

            {/* Add Set */}
            <TouchableOpacity
              style={styles.addSetBtn}
              onPress={() => addSet(currentEx.id)}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={15} color={theme.colors.accent.primary} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>

            {/* Exercise Notes */}
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes (e.g. felt strong, increase weight next time)"
              placeholderTextColor={theme.colors.text.muted}
              value={currentEx.notes}
              onChangeText={(v) => updateExerciseNotes(currentEx.id, v)}
              multiline
            />
          </Animated.View>

          {/* ── Navigation Buttons ── */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, currentExIdx === 0 && styles.navBtnDisabled]}
              onPress={() => setCurrentExIdx(p => Math.max(0, p - 1))}
              disabled={currentExIdx === 0}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={18} color={currentExIdx === 0 ? theme.colors.text.muted : theme.colors.text.primary} />
              <Text style={[styles.navBtnText, currentExIdx === 0 && { color: theme.colors.text.muted }]}>Prev</Text>
            </TouchableOpacity>

            {currentExIdx < exercises.length - 1 ? (
              <TouchableOpacity
                style={styles.nextExBtn}
                onPress={() => setCurrentExIdx(p => p + 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.nextExBtnText}>Next Exercise</Text>
                <Feather name="chevron-right" size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextExBtn, { backgroundColor: '#10B981' }]}
                onPress={() => setShowFinishModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.nextExBtnText}>Finish Workout 🎉</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* ── Rest Timer Overlay ── */}
        {activeRestTimer !== null && activeRestTimer > 0 && (
          <RestTimerOverlay
            seconds={activeRestTimer}
            onSkip={clearRestTimer}
            onAdd30={() => addRestTime(30)}
          />
        )}
      </KeyboardAvoidingView>

      {/* ── Finish Modal ── */}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg.primary },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: theme.colors.bg.primary,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  backBtnAlt: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 14,
  },
  backBtnAltText: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    gap: 8,
    ...theme.shadow.soft,
  },
  closeBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  headerElapsed: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  finishBtn: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  finishBtnText: {
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  // Progress bar
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
    gap: 10,
  },
  progressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#EDE9FE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
    minWidth: 50,
    textAlign: 'right',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Exercise tabs
  exTabsRow: {
    paddingHorizontal: 0,
    gap: 8,
    paddingBottom: 4,
  },
  exTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    ...theme.shadow.soft,
    maxWidth: 160,
  },
  exTabActive: {
    backgroundColor: theme.colors.accent.primary,
  },
  exTabDone: {
    backgroundColor: '#D1FAE5',
  },
  exTabText: {
    fontSize: 12,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.secondary,
  },
  exTabTextActive: {
    color: 'white',
  },

  // Exercise card
  exCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    ...theme.shadow.card,
    marginBottom: 16,
  },
  exCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  exCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exName: {
    fontSize: 18,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  exSubtitle: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  exProgressBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  exProgressText: {
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
  },

  // Column headers
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  colHeader: {
    flex: 1,
    fontSize: 10,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Set card
  setCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  setCardDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  setCardActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: '#FAF5FF',
  },
  setNumBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumBoxDone: {
    backgroundColor: '#10B981',
  },
  setNumText: {
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  setNumTextDone: {
    color: 'white',
  },
  setInputs: {
    flex: 1,
  },
  prevPerf: {
    fontSize: 10,
    fontFamily: theme.font.family.medium,
    color: theme.colors.accent.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  inputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 3,
  },
  inputSep: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  setInput: {
    fontSize: 18,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    minWidth: 36,
    textAlign: 'center',
    padding: 0,
  },
  setInputDone: {
    color: '#10B981',
  },
  unitLabel: {
    fontSize: 10,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  checkBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },

  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    borderStyle: 'dashed',
    borderRadius: 14,
    marginBottom: 12,
  },
  addSetText: {
    fontSize: 13,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.accent.primary,
  },

  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.primary,
    minHeight: 48,
    textAlignVertical: 'top',
  },

  // Nav row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 14,
    ...theme.shadow.soft,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: {
    fontSize: 14,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.primary,
  },
  nextExBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 16,
    ...theme.shadow.premium,
  },
  nextExBtnText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  // Rest overlay
  restOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 24,
    ...theme.shadow.premium,
    borderWidth: 2,
    borderColor: theme.colors.accent.primary,
  },
  restContent: { alignItems: 'center', gap: 16 },
  restHeading: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
    letterSpacing: 2,
  },
  restCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restCircleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  restTimerText: {
    fontSize: 26,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
  },
  restTimerLabel: {
    fontSize: 9,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  restBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
  },
  addTimeBtnText: {
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 14,
  },
  skipBtnText: {
    fontSize: 13,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  pickerContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  pickerContent: {
    paddingBottom: 40,
    gap: 16,
  },
  pickerIntro: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    lineHeight: 20,
    marginBottom: 8,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...theme.shadow.soft,
  },
  templateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.accent.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  templateName: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
  },
  templateSub: {
    fontSize: 12,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  emptyBtn: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyBtnText: {
    color: 'white',
    fontSize: 14,
    fontFamily: theme.font.family.bold,
  },
});
