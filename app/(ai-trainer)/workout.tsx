import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  FlatList, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAiTrainerStore, type ActivePlan, type WorkoutExercise, type WorkoutDay } from '@/store/aiTrainerStore';
import { useWorkoutTrackingStore, type ExerciseRecord, type SetRecord } from '@/store/workoutTrackingStore';
import ExerciseCard from '@/components/workout/ExerciseCard';
import ExerciseSwapModal from '@/components/workout/ExerciseSwapModal';
import RestTimerOverlay from '@/components/workout/RestTimerOverlay';
import {
  generateWorkoutOpening, generateSetCoaching, generateExerciseIntro,
  generateMidWorkoutMessage, generatePostWorkoutOpening, generatePostWorkoutAnalysis,
  generateCardioReminder,
} from '@/lib/aiWorkoutCoach';
import { saveExerciseFeedback } from '@/lib/memoryService';

const { width: SCREEN_W } = Dimensions.get('window');

function generateId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildExercisesFromPlan(day: WorkoutDay): ExerciseRecord[] {
  return day.exercises.map((ex, ei) => {
    const sets: SetRecord[] = Array.from({ length: ex.sets }, (_, si) => ({
      id: `${generateId()}_s${si}`,
      setNumber: si + 1,
      weight: '',
      reps: ex.reps.includes('-') ? '' : ex.reps,
      rir: ex.rir != null ? String(ex.rir) : '',
      isCompleted: false,
    }));
    return {
      id: `${generateId()}_ex${ei}`,
      exerciseId: `plan_${ei}`,
      name: ex.name,
      notes: ex.aiNote || '',
      sets,
      restTimeSeconds: ex.restSeconds || 90,
    };
  });
}

type ScreenPhase = 'intro' | 'active' | 'cooldown' | 'post';

