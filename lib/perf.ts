import { useCallback, useRef, useEffect, useMemo } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): T {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return useCallback((...args: any[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  }, [delay]) as T;
}

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): T {
  const inThrottle = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback((...args: any[]) => {
    if (!inThrottle.current) {
      fnRef.current(...args);
      inThrottle.current = true;
      setTimeout(() => { inThrottle.current = false; }, limit);
    }
  }, [limit]) as T;
}

export function useStableCallback<T extends (...args: any[]) => any>(
  fn: T,
): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}

export function useRunOnce(fn: () => void, deps: any[] = []) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    fn();
  }, deps);
}

export function createSelector<TSource, TResult>(
  select: (source: TSource) => TResult,
): (source: TSource) => TResult {
  let prev: { input: TSource; output: TResult } | null = null;
  return (source: TSource) => {
    if (prev && prev.input === source) return prev.output;
    const output = select(source);
    prev = { input: source, output };
    return output;
  };
}

export function memoized<T extends object, R>(
  fn: (arg: T) => R,
): (arg: T) => R {
  const cache = new WeakMap<T, R>();
  return (arg: T) => {
    if (cache.has(arg)) return cache.get(arg)!;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

export function safe<T, Fallback>(
  accessor: () => T,
  fallback: Fallback,
): T | Fallback {
  try { return accessor(); } catch { return fallback; }
}

export function safeProp<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback: T[K] | null = null,
): T[K] | null {
  if (obj == null) return fallback;
  return obj[key] ?? fallback;
}

export function useIsMounted(): () => boolean {
  const ref = useRef(true);
  useEffect(() => { ref.current = true; return () => { ref.current = false; }; }, []);
  return useCallback(() => ref.current, []);
}

export function useAsyncCallback<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): { execute: (...args: Parameters<T>) => Promise<ReturnType<T> | undefined>; isLoading: ReturnType<typeof useRef<boolean>> } {
  const isMounted = useIsMounted();
  const isLoading = useRef(false);
  const execute = useCallback(async (...args: any[]) => {
    if (isLoading.current) return;
    isLoading.current = true;
    try {
      return await fn(...args);
    } finally {
      isLoading.current = false;
    }
  }, [fn]);
  return { execute: execute as any, isLoading };
}

export function batchUpdates<T>(fn: () => T): T {
  return fn();
}

export function now(): number {
  return performance?.now?.() ?? Date.now();
}

const p = performance?.now
  ? () => performance.now()
  : () => Date.now();

export function trackTiming(label: string) {
  const start = p();
  return () => {
    const elapsed = p() - start;
    if (__DEV__ && elapsed > 16) {
      console.warn(`[perf] ${label} took ${elapsed.toFixed(1)}ms`);
    }
  };
}

export function lazyValue<T>(factory: () => T): () => T {
  let cached: T | undefined;
  let initialized = false;
  return () => {
    if (!initialized) { cached = factory(); initialized = true; }
    return cached as T;
  };
}

export function createCache<V>(ttlMs: number = 5000) {
  const store = new Map<string, { value: V; expiry: number }>();
  return {
    get(key: string): V | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiry) { store.delete(key); return undefined; }
      return entry.value;
    },
    set(key: string, value: V): void {
      store.set(key, { value, expiry: Date.now() + ttlMs });
    },
    clear: () => store.clear(),
    size: () => store.size,
  };
}
