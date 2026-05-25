import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Modal, Alert, ActivityIndicator,
  Dimensions, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';

const { width } = Dimensions.get('window');
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function parseWorkoutNameFromTemplate(template: any): string {
  try {
    if (template.notes) {
      const parsed = JSON.parse(template.notes);
      if (parsed.workoutName) return parsed.workoutName;
    }
  } catch {}
  for (const day of DAYS) {
    if (template.name?.startsWith(`${day}:`)) {
      return template.name.replace(`${day}: `, '').trim();
    }
  }
  return template.name || 'Workout';
}

function getTodayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────

function DeleteModal({
  visible, onCancel, onConfirm, workoutName, loading
}: {
  visible: boolean; onCancel: () => void; onConfirm: () => void;
  workoutName: string; loading: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeInDown.springify()} style={styles.deleteModal}>
          <View style={styles.deleteIconBox}>
            <Feather name="trash-2" size={28} color="#EF4444" />
          </View>
          <Text style={styles.deleteTitle}>Delete Workout?</Text>
          <Text style={styles.deleteSubtitle}>
            <Text style={{ fontFamily: theme.font.family.bold, color: theme.colors.text.primary }}>
              "{workoutName}"
            </Text>
            {' '}will be permanently removed. This cannot be undone.
          </Text>
          <View style={styles.deleteActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmDeleteBtn}
              onPress={onConfirm}
              activeOpacity={0.7}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={styles.confirmDeleteText}>Delete</Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Progress / Analytics Tab ────────────────────────────────────────────────

function ProgressTab({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const { count: totalSessions } = await supabase
        .from('workout_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalSets } = await supabase
        .from('workout_session_sets')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', true);

      setRecentSessions(sessions || []);
      setStats({ totalSessions: totalSessions || 0, totalSets: totalSets || 0 });
    } catch (e) {
      console.error('Error loading stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.progressLoading}>
        <ActivityIndicator color={theme.colors.accent.primary} />
      </View>
    );
  }

  const today = getTodayName();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Animated.View entering={FadeInDown.delay(0)} style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#EDE9FE' }]}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={theme.colors.accent.primary} />
          </View>
          <Text style={styles.statValue}>{stats?.totalSessions ?? 0}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80)} style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#D1FAE5' }]}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{stats?.totalSets ?? 0}</Text>
          <Text style={styles.statLabel}>Sets Completed</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160)} style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="fire" size={22} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{Math.min(7, stats?.totalSessions ?? 0)}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </Animated.View>
      </View>

      {/* Weekly Bar Chart (simplified) */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.weeklyChart}>
        <Text style={styles.chartTitle}>This Week</Text>
        <View style={styles.barsRow}>
          {DAYS.map((day, i) => {
            const isToday = day === today;
            const hasSession = recentSessions.some(s => {
              const d = new Date(s.created_at);
              return d.getDay() === (i + 1) % 7;
            });
            const barHeight = hasSession ? 48 + Math.random() * 24 : 12;
            return (
              <View key={day} style={styles.barGroup}>
                <View style={[
                  styles.bar,
                  { height: barHeight },
                  hasSession && styles.barActive,
                  isToday && styles.barToday,
                ]} />
                <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                  {day.slice(0, 1)}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* Recent Sessions */}
      <Text style={styles.sectionHeader}>Recent Sessions</Text>
      {recentSessions.length === 0 ? (
        <View style={styles.emptyProgress}>
          <MaterialCommunityIcons name="dumbbell" size={40} color={theme.colors.accent.secondary} />
          <Text style={styles.emptyProgressText}>No sessions yet. Start your first workout!</Text>
        </View>
      ) : (
        recentSessions.map((session, idx) => {
          const date = new Date(session.created_at);
          const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <Animated.View
              key={session.id}
              entering={FadeInDown.delay(idx * 60)}
              style={styles.sessionCard}
            >
              <View style={styles.sessionIconBox}>
                <MaterialCommunityIcons name="dumbbell" size={18} color={theme.colors.accent.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionName} numberOfLines={1}>{session.name}</Text>
                <Text style={styles.sessionDate}>{dateStr}</Text>
              </View>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionBadgeText}>Done</Text>
              </View>
            </Animated.View>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const router = useRouter();
  const { user } = useUserStore();
  const [templates, setTemplates] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'progress'>('schedule');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.id) fetchTemplates();
  }, [user?.id]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('id, name, notes, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTemplates(data || []);
    } catch (e) {
      console.error('Error fetching templates:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchTemplates(); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('workout_templates')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // Build day-to-template map
  const dayMap: Record<string, any> = {};
  for (const t of templates) {
    const day = parseDayFromTemplate(t);
    if (day) dayMap[day] = t;
  }

  // Loose templates (not tied to any day)
  const looseTemplates = templates.filter(t => !parseDayFromTemplate(t));

  const today = getTodayName();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Training</Text>
          <Text style={styles.subtitle}>
            {today} · {templates.length} {templates.length === 1 ? 'workout' : 'workouts'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={() => router.push('/workout/builder')}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('schedule')}
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          activeOpacity={0.7}
        >
          <Feather name="calendar" size={14} color={activeTab === 'schedule' ? theme.colors.accent.primary : theme.colors.text.muted} />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('progress')}
          style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chart-line" size={14} color={activeTab === 'progress' ? theme.colors.accent.primary : theme.colors.text.muted} />
          <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>Progress</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'schedule' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent.primary}
            />
          }
        >
          {/* Edit Split Button */}
          <TouchableOpacity
            style={styles.editSplitBtn}
            onPress={() => router.push('/workout/builder')}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={16} color="white" />
            <Text style={styles.editSplitBtnText}>Edit Split</Text>
          </TouchableOpacity>

          {/* 7-Day Timeline */}
          <View style={styles.timeline}>
            {DAYS.map((day, idx) => {
              const template = dayMap[day];
              const isToday = day === today;
              const workoutName = template ? parseWorkoutNameFromTemplate(template) : null;

              if (!template) {
                return (
                  <Animated.View
                    key={day}
                    entering={FadeInDown.delay(idx * 40).springify()}
                    style={[styles.dayRow, isToday && styles.dayRowToday]}
                  >
                    <View style={styles.dayLabelCol}>
                      <Text style={[styles.dayAbbr, isToday && styles.dayAbbrToday]}>
                        {day.slice(0, 3).toUpperCase()}
                      </Text>
                      {isToday && <View style={styles.todayDot} />}
                    </View>
                    <View style={styles.restCard}>
                      <View style={styles.restIconBox}>
                        <MaterialCommunityIcons name="sleep" size={16} color={theme.colors.text.muted} />
                      </View>
                      <Text style={styles.restLabel}>Rest & Recovery</Text>
                    </View>
                  </Animated.View>
                );
              }

              return (
                <Animated.View
                  key={day}
                  entering={FadeInDown.delay(idx * 40).springify()}
                  style={[styles.dayRow, isToday && styles.dayRowToday]}
                >
                  {/* Day Label */}
                  <View style={styles.dayLabelCol}>
                    <Text style={[styles.dayAbbr, isToday && styles.dayAbbrToday]}>
                      {day.slice(0, 3).toUpperCase()}
                    </Text>
                    {isToday && <View style={styles.todayDot} />}
                  </View>

                  {/* Workout Card */}
                  <View style={[styles.workoutCard, isToday && styles.workoutCardToday]}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardIconBox}>
                        <MaterialCommunityIcons name="dumbbell" size={18} color={theme.colors.accent.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{workoutName}</Text>
                        <Text style={styles.cardDayLabel}>{day}</Text>
                      </View>
                      {isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>TODAY</Text>
                        </View>
                      )}
                    </View>

                    {isToday && (
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.startBtn}
                          onPress={() => router.push({
                            pathname: '/modals/active-workout',
                            params: { templateId: template.id }
                          })}
                          activeOpacity={0.8}
                        >
                          <Feather name="play" size={13} color="white" />
                          <Text style={styles.startBtnText}>Start</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>

          {/* Loose / Unscheduled Templates */}
          {looseTemplates.length > 0 && (
            <View style={styles.looseSection}>
              <Text style={styles.looseSectionTitle}>Unscheduled Workouts</Text>
              {looseTemplates.map((template, idx) => (
                <Animated.View
                  key={template.id}
                  entering={FadeInRight.delay(idx * 60).springify()}
                  style={styles.looseCard}
                >
                  <View style={styles.cardIconBox}>
                    <MaterialCommunityIcons name="dumbbell" size={18} color={theme.colors.accent.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{template.name}</Text>
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => router.push({
                        pathname: '/modals/active-workout',
                        params: { templateId: template.id }
                      })}
                      activeOpacity={0.8}
                    >
                      <Feather name="play" size={13} color="white" />
                      <Text style={styles.startBtnText}>Start</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => setDeleteTarget({ id: template.id, name: template.name })}
                      activeOpacity={0.8}
                    >
                      <Feather name="trash-2" size={13} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {templates.length === 0 && (
            <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <MaterialCommunityIcons name="dumbbell" size={40} color={theme.colors.accent.secondary} />
              </View>
              <Text style={styles.emptyTitle}>No Workouts Yet</Text>
              <Text style={styles.emptySubtitle}>
                Design your training week by tapping the + button above.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push('/workout/builder')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyActionText}>Build My Split</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.scroll}>
          {user?.id && <ProgressTab userId={user.id} />}
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        visible={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        workoutName={deleteTarget?.name || ''}
        loading={deleting}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg.primary },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  plusBtn: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.premium,
  },

  searchRow: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    ...theme.shadow.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.primary,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#EDE9FE',
    marginHorizontal: 24,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 11,
  },
  activeTab: {
    backgroundColor: 'white',
    ...theme.shadow.soft,
  },
  tabText: {
    fontSize: 13,
    fontFamily: theme.font.family.semibold,
    color: theme.colors.text.muted,
  },
  activeTabText: {
    color: theme.colors.accent.primary,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 4 },

  // Edit Split button
  editSplitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    marginBottom: 16,
    ...theme.shadow.premium,
  },
  editSplitBtnText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  // ── Timeline ──
  timeline: { gap: 10 },

  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  dayRowToday: {},

  dayLabelCol: {
    width: 36,
    alignItems: 'center',
    gap: 4,
  },
  dayAbbr: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
    letterSpacing: 0.5,
  },
  dayAbbrToday: {
    color: theme.colors.accent.primary,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.primary,
  },

  // Rest card
  restCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    opacity: 0.65,
  },
  restIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restLabel: {
    fontSize: 13,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },

  // Workout card
  workoutCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 14,
    ...theme.shadow.card,
  },
  workoutCardToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent.primary,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    marginBottom: 1,
  },
  cardDayLabel: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  todayBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 9,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
    letterSpacing: 0.8,
  },

  // Action buttons
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  startBtnText: {
    fontSize: 12,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: theme.font.family.bold,
    color: theme.colors.accent.primary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: theme.font.family.bold,
    color: '#EF4444',
  },

  // Loose templates
  looseSection: { marginTop: 28 },
  looseSectionTitle: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  looseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    ...theme.shadow.card,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyActionBtn: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    ...theme.shadow.premium,
  },
  emptyActionText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  // ── Delete Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  deleteModal: {
    backgroundColor: 'white',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 8,
    ...theme.shadow.premium,
  },
  deleteIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deleteTitle: {
    fontSize: 20,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  deleteSubtitle: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 8,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.secondary,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: 'white',
  },

  // ── Progress Tab ──
  progressLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    ...theme.shadow.card,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: theme.font.family.heading,
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },

  weeklyChart: {
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    ...theme.shadow.card,
  },
  chartTitle: {
    fontSize: 15,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  barGroup: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bar: {
    width: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  barActive: {
    backgroundColor: '#C4B5FD',
  },
  barToday: {
    backgroundColor: theme.colors.accent.primary,
    width: 12,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.muted,
  },
  barLabelToday: {
    color: theme.colors.accent.primary,
  },

  sectionHeader: {
    fontSize: 16,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    marginHorizontal: 24,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    ...theme.shadow.card,
  },
  sessionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionName: {
    fontSize: 14,
    fontFamily: theme.font.family.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 11,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
  },
  sessionBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontFamily: theme.font.family.bold,
    color: '#10B981',
  },
  emptyProgress: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyProgressText: {
    fontSize: 14,
    fontFamily: theme.font.family.medium,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
});
