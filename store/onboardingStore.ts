import { create } from 'zustand';

export interface OnboardingData {
  goal: string | null;
  experienceLevel: string | null;
  frequency: number | null;
  equipment: string | null;
  height: string;
  heightUnit: 'cm' | 'ft';
  weight: string;
  weightUnit: 'kg' | 'lbs';
  age: string;
}

interface OnboardingState {
  data: OnboardingData;
  setGoal: (goal: string) => void;
  setExperienceLevel: (level: string) => void;
  setFrequency: (days: number) => void;
  setEquipment: (eq: string) => void;
  setHeight: (h: string) => void;
  setHeightUnit: (u: 'cm' | 'ft') => void;
  setWeight: (w: string) => void;
  setWeightUnit: (u: 'kg' | 'lbs') => void;
  setAge: (a: string) => void;
  reset: () => void;
}

const defaultData: OnboardingData = {
  goal: null,
  experienceLevel: null,
  frequency: null,
  equipment: null,
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  age: '',
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: { ...defaultData },
  setGoal: (goal) => set((s) => ({ data: { ...s.data, goal } })),
  setExperienceLevel: (experienceLevel) => set((s) => ({ data: { ...s.data, experienceLevel } })),
  setFrequency: (frequency) => set((s) => ({ data: { ...s.data, frequency } })),
  setEquipment: (equipment) => set((s) => ({ data: { ...s.data, equipment } })),
  setHeight: (height) => set((s) => ({ data: { ...s.data, height } })),
  setHeightUnit: (heightUnit) => set((s) => ({ data: { ...s.data, heightUnit } })),
  setWeight: (weight) => set((s) => ({ data: { ...s.data, weight } })),
  setWeightUnit: (weightUnit) => set((s) => ({ data: { ...s.data, weightUnit } })),
  setAge: (age) => set((s) => ({ data: { ...s.data, age } })),
  reset: () => set({ data: { ...defaultData } }),
}));
