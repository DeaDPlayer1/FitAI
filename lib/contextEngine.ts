import { getRecentWorkoutSessions, getRecentNutritionDays, getActiveInjuries, getActiveConditions, getUserContextHistory, getLatestUserContext, type MemoryWorkoutSession, type MemoryNutritionDay, type MemoryUserContext } from './memoryService';

export type AggregationType = 'avg' | 'sum' | 'max' | 'min' | 'trend' | 'count';
export type EntityType = 'workout' | 'nutrition' | 'context' | 'injury' | 'condition';

export interface StructuredQuery {
  entity: EntityType;
  field?: string;
  aggregation: AggregationType;
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, any>;
  groupBy?: 'day' | 'week' | 'month';
}

export interface QueryResult {
  label: string;
  value: number | string;
  unit?: string;
  confidence: number;
  trend?: 'up' | 'down' | 'stable';
  trendMagnitude?: number;
  samples?: number;
}

const DECAY_HALF_LIFE_DAYS = 14;

export function decayWeight(daysAgo: number): number {
  return Math.pow(0.5, daysAgo / DECAY_HALF_LIFE_DAYS);
}

function daysAgo(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function trendDirection(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 3) return 'stable';
  const first = values.slice(0, Math.ceil(values.length / 2));
  const last = values.slice(Math.floor(values.length / 2));
  const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const lastAvg = last.reduce((a, b) => a + b, 0) / last.length;
  const diff = lastAvg - firstAvg;
  if (Math.abs(diff) < firstAvg * 0.05) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

function trendMagnitude(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return first !== 0 ? Math.abs((last - first) / first) : 0;
}

export function queryWorkoutVolume(sessions: MemoryWorkoutSession[], months: number = 1): QueryResult {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = sessions.filter(s => s.session_date >= cutoffStr && s.total_volume_kg != null);
  if (filtered.length === 0) return { label: `Avg weekly volume (${months}mo)`, value: 0, unit: 'kg', confidence: 0, samples: 0 };

  const total = filtered.reduce((sum, s) => sum + (s.total_volume_kg ?? 0), 0);
  const weeks = Math.max(1, Math.ceil(daysAgo(filtered[filtered.length - 1].session_date) / 7));
  const weekly = total / weeks;

  const sorted = filtered.sort((a, b) => a.session_date.localeCompare(b.session_date));
  const weeklyVolumes: number[] = [];
  const weekMap = new Map<string, number>();
  for (const s of sorted) {
    const weekKey = s.session_date.substring(0, 7);
    weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + (s.total_volume_kg ?? 0));
  }
  weeklyVolumes.push(...weekMap.values());

  return {
    label: `Avg weekly volume (${months}mo)`,
    value: Math.round(weekly * 10) / 10,
    unit: 'kg',
    confidence: Math.min(1, filtered.length / (weeks * 3)),
    trend: trendDirection(weeklyVolumes),
    trendMagnitude: trendMagnitude(weeklyVolumes),
    samples: filtered.length,
  };
}

export function queryWorkoutFrequency(sessions: MemoryWorkoutSession[], months: number = 1): QueryResult {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = sessions.filter(s => s.session_date >= cutoffStr);
  const weeks = Math.max(1, Math.ceil(daysAgo(cutoffStr) / 7));

  return {
    label: `Avg sessions/week (${months}mo)`,
    value: Math.round((filtered.length / weeks) * 10) / 10,
    unit: 'sessions',
    confidence: Math.min(1, filtered.length / 10),
    samples: filtered.length,
  };
}

export function queryAvgRPEPerWeek(sessions: MemoryWorkoutSession[], months: number = 1): QueryResult {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const withRPE = sessions.filter(s => s.session_date >= cutoffStr && s.rpe_avg != null);
  if (withRPE.length === 0) return { label: `Avg RPE (${months}mo)`, value: 0, unit: 'RPE', confidence: 0, samples: 0 };

  const avg = withRPE.reduce((sum, s) => sum + (s.rpe_avg ?? 0), 0) / withRPE.length;
  const rpeValues = withRPE.map(s => s.rpe_avg ?? 0);

  return {
    label: `Avg RPE (${months}mo)`,
    value: Math.round(avg * 10) / 10,
    unit: 'RPE',
    confidence: Math.min(1, withRPE.length / 15),
    trend: trendDirection(rpeValues),
    trendMagnitude: trendMagnitude(rpeValues),
    samples: withRPE.length,
  };
}

