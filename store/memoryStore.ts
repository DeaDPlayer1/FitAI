import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Types ──

export interface RecoveryDay {
  id?: string;
  logDate: string;
  sleepHours?: number;
  sleepQuality?: number;
  sleepEfficiency?: number;
  restingHr?: number;
  hrv?: number;
  sorenessScore?: number;
  fatigueScore?: number;
  stressScore?: number;
  subjectiveReadiness?: number;
  recoveryScore?: number;
  energyLevel?: number;
  jointPain?: number;
  medicationAdhered?: boolean;
  symptomFlare?: boolean;
  flareNotes?: string;
  mood?: string;
}

export interface BiometricRecord {
  id?: string;
  recordedAt: string;
  weightKg?: number;
  bodyFatPct?: number;
  systolicBp?: number;
  diastolicBp?: number;
  waistCm?: number;
  hipCm?: number;
  notes?: string;
}

export interface BehavioralEvent {
  id?: string;
  eventType: 'missed_session' | 'completed_session' | 'emotional_flag' | 'nudge_opened' | 'adherence_break' | 'streak_recovery' | 'motivation_dip' | 'stress_report';
  context?: string;
  location?: string;
  emotionalFlag?: string;
  stressContext?: string;
  createdAt: string;
}

export interface ExerciseProgressEntry {
  id?: string;
  exerciseName: string;
  exerciseId?: string;
  sessionDate: string;
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
  volumeLoad?: number;
  notes?: string;
}

export interface Insight {
  id?: string;
  insightType: 'pattern' | 'anomaly' | 'trend' | 'achievement' | 'warning';
  category: 'training' | 'recovery' | 'nutrition' | 'behavioral' | 'health';
  title: string;
  body: string;
  supportingData?: Record<string, any>;
  userFeedback?: 'helpful' | 'not_helpful';
  dismissed?: boolean;
  createdAt: string;
}

// ── State ──

interface MemoryState {
  recoveryDays: RecoveryDay[];
  biometrics: BiometricRecord[];
  behavioralEvents: BehavioralEvent[];
  exerciseProgress: ExerciseProgressEntry[];
  insights: Insight[];

  // Last sync timestamps
  lastSyncAt: string | null;

  hydrated: boolean;

  // Actions
  setRecoveryDays: (days: RecoveryDay[]) => void;
  addRecoveryDay: (day: RecoveryDay) => void;
  setBiometrics: (records: BiometricRecord[]) => void;
  addBiometric: (record: BiometricRecord) => void;
  setBehavioralEvents: (events: BehavioralEvent[]) => void;
  addBehavioralEvent: (event: BehavioralEvent) => void;
  setExerciseProgress: (entries: ExerciseProgressEntry[]) => void;
  addExerciseProgress: (entry: ExerciseProgressEntry) => void;
  setInsights: (insights: Insight[]) => void;
  addInsight: (insight: Insight) => void;
  updateInsightFeedback: (id: string, feedback: 'helpful' | 'not_helpful') => void;
  dismissInsight: (id: string) => void;
  setLastSyncAt: (timestamp: string) => void;
  clearAll: () => void;
}

const MEMORY_CACHE_KEY = '@pulse_ai_memory_cache';

export const useMemoryStore = create<MemoryState>((set, get) => ({
  recoveryDays: [],
  biometrics: [],
  behavioralEvents: [],
  exerciseProgress: [],
  insights: [],
  lastSyncAt: null,
  hydrated: false,

  setRecoveryDays: (recoveryDays) => set({ recoveryDays }),
  addRecoveryDay: (day) => set((state) => ({
    recoveryDays: [day, ...state.recoveryDays.filter(d => d.logDate !== day.logDate)],
  })),

  setBiometrics: (biometrics) => set({ biometrics }),
  addBiometric: (record) => set((state) => ({
    biometrics: [record, ...state.biometrics],
  })),

  setBehavioralEvents: (behavioralEvents) => set({ behavioralEvents }),
  addBehavioralEvent: (event) => set((state) => ({
    behavioralEvents: [event, ...state.behavioralEvents],
  })),

  setExerciseProgress: (exerciseProgress) => set({ exerciseProgress }),
  addExerciseProgress: (entry) => set((state) => ({
    exerciseProgress: [entry, ...state.exerciseProgress],
  })),

  setInsights: (insights) => set({ insights }),
  addInsight: (insight) => set((state) => ({
    insights: [insight, ...state.insights],
  })),
  updateInsightFeedback: (id, feedback) => set((state) => ({
    insights: state.insights.map(i => i.id === id ? { ...i, userFeedback: feedback } : i),
  })),
  dismissInsight: (id) => set((state) => ({
    insights: state.insights.map(i => i.id === id ? { ...i, dismissed: true } : i),
  })),

  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  clearAll: () => set({
    recoveryDays: [],
    biometrics: [],
    behavioralEvents: [],
    exerciseProgress: [],
    insights: [],
    lastSyncAt: null,
  }),
}));

// ── Persist to AsyncStorage on changes (debounced 500ms) ──
let persistTimer: ReturnType<typeof setTimeout> | null = null;
useMemoryStore.subscribe((state) => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    const cacheData = {
      recoveryDays: state.recoveryDays.slice(0, 30),
      biometrics: state.biometrics.slice(0, 50),
      exerciseProgress: state.exerciseProgress.slice(0, 100),
      insights: state.insights.filter(i => !i.dismissed).slice(0, 20),
      lastSyncAt: state.lastSyncAt,
    };
    AsyncStorage.setItem(MEMORY_CACHE_KEY, JSON.stringify(cacheData)).catch(() => {});
  }, 500);
});

// ── Hydrate from AsyncStorage on load ──
export async function hydrateMemoryCache(): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(MEMORY_CACHE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      useMemoryStore.setState({
        recoveryDays: parsed.recoveryDays || [],
        biometrics: parsed.biometrics || [],
        exerciseProgress: parsed.exerciseProgress || [],
        insights: parsed.insights || [],
        lastSyncAt: parsed.lastSyncAt || null,
      });
    }
  } catch {}
  useMemoryStore.setState({ hydrated: true });
}
