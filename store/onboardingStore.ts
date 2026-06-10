import { create } from 'zustand';

export interface OnboardingData {
  goal: string | null;
  gender: string | null;
  height: string;
  heightUnit: 'cm' | 'ft';
  weight: string;
  weightUnit: 'kg' | 'lbs';
  age: string;
  activityLevel: string | null;
  weeklyPace: string | null;
}

interface OnboardingState {
  data: OnboardingData;
  setGoal: (goal: string) => void;
  setGender: (gender: string) => void;
  setHeight: (h: string) => void;
  setHeightUnit: (u: 'cm' | 'ft') => void;
  setWeight: (w: string) => void;
  setWeightUnit: (u: 'kg' | 'lbs') => void;
  setAge: (a: string) => void;
  setActivityLevel: (level: string) => void;
  setWeeklyPace: (pace: string) => void;
  reset: () => void;
}

const defaultData: OnboardingData = {
  goal: null,
  gender: null,
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  age: '',
  activityLevel: null,
  weeklyPace: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: { ...defaultData },
  setGoal: (goal) => set((s) => ({ data: { ...s.data, goal } })),
  setGender: (gender) => set((s) => ({ data: { ...s.data, gender } })),
  setHeight: (height) => set((s) => ({ data: { ...s.data, height } })),
  setHeightUnit: (heightUnit) => set((s) => ({ data: { ...s.data, heightUnit } })),
  setWeight: (weight) => set((s) => ({ data: { ...s.data, weight } })),
  setWeightUnit: (weightUnit) => set((s) => ({ data: { ...s.data, weightUnit } })),
  setAge: (age) => set((s) => ({ data: { ...s.data, age } })),
  setActivityLevel: (activityLevel) => set((s) => ({ data: { ...s.data, activityLevel } })),
  setWeeklyPace: (weeklyPace) => set((s) => ({ data: { ...s.data, weeklyPace } })),
  reset: () => set({ data: { ...defaultData } }),
}));
