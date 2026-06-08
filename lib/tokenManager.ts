import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Portable base64 decode (no atob dependency)
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4 === 3 ? '=' : base64.length % 4 === 2 ? '==' : '';
  try {
    // Try atob first (JSC/Hermes modern)
    if (typeof atob === 'function') return atob(base64 + pad);
  } catch {}
  // Manual decode for older runtimes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const b = [...base64 + pad].map((c) => chars.indexOf(c));
  for (let i = 0; i < b.length; i += 4) {
    output += String.fromCharCode((b[i] << 2) | (b[i + 1] >> 4));
    if (b[i + 2] !== 64) {
      output += String.fromCharCode(((b[i + 1] & 15) << 4) | (b[i + 2] >> 2));
      if (b[i + 3] !== 64) {
        output += String.fromCharCode(((b[i + 2] & 3) << 6) | b[i + 3]);
      }
    }
  }
  return output;
}

// Decode JWT payload without verification (just read exp claim)
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

// Check if an access token has fewer than `minRemainingMs` millis before expiry
function isTokenExpiringSoon(
  accessToken: string,
  minRemainingMs: number = 5 * 60 * 1000,
): boolean {
  const payload = decodeJwt(accessToken);
  if (!payload || typeof payload.exp !== 'number') return true;
  const expMs = payload.exp * 1000;
  return expMs - Date.now() < minRemainingMs;
}

const REFRESH_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Token refresh timed out')), ms)
    ),
  ]);
}

// Force a token refresh and persist the new session to both stores
async function refreshAndPersistSession(): Promise<Session | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.auth.refreshSession(),
      REFRESH_TIMEOUT_MS
    );
    if (error || !data.session) {
      console.warn('[tokenManager] Refresh failed:', error?.message);
      return null;
    }
    return data.session;
  } catch (err: any) {
    console.warn('[tokenManager] Refresh error:', err?.message || err);
    return null;
  }
}

// Check current token and refresh if <5 min remaining
export async function ensureFreshToken(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.access_token) return false;

    if (isTokenExpiringSoon(session.access_token)) {
      const refreshed = await refreshAndPersistSession();
      return !!refreshed;
    }
    return true;
  } catch (err) {
    console.warn('[tokenManager] ensureFreshToken error:', err);
    return false;
  }
}

// Aggressively clear session data from all storage layers
export async function clearStoredSession(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter((k: string) => k.startsWith('sb-'));
    if (authKeys.length > 0) {
      await AsyncStorage.multiRemove(authKeys);
    }
    // Also attempt to clear from SecureStore
    try {
      const isAvail = await SecureStore.isAvailableAsync();
      if (isAvail) {
        for (const key of authKeys) {
          await SecureStore.deleteItemAsync(key).catch(() => {});
        }
      }
    } catch {
      // SecureStore may not be available
    }
  } catch (err) {
    console.warn('[tokenManager] clearStoredSession error:', err);
  }
}

// Public wrapper: get session, refresh if near expiry
export async function getValidSession(): Promise<{
  session: Session | null;
  refreshed: boolean;
}> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return { session: null, refreshed: false };

  if (isTokenExpiringSoon(session.access_token)) {
    const refreshed = await refreshAndPersistSession();
    if (refreshed) return { session: refreshed, refreshed: true };
    return { session: null, refreshed: false };
  }
  return { session, refreshed: false };
}

// Set up automatic periodic token check (call once at app boot)
let _refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startPeriodicTokenRefresh(intervalMs: number = 4 * 60 * 1000): void {
  stopPeriodicTokenRefresh();
  _refreshInterval = setInterval(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        stopPeriodicTokenRefresh();
        return;
      }
      if (data.session.access_token && isTokenExpiringSoon(data.session.access_token)) {
        await refreshAndPersistSession();
      }
    } catch {
      // Silent — will retry next interval
    }
  }, intervalMs);
}

export function stopPeriodicTokenRefresh(): void {
  if (_refreshInterval) {
    clearInterval(_refreshInterval);
    _refreshInterval = null;
  }
}