export default function AiWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayIndex?: string }>();
  const activePlan = useAiTrainerStore(s => s.activePlan);
  const hydrate = useAiTrainerStore(s => s.hydrateFromCache);
  const {
    workoutName, exercises, startWorkout, endWorkout,
  } = useWorkoutTrackingStore();

  const [phase, setPhase] = useState<ScreenPhase>('intro');
  const [introMessage, setIntroMessage] = useState('');
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [completedSetCount, setCompletedSetCount] = useState(0);
  const [elapsedMin, setElapsedMin] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [swapTarget, setSwapTarget] = useState<ExerciseRecord | null>(null);

  const removeExercise = useWorkoutTrackingStore(s => s.removeExercise);

  useEffect(() => {
    if (!activePlan && !hydrated) {
      hydrate()
        .catch(() => {})
        .finally(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, [activePlan, hydrated, hydrate]);

  const dayIndex = useMemo(() => {
    if (params.dayIndex) return parseInt(params.dayIndex, 10);
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  }, [params.dayIndex]);

  const planDay = useMemo(() => {
    if (!activePlan?.workoutDays || activePlan.workoutDays.length === 0) return null;
    return activePlan.workoutDays[dayIndex] || null;
  }, [activePlan, dayIndex]);

  const totalSets = useMemo(() => {
    return exercises.reduce((s, e) => s + e.sets.length, 0);
  }, [exercises]);

  const completedSets = useMemo(() => {
    return exercises.flatMap(e => e.sets).filter(s => s.isCompleted).length;
  }, [exercises]);

  // Initialize workout
  useEffect(() => {
    if (!planDay || planDay.isRest) return;
    if (planDay.exercises.length === 0) return;
    if (exercises.length > 0 && exercises[0]?.name) return;

    const built = buildExercisesFromPlan(planDay);
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        startWorkout(`session_${generateId()}`, user?.id || 'ai_user', planDay.focus || 'Workout', built);
      } catch (e) {
        console.error('[workout] start failed', e);
      }
    })();
  }, [planDay?.dayName, planDay?.exercises?.length, hydrated]);

  // Generate intro message
  useEffect(() => {
    if (!activePlan || !planDay) return;
    const msg = generateWorkoutOpening(activePlan, dayIndex);
    const cardioNote = generateCardioReminder(planDay);
    setIntroMessage(msg + (cardioNote ? `\n\n${cardioNote}` : ''));
  }, [activePlan, planDay, dayIndex]);

  // Track completion and generate coaching
  useEffect(() => {
    if (completedSets === 0 || phase !== 'active') return;
    if (completedSets > completedSetCount) {
      setCompletedSetCount(completedSets);

      if (completedSets === totalSets) {
        setCoachMessage('All sets done! Great work. Finish up and I\'ll give you a summary.');
        return;
      }

      // Find the last completed exercise/set for coaching
      for (const ex of exercises) {
        const lastCompleted = [...ex.sets].reverse().find(s => s.isCompleted);
        if (lastCompleted) {
          const planEx = planDay?.exercises.find(pe => pe.name === ex.name);
          if (planEx) {
            const isLast = ex.sets.every(s => s.isCompleted);
            const coaching = generateSetCoaching(planEx, lastCompleted.setNumber, ex.sets.length, isLast);
            if (coaching) {
              setCoachMessage(coaching);
              return;
            }
          }
        }
      }

      const midMsg = generateMidWorkoutMessage(completedSets, totalSets);
      setCoachMessage(midMsg);
    }
  }, [completedSets, totalSets, phase, exercises, planDay, completedSetCount]);

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMin(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Post-workout analysis
  const postAnalysis = useMemo(() => {
    if (phase !== 'post' || !activePlan) return null;
    return generatePostWorkoutAnalysis(exercises, activePlan, elapsedMin || 1);
  }, [phase, exercises, activePlan, elapsedMin]);

  const handleBegin = useCallback(() => {
    setPhase('active');
    setCoachMessage('Let\'s warm up and find your working weight. First set of each exercise is a feeler.');
  }, []);

  const handleFinish = useCallback(() => {
    setPhase('post');
  }, []);

  const handleReplay = useCallback(() => {
    endWorkout();
    router.back();
  }, [endWorkout, router]);

  // Rest day fallback
  if (!hydrated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Feather name="loader" size={48} color="#7A7A7A" />
          <Text style={styles.emptyTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activePlan || !planDay) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Feather name="alert-circle" size={48} color="#7A7A7A" />
          <Text style={styles.emptyTitle}>No workout today</Text>
          <Text style={styles.emptySub}>Activate a plan and pick a training day to start.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (planDay.isRest) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <Feather name="moon" size={48} color="#7A7A7A" />
          <Text style={styles.emptyTitle}>Rest Day</Text>
          <Text style={styles.emptySub}>{planDay.aiNote || 'Focus on recovery, sleep, and nutrition today.'}</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Intro phase
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={['#0f0a1a', '#1a0f2e', '#0A0A0A']} style={styles.introRoot}>
          <View style={styles.introBadge}>
            <Feather name="zap" size={14} color="#C8FF00" />
            <Text style={styles.introBadgeText}>AI COACHED SESSION</Text>
          </View>
          <Text style={styles.introTitle}>{planDay.focus}</Text>
          <Text style={styles.introSub}>{activePlan.goal} · Week {activePlan.currentWeek}</Text>
          <View style={styles.introDivider} />

          <View style={styles.introMsgWrap}>
            <View style={styles.introCoachDot} />
            <Text style={styles.introMsg}>{introMessage}</Text>
          </View>

          <View style={styles.introMeta}>
            <MetaChip icon="list" label={`${planDay.exercises.length} exercises`} />
            <MetaChip icon="layers" label={`${planDay.exercises.reduce((s, e) => s + e.sets, 0)} sets`} />
            {planDay.cardioMinutes ? <MetaChip icon="heart" label={`${planDay.cardioMinutes}min cardio`} /> : null}
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleBegin} activeOpacity={0.8}>
            <Text style={styles.startBtnText}>Begin Workout</Text>
            <Feather name="play" size={20} color="#0A0A0A" />
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Post-workout phase
  if (phase === 'post') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.postContent} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#C8FF00', '#A0E000']} style={styles.postHero}>
            <Feather name="check-circle" size={32} color="#0A0A0A" />
            <Text style={styles.postHeroTitle}>Workout Complete</Text>
            <Text style={styles.postHeroSub}>
              {planDay.focus} · {elapsedMin} min
            </Text>
          </LinearGradient>

          {postAnalysis && (
            <>
              <View style={styles.postSummaryCard}>
                <Text style={styles.postSummaryTitle}>{postAnalysis.summary}</Text>
                {postAnalysis.highlights.length > 0 && (
                  <>
                    <Text style={styles.postSectionLabel}>Highlights</Text>
                    {postAnalysis.highlights.map((h, i) => (
                      <View key={i} style={styles.postHighlightRow}>
                        <Feather name="trending-up" size={12} color="#C8FF00" />
                        <Text style={styles.postHighlightText}>{h}</Text>
                      </View>
                    ))}
                  </>
                )}
                <Text style={styles.postSectionLabel}>Analysis</Text>
                <Text style={styles.postAnalysisText}>{postAnalysis.analysis}</Text>
              </View>

              <View style={styles.postCoachCard}>
                <View style={styles.postCoachDot} />
                <Text style={styles.postCoachText}>{generatePostWorkoutOpening()}</Text>
              </View>

              <View style={styles.postChips}>
                {['Felt strong', 'Normal session', 'Low energy', 'Joint pain', 'Amazing pump'].map(chip => (
                  <TouchableOpacity key={chip} style={styles.postChip} activeOpacity={0.7}>
                    <Text style={styles.postChipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.postInput}
                placeholder="Tell me how that felt..."
                placeholderTextColor="#7A7A7A"
                multiline
              />

              <View style={styles.postActions}>
                <TouchableOpacity style={styles.postActionBtn} onPress={handleReplay} activeOpacity={0.8}>
                  <Feather name="arrow-left" size={16} color="#F5F5F5" />
                  <Text style={styles.postActionText}>Back to Coach</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postActionPrimary} onPress={() => router.push('/(ai-trainer)/train')} activeOpacity={0.8}>
                  <Text style={styles.postActionPrimaryText}>View Plan</Text>
                  <Feather name="arrow-right" size={16} color="#0A0A0A" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Active workout phase
  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Feather name="x" size={22} color="#F5F5F5" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{workoutName || planDay.focus}</Text>
            <Text style={styles.headerTimer}>{elapsedMin}:00</Text>
          </View>
          <TouchableOpacity onPress={handleFinish} style={styles.finishBtn}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {exercises.length === 0 && (
              <View style={styles.emptyExWrap}>
                <Feather name="alert-circle" size={32} color="#7A7A7A" />
                <Text style={styles.emptyExTitle}>No exercises in this day</Text>
                <Text style={styles.emptyExSub}>
                  The plan for this day is empty. Pick a training day that has exercises.
                </Text>
                <TouchableOpacity style={styles.emptyExBtn} onPress={() => router.back()}>
                  <Text style={styles.emptyExBtnText}>Back to Plan</Text>
                </TouchableOpacity>
              </View>
            )}
            {exercises.map((ex, i) => (
              <View key={ex.id}>
                <Animated.View entering={FadeInDown.duration(300).delay(i * 80)}>
                  <ExerciseCard
                    exercise={ex}
                    onEdit={() => {
                      setSwapTarget(ex);
                      setSwapModalVisible(true);
                    }}
                  />
                </Animated.View>
              </View>
            ))}
          </ScrollView>

          {coachMessage && (
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.coachBar}>
              <View style={styles.coachBarDot} />
              <Text style={styles.coachBarText}>{coachMessage}</Text>
            </Animated.View>
          )}
        </KeyboardAvoidingView>

        <RestTimerOverlay />
      </SafeAreaView>

      <ExerciseSwapModal
        visible={swapModalVisible}
        exercise={swapTarget}
        onClose={() => {
          setSwapModalVisible(false);
          setSwapTarget(null);
        }}
        onDelete={() => {
          if (swapTarget) removeExercise(swapTarget.id);
        }}
        onFeedbackSubmit={async (exerciseName, feedbackText) => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await saveExerciseFeedback(user.id, exerciseName, feedbackText);
            }
          } catch (e) {
            console.warn('[feedback] save failed', e);
          }
        }}
      />
    </Animated.View>
  );
}

