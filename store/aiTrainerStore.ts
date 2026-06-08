import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AiTrainerPhase } from '@/constants/aiTrainerStates';

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rir?: number;
  restSeconds?: number;
  aiNote?: string;
  progressionCue?: string;
}

export interface WorkoutDay {
  dayName: string;
  focus: string;
  isRest: boolean;
  exercises: WorkoutExercise[];
  cardioMinutes?: number;
  aiNote?: string;
  progressionNote?: string;
}

export interface ActivePlan {
  id: string;
  userId: string;
  version: number;
  weekNumber: number;
  phase: AiTrainerPhase;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  sodiumLimit: number;
  weeklyVolumeTarget: number;
  conditionAdaptations: string[];
  trainingSplitSummary: string;
  aiSummary: string;
  createdAt: string;
  appliedAt: string | null;
  safetyValidated: boolean;
  safetyNotes: string[];
  // NEW: dynamic plan fields
  workoutDays: WorkoutDay[];
  goal: string;
  splitType: string;
  cardioStrategy: string;
  recoveryStrategy: string;
  progressionStrategy: string;
  currentWeek: number;
  maxDurationWeeks: number;
  adherenceState?: string;
  fatigueState?: string;
  weekLabel?: string;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekNumber: number;
  planVersion: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  adherenceScore: number;
  calAvg: number;
  calTarget: number;
  proteinAvg: number;
  weightTrend: { weeklyAvg: number; weeklyChange: number; ratePct: number };
  adjustments: { type: string; action: string; reasoning: string }[];
  summary: string;
  userFeedback: 'approved' | 'edited' | 'rejected' | null;
  createdAt: string;
}

interface WellnessEntry {
  id: string;
  date: string;
  type: 'morning' | 'post_workout';
  energyLevel?: number;
  soreness?: number;
  fatigue?: number;
  jointPain?: number;
  stressLevel?: number;
  symptomNotes?: string;
  medicationAdhered?: boolean | null;
  mood?: 'great' | 'good' | 'okay' | 'low' | 'poor';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiTrainerState {
  phase: AiTrainerPhase;
  activePlan: ActivePlan | null;
  planHistory: ActivePlan[];
  weeklyReviews: WeeklyReview[];
  wellnessLogs: WellnessEntry[];
  lastCheckinDate: string | null;
  pendingPlan: ActivePlan | null;
  isLoading: boolean;
  aiTrainerMode: boolean;
  aiTrainerChatHistory: ChatMessage[];

  setPhase: (phase: AiTrainerPhase) => void;
  setActivePlan: (plan: ActivePlan | null) => void;
  setPendingPlan: (plan: ActivePlan | null) => void;
  addPlanToHistory: (plan: ActivePlan) => void;
  addWeeklyReview: (review: WeeklyReview) => void;
  addWellnessEntry: (entry: WellnessEntry) => void;
  setLastCheckinDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  hydrateFromCache: () => Promise<void>;
  clearAll: () => void;
  setAiTrainerMode: (mode: boolean) => void;
  addAiTrainerMessage: (msg: ChatMessage) => void;
  clearAiTrainerChat: () => void;
}

const CACHE_KEY = '@pulse_ai_trainer_state';

export const useAiTrainerStore = create<AiTrainerState>((set, get) => ({
  phase: 'idle',
  activePlan: null,
  planHistory: [],
  weeklyReviews: [],
  wellnessLogs: [],
  lastCheckinDate: null,
  pendingPlan: null,
  isLoading: false,
  aiTrainerMode: false,
  aiTrainerChatHistory: [],

  setPhase: (phase) => set({ phase }),
  setActivePlan: (plan) => set({ activePlan: plan }),
  setPendingPlan: (plan) => set({ pendingPlan: plan }),
  addPlanToHistory: (plan) => set((state) => ({
    planHistory: [plan, ...state.planHistory].slice(0, 52),
  })),
  addWeeklyReview: (review) => set((state) => ({
    weeklyReviews: [review, ...state.weeklyReviews].slice(0, 52),
  })),
  addWellnessEntry: (entry) => set((state) => ({
    wellnessLogs: [entry, ...state.wellnessLogs.filter(e => e.id !== entry.id)].slice(0, 90),
  })),
  setLastCheckinDate: (date) => set({ lastCheckinDate: date }),
  setLoading: (loading) => set({ isLoading: loading }),

  setAiTrainerMode: (mode) => set({ aiTrainerMode: mode }),
  addAiTrainerMessage: (msg) => set((state) => ({
    aiTrainerChatHistory: [...state.aiTrainerChatHistory, msg].slice(-100),
  })),
  clearAiTrainerChat: () => set({ aiTrainerChatHistory: [] }),

  hydrateFromCache: async () => {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          phase: parsed.phase || 'idle',
          activePlan: parsed.activePlan || null,
          planHistory: parsed.planHistory || [],
          weeklyReviews: parsed.weeklyReviews || [],
          wellnessLogs: parsed.wellnessLogs || [],
          lastCheckinDate: parsed.lastCheckinDate || null,
          pendingPlan: parsed.pendingPlan || null,
          aiTrainerMode: parsed.aiTrainerMode || false,
          aiTrainerChatHistory: parsed.aiTrainerChatHistory || [],
        });
      }
    } catch {}
  },

  clearAll: () => {
    set({
      phase: 'idle',
      activePlan: null,
      planHistory: [],
      weeklyReviews: [],
      wellnessLogs: [],
      lastCheckinDate: null,
      pendingPlan: null,
      aiTrainerMode: false,
      aiTrainerChatHistory: [],
    });
    AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
  },
}));

let persistTimer: ReturnType<typeof setTimeout> | null = null;
useAiTrainerStore.subscribe((state) => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      phase: state.phase,
      activePlan: state.activePlan,
      planHistory: state.planHistory.slice(0, 52),
      weeklyReviews: state.weeklyReviews.slice(0, 52),
      wellnessLogs: state.wellnessLogs.slice(0, 90),
      lastCheckinDate: state.lastCheckinDate,
      pendingPlan: state.pendingPlan,
      aiTrainerMode: state.aiTrainerMode,
      aiTrainerChatHistory: state.aiTrainerChatHistory.slice(-50),
    })).catch(() => {});
  }, 500);
});
