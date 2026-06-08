import { create } from 'zustand';

export interface InsightCard {
  id: string;
  type: 'adherence' | 'recovery' | 'strength' | 'nutrition' | 'weight' | 'motivation' | 'fatigue' | 'streak';
  headline: string;
  body: string;
  trend: 'up' | 'down' | 'stable';
  urgency: 'low' | 'medium' | 'high';
  sourceData?: Record<string, any>;
}

export interface CoachState {
  lastWorkoutSummary: string;
  currentWeek: number;
  phase: string;
  readinessScore: number;
  fatigueLevel: number;
  weeklyAdherence: number;
  activePlanSummary: string;
  lastInteractionContext: string;
  memoryHighlights: string[];
}

interface LiveContextStore {
  insights: InsightCard[];
  coach: CoachState;
  nutritionContext: string;
  progressContext: string;
  isGeneratingInsights: boolean;
  lastInsightGeneration: number;
  setInsights: (insights: InsightCard[]) => void;
  updateCoach: (partial: Partial<CoachState>) => void;
  setNutritionContext: (ctx: string) => void;
  setProgressContext: (ctx: string) => void;
  setGeneratingInsights: (v: boolean) => void;
  reset: () => void;
}

export const useLiveContextStore = create<LiveContextStore>((set) => ({
  insights: [],
  coach: {
    lastWorkoutSummary: '',
    currentWeek: 0,
    phase: 'consultation',
    readinessScore: 7,
    fatigueLevel: 3,
    weeklyAdherence: 0,
    activePlanSummary: '',
    lastInteractionContext: '',
    memoryHighlights: [],
  },
  nutritionContext: '',
  progressContext: '',
  isGeneratingInsights: false,
  lastInsightGeneration: 0,
  setInsights: (insights) => set({ insights, isGeneratingInsights: false, lastInsightGeneration: Date.now() }),
  updateCoach: (partial) => set((s) => ({ coach: { ...s.coach, ...partial } })),
  setNutritionContext: (nutritionContext) => set({ nutritionContext }),
  setProgressContext: (progressContext) => set({ progressContext }),
  setGeneratingInsights: (isGeneratingInsights) => set({ isGeneratingInsights }),
  reset: () => set({
    insights: [],
    coach: {
      lastWorkoutSummary: '',
      currentWeek: 0,
      phase: 'consultation',
      readinessScore: 7,
      fatigueLevel: 3,
      weeklyAdherence: 0,
      activePlanSummary: '',
      lastInteractionContext: '',
      memoryHighlights: [],
    },
    nutritionContext: '',
    progressContext: '',
    isGeneratingInsights: false,
    lastInsightGeneration: 0,
  }),
}));