export function queryNutritionAverage(nutritionDays: MemoryNutritionDay[], field: keyof MemoryNutritionDay, months: number = 1): QueryResult {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = nutritionDays.filter(n => n.log_date >= cutoffStr && n[field] != null);
  if (filtered.length === 0) return { label: `Avg ${field} (${months}mo)`, value: 0, confidence: 0, samples: 0 };

  const values = filtered.map(n => Number(n[field])).filter(v => !isNaN(v));
  if (values.length === 0) return { label: `Avg ${field} (${months}mo)`, value: 0, confidence: 0, samples: 0 };

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const unitMap: Partial<Record<keyof MemoryNutritionDay, string>> = {
    total_calories: 'kcal',
    total_protein_g: 'g',
    total_carbs_g: 'g',
    total_fat_g: 'g',
    total_sodium_mg: 'mg',
    total_water_ml: 'ml',
  };

  return {
    label: `Avg ${field.replace(/_/g, ' ')} (${months}mo)`,
    value: Math.round(avg * 10) / 10,
    unit: unitMap[field] ?? '',
    confidence: Math.min(1, filtered.length / 14),
    trend: trendDirection(values),
    trendMagnitude: trendMagnitude(values),
    samples: filtered.length,
  };
}

export function queryContextTrend(ctxHistory: MemoryUserContext[], field: keyof MemoryUserContext): QueryResult {
  const filtered = ctxHistory.filter(c => c[field] != null);
  if (filtered.length < 2) return { label: `${String(field)} trend`, value: 0, confidence: 0, samples: 0 };

  const values = filtered.map(c => Number(c[field])).filter(v => !isNaN(v));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    label: `Avg ${String(field).replace(/_/g, ' ')} (7d)`,
    value: Math.round(avg * 10) / 10,
    unit: '/10',
    confidence: Math.min(1, filtered.length / 5),
    trend: trendDirection(values),
    trendMagnitude: trendMagnitude(values),
    samples: filtered.length,
  };
}

export function adherenceRate(nutritionDays: MemoryNutritionDay[], months: number = 1): QueryResult {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = nutritionDays.filter(n => n.log_date >= cutoffStr && n.adherence_score != null);
  if (filtered.length === 0) return { label: `Adherence rate (${months}mo)`, value: 0, unit: '%', confidence: 0, samples: 0 };

  const avg = filtered.reduce((sum, n) => sum + (n.adherence_score ?? 0), 0) / filtered.length;

  return {
    label: `Adherence rate (${months}mo)`,
    value: Math.round(avg * 100) / 100,
    unit: '%',
    confidence: Math.min(1, filtered.length / 14),
    samples: filtered.length,
  };
}

export function summarizeWorkoutPeriod(sessions: MemoryWorkoutSession[], months: number = 1): string {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = sessions.filter(s => s.session_date >= cutoffStr);
  if (filtered.length === 0) return 'No workouts in this period.';

  const focusMap = new Map<string, number>();
  for (const s of filtered) {
    if (s.focus) focusMap.set(s.focus, (focusMap.get(s.focus) || 0) + 1);
  }
  const topFocus = [...focusMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const volume = queryWorkoutVolume(filtered, months);
  const freq = queryWorkoutFrequency(filtered, months);

  return `In the last ${months}mo: ${String(freq.value)} sessions/week avg. Top focuses: ${topFocus.map(([f, c]) => `${f} (${c}x)`).join(', ') || 'none specified'}. ${Number(volume.value) > 0 ? `Avg weekly volume: ${volume.value}kg.` : ''}`;
}

export function summarizeNutritionPeriod(nutritionDays: MemoryNutritionDay[], months: number = 1): string {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const filtered = nutritionDays.filter(n => n.log_date >= cutoffStr);
  if (filtered.length === 0) return 'No nutrition data in this period.';

  const cal = queryNutritionAverage(filtered, 'total_calories', months);
  const prot = queryNutritionAverage(filtered, 'total_protein_g', months);
  const adhere = adherenceRate(filtered, months);

  return `Last ${months}mo nutrition: ${cal.value}${cal.unit} avg daily. Protein: ${prot.value}g avg. Adherence: ${adhere.value}%.`;
}

export function summarizeContextPeriod(ctxHistory: MemoryUserContext[]): string {
  if (ctxHistory.length === 0) return 'No context data available.';

  const stress = queryContextTrend(ctxHistory, 'current_stress_level');
  const energy = queryContextTrend(ctxHistory, 'energy_level');
  const sleep = queryContextTrend(ctxHistory, 'sleep_quality');
  const motivation = queryContextTrend(ctxHistory, 'current_motivation_level');

  return `7-day context: Stress ${stress.value}/10 (${stress.trend === 'up' ? 'rising' : stress.trend === 'down' ? 'falling' : 'stable'}), Energy ${energy.value}/10, Sleep ${sleep.value}/10, Motivation ${motivation.value}/10.`;
}
