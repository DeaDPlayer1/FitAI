import { useMemo, useRef } from 'react';

let _cachedDate: Date | null = null;
let _cachedDayName: string | null = null;
let _cachedDayIndex: number = -1;
let _cachedDateString: string | null = null;
let _cachedISOString: string | null = null;

function refreshCache() {
  const now = new Date();
  _cachedDate = now;
  _cachedDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  _cachedDayIndex = now.getDay();
  _cachedDateString = now.toDateString();
  _cachedISOString = now.toISOString();
}

refreshCache();

export function getToday(): Date {
  return _cachedDate!;
}

export function getTodayDayName(): string {
  return _cachedDayName!;
}

export function getTodayDayIndex(): number {
  return _cachedDayIndex;
}

export function getTodayDateString(): string {
  return _cachedDateString!;
}

export function getTodayISOString(): string {
  return _cachedISOString!;
}

export function refreshToday(): void {
  refreshCache();
}

export function useToday() {
  const refreshed = useRef(false);
  if (!refreshed.current) {
    refreshCache();
    refreshed.current = true;
  }
  return useMemo(() => ({
    date: _cachedDate!,
    dayName: _cachedDayName!,
    dayIndex: _cachedDayIndex,
    dateString: _cachedDateString!,
    isoString: _cachedISOString!,
  }), []);
}
