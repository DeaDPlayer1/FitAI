import { create } from 'zustand';
import { UserProfile, HealthProfile } from '@/lib/auth';

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingStep: number;

  setUser: (user: UserProfile | null) => void;
  setHealthProfile: (hp: Partial<HealthProfile>) => void;
  setGoals: (goals: Partial<UserProfile['goals']>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setOnboardingStep: (step: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  onboardingStep: 0,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setHealthProfile: (hp) => {
    const current = get().user;
    if (!current) return;
    set({
      user: {
        ...current,
        health_profile: { ...current.health_profile, ...hp },
      },
    });
  },

  setGoals: (goals) => {
    const current = get().user;
    if (!current) return;
    set({
      user: {
        ...current,
        goals: { ...current.goals, ...goals },
      },
    });
  },

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setOnboardingStep: (step) => set({ onboardingStep: step }),
}));