function MetaChip({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Feather name={icon as any} size={12} color="#A78BFA" />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },

  // Empty / Rest
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#F5F5F5' },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: '#C8FF00', marginTop: 8 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },

  // Intro
  introRoot: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center', gap: 16 },
  introBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(200,255,0,0.1)',
  },
  introBadgeText: { fontSize: 11, color: '#C8FF00', fontWeight: '700', letterSpacing: 1 },
  introTitle: { fontSize: 32, fontWeight: '800', color: '#F5F5F5', textAlign: 'center' },
  introSub: { fontSize: 14, color: '#A78BFA' },
  introDivider: { width: 40, height: 2, backgroundColor: 'rgba(200,255,0,0.3)', borderRadius: 1, marginVertical: 4 },
  introMsgWrap: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#141414', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#1F1F1F', width: '100%',
  },
  introCoachDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', marginTop: 4 },
  introMsg: { fontSize: 14, color: '#C4B5FD', flex: 1, lineHeight: 20 },
  introMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    backgroundColor: 'rgba(167,139,250,0.1)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.15)',
  },
  metaChipText: { fontSize: 11, color: '#A78BFA', fontWeight: '600' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16,
    backgroundColor: '#C8FF00', marginTop: 8,
  },
  startBtnText: { fontSize: 17, fontWeight: '700', color: '#0A0A0A' },

  // Active
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1F1F1F',
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#141414', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#F5F5F5' },
  headerTimer: { fontSize: 12, color: '#7A7A7A', marginTop: 2 },
  finishBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.15)' },
  finishBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 80 },

  // Coaching bar
  coachBar: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderTopWidth: 1, borderTopColor: 'rgba(139,92,246,0.15)',
  },
  coachBarDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6', marginTop: 4 },
  coachBarText: { fontSize: 13, color: '#C4B5FD', flex: 1, lineHeight: 18 },

  // Post-workout
  postContent: { paddingBottom: 40 },
  postHero: { padding: 32, alignItems: 'center', gap: 8 },
  postHeroTitle: { fontSize: 24, fontWeight: '800', color: '#0A0A0A' },
  postHeroSub: { fontSize: 13, color: 'rgba(0,0,0,0.5)' },
  postSummaryCard: { padding: 20, margin: 16, borderRadius: 20, backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F', gap: 8 },
  postSummaryTitle: { fontSize: 18, fontWeight: '700', color: '#C8FF00' },
  postSectionLabel: { fontSize: 11, color: '#7A7A7A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  postHighlightRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postHighlightText: { fontSize: 13, color: '#F5F5F5', flex: 1 },
  postAnalysisText: { fontSize: 13, color: '#9CA3AF', lineHeight: 18 },
  postCoachCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 16, padding: 16, borderRadius: 16,
    backgroundColor: '#141414', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  postCoachDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', marginTop: 4 },
  postCoachText: { fontSize: 14, color: '#C4B5FD', flex: 1, lineHeight: 20 },
  postChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  postChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#2A2A2A',
  },
  postChipText: { fontSize: 13, color: '#F5F5F5' },
  postInput: {
    margin: 16, padding: 14, borderRadius: 14,
    backgroundColor: '#141414', borderWidth: 1, borderColor: '#1F1F1F',
    fontSize: 14, color: '#F5F5F5', minHeight: 48,
  },
  postActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 4 },
  postActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14, backgroundColor: '#1F1F1F',
  },
  postActionText: { fontSize: 14, fontWeight: '600', color: '#F5F5F5' },
  postActionPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14, backgroundColor: '#C8FF00',
  },
  postActionPrimaryText: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },

  emptyExWrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, marginTop: 40 },
  emptyExTitle: { fontSize: 18, fontWeight: '700', color: '#F5F5F5', marginTop: 8 },
  emptyExSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },
  emptyExBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#C8FF00', marginTop: 8 },
  emptyExBtnText: { fontSize: 14, fontWeight: '700', color: '#0A0A0A' },
});
