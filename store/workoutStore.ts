import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { WeeklyPlan } from '@/lib/aiTrainer';

export interface ExerciseSet {
  weight: number;
  reps: number;
  done: boolean;
}

export interface ExerciseLog {
  name: string;
  sets: ExerciseSet[];
}

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
  activeWorkout: ExerciseLog[];
  workoutLogs: WorkoutLogRow[];

  setPlan: (plan: WorkoutPlan) => void;
  setGenerating: (v: boolean) => void;
  setSelectedDay: (day: number) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  setActiveWorkout: (exercises: ExerciseLog[]) => void;
  clearActiveWorkout: () => void;
  setWorkoutLogs: (logs: WorkoutLogRow[]) => void;
  addWorkoutLog: (log: WorkoutLogRow) => void;
  clearWorkoutLogs: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  currentPlan: null,
  isGenerating: false,
  selectedDay: 0,
  coachChatHistory: [],
  activeWorkout: [],
  workoutLogs: [],

  setPlan: (currentPlan) => set({ currentPlan }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setSelectedDay: (selectedDay) => set({ selectedDay }),
  addChatMessage: (msg) =>
    set((state) => ({
      coachChatHistory: [...state.coachChatHistory, msg],
    })),
  clearChat: () => {
    AsyncStorage.removeItem(COACH_CHAT_KEY).catch((e) => console.error('[workoutStore] clearChat AsyncStorage error:', e));
    set({ coachChatHistory: [] });
  },
  setActiveWorkout: (activeWorkout) => set({ activeWorkout }),
  clearActiveWorkout: () => set({ activeWorkout: [] }),
  setWorkoutLogs: (workoutLogs) => set({ workoutLogs }),
  addWorkoutLog: (log) =>
    set((state) => ({ workoutLogs: [log, ...state.workoutLogs] })),
  clearWorkoutLogs: () => set({ workoutLogs: [] }),
}));

const COACH_CHAT_KEY = '@pulse_ai_coach_chat';

useWorkoutStore.subscribe((state, prev) => {
  if (state.coachChatHistory !== prev.coachChatHistory) {
    AsyncStorage.setItem(COACH_CHAT_KEY, JSON.stringify(state.coachChatHistory)).catch((e) => console.error('[workoutStore] persist chat AsyncStorage error:', e));
  }
});

AsyncStorage.getItem(COACH_CHAT_KEY).then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        useWorkoutStore.setState({ coachChatHistory: parsed });
      }
    } catch {}
  }
});
