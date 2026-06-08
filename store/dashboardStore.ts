import { create } from 'zustand';

interface DashboardState {
  calories: {
    goal: number;
    consumed: number;
    burned: number;
  };
  steps: {
    today: number;
    goal: number;
  };
  workoutTime: {
    minutes: number;
    goal: number;
  };
  weightHistory: { date: string; value: number }[];
  heartRate: {
    current: number;
    min: number;
    max: number;
    history: number[];
  };

  // Actions
  setCalories: (consumed: number, burned: number) => void;
  addSteps: (steps: number) => void;
  updateHeartRate: (bpm: number) => void;
  addWeightEntry: (weight: number) => void;
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  calories: {
    goal: 1800,
    consumed: 0,
    burned: 0,
  },
  steps: {
    today: 0,
    goal: 10000,
  },
  workoutTime: {
    minutes: 0,
    goal: 45,
  },
  weightHistory: [],
  heartRate: {
    current: 72,
    min: 60,
    max: 140,
    history: [72, 75, 80, 78, 72, 70, 72],
  },

  setCalories: (consumed, burned) =>
    set((state) => ({
      calories: { ...state.calories, consumed, burned },
    })),
  addSteps: (steps) =>
    set((state) => ({
      steps: { ...state.steps, today: state.steps.today + steps },
    })),
  updateHeartRate: (bpm) =>
    set((state) => ({
      heartRate: {
        ...state.heartRate,
        current: bpm,
        min: Math.min(state.heartRate.min, bpm),
        max: Math.max(state.heartRate.max, bpm),
        history: [...state.heartRate.history.slice(-19), bpm],
      },
    })),
  addWeightEntry: (weight) =>
    set((state) => ({
      weightHistory: [
        ...state.weightHistory,
        { date: new Date().toISOString(), value: weight },
      ].slice(-30),
    })),
  reset: () => set({
    calories: { goal: 1800, consumed: 0, burned: 0 },
    steps: { today: 0, goal: 10000 },
    workoutTime: { minutes: 0, goal: 45 },
    weightHistory: [],
    heartRate: { current: 72, min: 60, max: 140, history: [72] },
  }),
}));
