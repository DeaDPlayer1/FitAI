import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import WorkoutFlowCard from '@/components/training/WorkoutFlowCard';
import { fetchAllWorkoutData, type ExercisePerformanceData } from '@/lib/workoutDataService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseDayFromTemplate(template: any): string | null {
  try {
    if (template.notes) {
      const parsed = JSON.parse(template.notes);
      if (parsed.source === 'weekly_split' && parsed.day) return parsed.day;
    }
  } catch {}
  for (const day of DAYS) {
    if (template.name?.startsWith(`${day}:`)) return day;
  }
  return null;
}

function parseWorkoutName(template: any): string {
  try {
    if (template.notes) {
      const parsed = JSON.parse(template.notes);
      if (parsed.workoutName) return parsed.workoutName;
    }
  } catch {}
  for (const day of DAYS) {
    if (template.name?.startsWith(`${day}:`)) return template.name.replace(`${day}: `, '').trim();
  }
  return template.name || 'Workout';
}

function parseMuscles(template: any): string[] {
  try {
    if (template.notes) {
      const parsed = JSON.parse(template.notes);
      if (parsed.targetMuscles) return parsed.targetMuscles;
    }
  } catch {}
  const name = (template.name || '').toLowerCase();
  const known = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'abs', 'core', 'glutes', 'full body'];
  return known.filter(m => name.includes(m));
}

function getTodayName(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}

