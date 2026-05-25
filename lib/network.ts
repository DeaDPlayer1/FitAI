import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type NetworkListener = (isConnected: boolean) => void;

let listeners: Set<NetworkListener> = new Set();
let isConnected = true;

export function getNetworkStatus(): boolean {
  return isConnected;
}

export function setNetworkStatus(connected: boolean) {
  if (isConnected !== connected) {
    isConnected = connected;
    listeners.forEach(l => l(isConnected));
  }
}

export function addNetworkListener(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useNetworkStatus(): boolean {
  const [connected, setConnected] = useState(isConnected);

  useEffect(() => {
    const remove = addNetworkListener(setConnected);
    return remove;
  }, []);

  return connected;
}

export function useAppState() {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', setAppState);
    return () => sub.remove();
  }, []);

  return appState;
}

// Offline-aware fetch wrapper
export async function offlineAwareFetch<T>(
  fetchFn: () => Promise<T>,
  fallback: T,
  options: { retries?: number; retryDelay?: number; onError?: (error: Error) => void } = {}
): Promise<T> {
  const { retries = 2, retryDelay = 1000, onError } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (!isConnected) {
        throw new Error('No internet connection');
      }
      const result = await fetchFn();
      return result;
    } catch (error: any) {
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      if (onError) onError(error);
      return fallback;
    }
  }
  return fallback;
}
