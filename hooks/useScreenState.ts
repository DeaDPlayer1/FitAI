import { useState, useCallback } from 'react';

export interface ScreenState {
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export function useScreenState(initialLoading = true) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const execute = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      setError(null);
      return await fn();
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong. Please try again.';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setRefreshing(true);
    return execute(fn);
  }, [execute]);

  return { loading, setLoading, error, setError, refreshing, execute, refresh };
}
