import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { WeeklyPlan } from '@/lib/aiTrainer';

export type WorkoutPlan = WeeklyPlan;

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

// FIX[4]: Persisted workout log rows coming from `workout_logs` table.
export interface WorkoutLogRow {
  id: string;
  user_id: string;
  plan_name: string | null;
  exercises: any; // jsonb array of { exercise, sets, reps, rest_seconds }
  source: 'ai_generated' | 'manual' | string;
  duration_minutes: number | null;
  logged_at: string;
}

interface WorkoutState {
  currentPlan: WorkoutPlan | null;
  isGenerating: boolean;
  selectedDay: number;
  coachChatHistory: ChatMessage[];
  workoutLogs: WorkoutLogRow[];

  setPlan: (plan: WorkoutPlan) => void;
  setGenerating: (v: boolean) => void;
  setSelectedDay: (day: number) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setWorkoutLogs: (logs: WorkoutLogRow[]) => void;
  addWorkoutLog: (log: WorkoutLogRow) => void;
  clearWorkoutLogs: () => void;
  fetchWorkoutLogs: (userId: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  currentPlan: null,
  isGenerating: false,
  selectedDay: 0,
  coachChatHistory: [],
  workoutLogs: [],

  setPlan: (currentPlan) => set({ currentPlan }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  addChatMessage: (msg) =>
    set((state) => ({
      coachChatHistory: [...state.coachChatHistory, msg].slice(-100),
    })),
  clearChat: () => {
    AsyncStorage.removeItem(COACH_CHAT_KEY).catch((e) => console.error('[workoutStore] clearChat AsyncStorage error:', e));
    set({ coachChatHistory: [] });
  },
  setWorkoutLogs: (workoutLogs) => set({ workoutLogs }),
  addWorkoutLog: (log) =>
    set((state) => ({ workoutLogs: [log, ...state.workoutLogs] })),
  clearWorkoutLogs: () => set({ workoutLogs: [] }),
  fetchWorkoutLogs: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false });
      if (!error && data) {
        set({ workoutLogs: data as WorkoutLogRow[] });
      }
    } catch (e) {
      console.error('[workoutStore] fetchWorkoutLogs error:', e);
    }
  },
}));

const COACH_CHAT_KEY = '@pulse_ai_coach_chat';

let persistTimer: ReturnType<typeof setTimeout> | null = null;
useWorkoutStore.subscribe((state, prev) => {
  if (state.coachChatHistory !== prev.coachChatHistory) {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      AsyncStorage.setItem(COACH_CHAT_KEY, JSON.stringify(state.coachChatHistory)).catch((e) => console.error('[workoutStore] persist chat AsyncStorage error:', e));
    }, 500);
  }
});

export async function hydrateCoachChat(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(COACH_CHAT_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        useWorkoutStore.setState({ coachChatHistory: parsed });
      }
    }
  } catch {}
}
