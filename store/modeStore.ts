import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppMode = 'normal' | 'ai_trainer';

interface ModeStore {
  appMode: AppMode;
  isSwitching: boolean;
  hydrated: boolean;
  setMode: (mode: AppMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

const MODE_KEY = '@fitai/app_mode';

export const useModeStore = create<ModeStore>((set, get) => ({
  appMode: 'normal',
  isSwitching: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(MODE_KEY);
      if (stored === 'normal' || stored === 'ai_trainer') {
        set({ appMode: stored, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  setMode: async (mode: AppMode) => {
    const prev = get().appMode;
    set({ isSwitching: true });
    try {
      await AsyncStorage.setItem(MODE_KEY, mode);
      set({ appMode: mode, isSwitching: false });
    } catch {
      set({ appMode: prev, isSwitching: false });
    }
  },
}));
