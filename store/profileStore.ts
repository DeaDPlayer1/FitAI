import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  achieved_at: string;
}

export interface Milestone {
  id: string;
  milestone_type: string;
  title: string;
  subtitle: string | null;
  value: string | null;
  icon: string | null;
  achieved_at: string;
}

export interface RecoveryLog {
  id: string;
  logged_date: string;
  stress_level: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  soreness: number | null;
  fatigue: number | null;
  mood: number | null;
  notes: string | null;
}

export interface ActivityDay {
  logged_at: string;
  workout_completed: boolean;
  minutes_active: number;
  calories_burned: number;
  steps: number;
}

interface ProfileState {
  achievements: Achievement[];
  milestones: Milestone[];
  recoveryLogs: RecoveryLog[];
  activityDays: ActivityDay[];
  loading: boolean;
  error: string | null;

  fetchAchievements: (userId: string) => Promise<void>;
  fetchMilestones: (userId: string) => Promise<void>;
  fetchRecoveryLogs: (userId: string) => Promise<void>;
  fetchActivityDays: (userId: string) => Promise<void>;
  fetchAll: (userId: string) => Promise<void>;

  addAchievement: (userId: string, achievement: Omit<Achievement, 'id' | 'achieved_at'>) => Promise<void>;
  addMilestone: (userId: string, milestone: Omit<Milestone, 'id' | 'achieved_at'>) => Promise<void>;
  upsertRecoveryLog: (userId: string, log: Partial<RecoveryLog> & { logged_date: string }) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  achievements: [],
  milestones: [],
  recoveryLogs: [],
  activityDays: [],
  loading: false,
  error: null,

  fetchAchievements: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });
      if (error) { console.warn('[profile] fetchAchievements:', error.message); return; }
      set({ achievements: data || [] });
    } catch (e: any) { console.warn('[profile] fetchAchievements exception:', e.message); }
  },

  fetchMilestones: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('fitness_milestones')
        .select('*')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });
      if (error) { console.warn('[profile] fetchMilestones:', error.message); return; }
      set({ milestones: data || [] });
    } catch (e: any) { console.warn('[profile] fetchMilestones exception:', e.message); }
  },

  fetchRecoveryLogs: async (userId) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from('recovery_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('logged_date', { ascending: false });
      if (error) { console.warn('[profile] fetchRecoveryLogs:', error.message); return; }
      set({ recoveryLogs: data || [] });
    } catch (e: any) { console.warn('[profile] fetchRecoveryLogs exception:', e.message); }
  },

  fetchActivityDays: async (userId) => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', ninetyDaysAgo.toISOString())
        .order('logged_at', { ascending: false });
      if (error) { console.warn('[profile] fetchActivityDays:', error.message); return; }
      set({ activityDays: data || [] });
    } catch (e: any) { console.warn('[profile] fetchActivityDays exception:', e.message); }
  },

  fetchAll: async (userId) => {
    set({ loading: true, error: null });
    const results = await Promise.allSettled([
      get().fetchAchievements(userId),
      get().fetchMilestones(userId),
      get().fetchRecoveryLogs(userId),
      get().fetchActivityDays(userId),
    ]);
    const rejected = results.filter(r => r.status === 'rejected');
    if (rejected.length > 0) {
      console.warn(`[profile] ${rejected.length} fetch(s) failed in fetchAll`);
    }
    set({ loading: false });
  },

  addAchievement: async (userId, achievement) => {
    const { error } = await supabase
      .from('achievements')
      .insert({ user_id: userId, ...achievement });
    if (error) { console.error('addAchievement:', error.message); return; }
    get().fetchAchievements(userId);
  },

  addMilestone: async (userId, milestone) => {
    const { error } = await supabase
      .from('fitness_milestones')
      .insert({ user_id: userId, ...milestone });
    if (error) { console.error('addMilestone:', error.message); return; }
    get().fetchMilestones(userId);
  },

  upsertRecoveryLog: async (userId, log) => {
    const { error } = await supabase
      .from('recovery_logs')
      .upsert({ user_id: userId, ...log }, { onConflict: 'user_id,logged_date' });
    if (error) { console.error('upsertRecoveryLog:', error.message); return; }
    get().fetchRecoveryLogs(userId);
  },
  reset: () => set({
    achievements: [],
    milestones: [],
    recoveryLogs: [],
    activityDays: [],
    loading: false,
    error: null,
  }),
}));