export default function TrainingScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();
  const [templates, setTemplates] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [performanceMap, setPerformanceMap] = useState<Map<string, ExercisePerformanceData>>(new Map());

  useEffect(() => {
    if (user?.id) fetchTemplates();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id && templates.length > 0) {
        fetchExerciseData(templates);
      }
    }, [user?.id, templates])
  );

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select(`
          id, name, notes, created_at,
          workout_sections (
            id, name, order_index,
            workout_template_exercises (
              id, exercise_id, order_index,
              target_sets, target_reps_min, target_reps_max, rest_time_seconds,
              exercises ( id, name, target_muscle_group )
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
      fetchExerciseData(data || []);
    } catch (e) {
      console.error('Error fetching templates:', e);
    } finally { setRefreshing(false); setIsLoading(false); }
  };

  const fetchExerciseData = async (tmpls: any[]) => {
    const names = new Set<string>();
    for (const t of tmpls) {
      for (const s of t.workout_sections || []) {
        for (const te of s.workout_template_exercises || []) {
          if (te.exercises?.name) names.add(te.exercises.name);
        }
      }
    }
    if (names.size === 0) return;
    const map = await fetchAllWorkoutData(Array.from(names));
    setPerformanceMap(map);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (user?.id) fetchTemplates();
  }, [user?.id]);

  const today = getTodayName();

  const dayMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of templates) {
      const day = parseDayFromTemplate(t);
      if (day) map[day] = t;
    }
    return map;
  }, [templates]);

  const getExercises = (template: any): { name: string; sets: number; reps: string }[] => {
    const result: { name: string; sets: number; reps: string }[] = [];
    for (const section of template.workout_sections || []) {
      for (const te of section.workout_template_exercises || []) {
        const name = te.exercises?.name;
        if (name) {
          const sets = te.target_sets || 3;
          const mn = te.target_reps_min || 8;
          const mx = te.target_reps_max || 12;
          result.push({ name, sets, reps: mn === mx ? `${mn}` : `${mn}-${mx}` });
        }
      }
    }
    return result;
  };

  const handleStartDay = (day: string) => {
    const tpl = dayMap[day];
    if (tpl) {
      router.push({ pathname: '/modals/active-workout', params: { templateId: tpl.id } });
    }
  };

  const completedDays = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const [day, tpl] of Object.entries(dayMap)) {
      if (!tpl) { map[day] = false; continue; }
      const exs = getExercises(tpl);
      let completed = 0;
      let planned = 0;
      for (const ex of exs) {
        const p = performanceMap.get(ex.name);
        if (p) completed += p.totalCompletedSets;
        planned += ex.sets;
      }
      map[day] = planned > 0 && completed >= planned;
    }
    return map;
  }, [dayMap, performanceMap]);

  const allLoaded = templates.length > 0;

  // ── Sticky CTA ──
  const todayTemplate = dayMap[today];
  const isTodayExpanded = expandedDay === today;
  const todayExercises = todayTemplate ? getExercises(todayTemplate) : [];
  const todayTotalSets = todayExercises.reduce((s, e) => s + e.sets, 0);
  const showCTA = allLoaded && todayTemplate && isTodayExpanded;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={st.safe} edges={['top']}>
        <ScrollView
          style={st.scroll}
          contentContainerStyle={[st.scrollContent, showCTA && { paddingBottom: 80 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6A49FA" progressViewOffset={100} />
          }
        >
          {/* ── Header ── */}
          <View style={st.header}>
            <View>
              <Text style={st.title}>Training</Text>
              <Text style={st.subtitle}>
                {allLoaded ? `${Object.keys(dayMap).length} days this week` : 'Set up your split'}
              </Text>
            </View>
            {allLoaded && (
              <TouchableOpacity style={st.editBtn} onPress={() => router.push('/workout/builder')} activeOpacity={0.8}>
                <Feather name="edit-3" size={17} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Weekly Plan ── */}
          <View style={st.planSection}>
            {DAYS.map((day, i) => {
              const template = dayMap[day];
              const isDayToday = day === today;
              const exercises = template ? getExercises(template) : [];
              const muscles = template ? parseMuscles(template) : [];
              return (
                <View key={day}>
                  {i > 0 && <View style={st.divider} />}
                  <WorkoutFlowCard
                    dayLabel={day}
                    workoutName={template ? parseWorkoutName(template) : undefined}
                    exerciseCount={exercises.length}
                    isToday={isDayToday}
                    isCompleted={completedDays[day] || false}
                    isRest={!template}
                    expanded={expandedDay === day}
                    onToggle={() => setExpandedDay(prev => prev === day ? null : day)}
                    onStart={isDayToday && template ? () => handleStartDay(day) : undefined}
                    muscles={muscles}
                    exercises={exercises}
                    aiNote={template ? 'Optimised for your recovery state' : undefined}
                    index={i}
                    performanceMap={performanceMap}
                  />
                </View>
              );
            })}
          </View>

          {/* ── Loading Skeleton ── */}
          {isLoading && (
            <Animated.View entering={FadeIn} style={st.emptyState}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ width: '100%', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.border.subtle }} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={{ width: '60%', height: 14, borderRadius: 7, backgroundColor: theme.colors.border.subtle }} />
                      <View style={{ width: '30%', height: 10, borderRadius: 5, backgroundColor: theme.colors.border.subtle }} />
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* ── Empty State ── */}
          {!isLoading && !allLoaded && (
            <Animated.View entering={FadeIn} style={st.emptyState}>
              <View style={st.emptyIconBox}>
                <Feather name="calendar" size={36} color="rgba(106,73,250,0.3)" />
              </View>
              <Text style={st.emptyTitle}>No Training Plan Yet</Text>
              <Text style={st.emptySubtitle}>Build your weekly split to get started.</Text>
              <TouchableOpacity style={st.emptyBtn} onPress={() => router.push('/workout/builder')} activeOpacity={0.8}>
                <Text style={st.emptyBtnText}>Build My Split</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── Floating Sticky CTA ── */}
      {showCTA && (
        <Animated.View entering={FadeInUp.duration(300)} style={[st.stickyCta, { paddingBottom: insets.bottom + 8 }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,1)']}
            style={st.stickyInner}
          >
            <View style={st.stickySummary}>
              <Text style={st.stickyExCount}>{todayExercises.length} exercises</Text>
              <View style={st.stickyDot} />
              <Text style={st.stickySets}>{todayTotalSets} sets</Text>
            </View>
            <TouchableOpacity
              style={st.stickyBtn}
              onPress={() => handleStartDay(today)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#6A49FA', '#5A3DE0']} style={st.stickyBtnGrad}>
                <Feather name="play" size={15} color="#FFFFFF" />
                <Text style={st.stickyBtnText}>Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg.primary },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
  },
  title: {
    fontSize: 26, fontWeight: '800', color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13, fontWeight: '500', color: theme.colors.text.secondary,
    marginTop: 1,
  },
  editBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  planSection: { paddingHorizontal: 14, gap: 6 },
  divider: { height: 1, backgroundColor: theme.colors.border.subtle, marginVertical: 3, marginLeft: 46 },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyIconBox: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(106,73,250,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, textAlign: 'center' },
  emptySubtitle: {
    fontSize: 14, fontWeight: '500', color: theme.colors.text.secondary,
    textAlign: 'center', lineHeight: 21,
  },
  emptyBtn: {
    backgroundColor: theme.colors.primary, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 16, marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // ── Sticky CTA ──
  stickyCta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingTop: 8,
  },
  stickyInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#6A49FA', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
    borderWidth: 1, borderColor: 'rgba(106,73,250,0.1)',
  },
  stickySummary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  stickyExCount: {
    fontSize: 13, fontWeight: '600', color: theme.colors.text.primary,
  },
  stickyDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: theme.colors.text.disabled,
  },
  stickySets: {
    fontSize: 13, fontWeight: '600', color: theme.colors.text.primary,
  },
  stickyBtn: { borderRadius: 14, overflow: 'hidden' },
  stickyBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 14,
  },
  stickyBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
