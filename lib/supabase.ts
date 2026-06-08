import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
if (!supabaseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
if (!supabaseAnonKey) throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is not configured');

// Store auth tokens under 'sb-' prefix in SecureStore (primary) + AsyncStorage (replica)
// Supabase v2 uses keys like "sb-{projectRef}-auth-token"
const SESSION_KEY_MATCH = 'sb-';

let _secureStoreReady: boolean | null = null;

const ensureSecureStore = async (): Promise<boolean> => {
  if (_secureStoreReady !== null) return _secureStoreReady;
  try {
    _secureStoreReady = await withTimeout(SecureStore.isAvailableAsync(), 2000) ?? false;
  } catch {
    _secureStoreReady = false;
  }
  return _secureStoreReady;
};

// Dual-layer storage: SecureStore (primary) + AsyncStorage (replica)
// Both layers written/read for resilience against OS-level store clearing
// Timeout wrapper to prevent SecureStore calls from hanging forever on some Android devices.
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]).catch(() => null);

const ExpoStorage = {
  getItem: async (key: string) => {
    try {
      if (key.startsWith(SESSION_KEY_MATCH)) {
        const avail = await ensureSecureStore();
        if (avail) {
          const val = await withTimeout(SecureStore.getItemAsync(key), 2000);
          if (val !== null) return val;
        }
      }
      return await AsyncStorage.getItem(key);
    } catch {
      try { return await AsyncStorage.getItem(key); } catch { return null; }
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      // Always write to AsyncStorage first (reliable)
      await AsyncStorage.setItem(key, value).catch(() => {});
      // SecureStore write — fire without await to avoid hanging login flow
      if (key.startsWith(SESSION_KEY_MATCH)) {
        const avail = await ensureSecureStore();
        if (avail && value.length <= 2048) {
          SecureStore.setItemAsync(key, value).catch(() => {});
        }
      }
    } catch {
      // Silent — AsyncStorage already written
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key).catch(() => {});
      if (key.startsWith(SESSION_KEY_MATCH)) {
        const avail = await ensureSecureStore();
        if (avail) {
          SecureStore.deleteItemAsync(key).catch(() => {});
        }
      }
    } catch {
      // Silent
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'x-application-name': 'fitness-app' },
  },
});
