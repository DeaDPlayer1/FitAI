import type { MemoryWorkoutSession, MemoryNutritionDay, MemoryUserContext, MemoryInjury } from './memoryService';
import { queryWorkoutVolume, queryWorkoutFrequency, queryAvgRPEPerWeek, queryNutritionAverage, adherenceRate, queryContextTrend } from './contextEngine';

export type InsightCategory = 'workout' | 'nutrition' | 'recovery' | 'behavior' | 'health' | 'progress';
export type InsightSeverity = 'positive' | 'neutral' | 'warning' | 'critical';

export interface Insight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  body: string;
  metric?: number;
  trend?: 'up' | 'down' | 'stable';
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  timestamp: string;
}

export interface Anomaly {
  entity: string;
  field: string;
  value: number;
  expectedRange: { min: number; max: number };
  deviation: number;
  severity: InsightSeverity;
  description: string;
}

let insightCounter = 0;

function makeId(): string {
  return `insight_${++insightCounter}_${Date.now()}`;
}

function zScore(value: number, mean: number, std: number): number {
  return std > 0 ? Math.abs(value - mean) / std : 0;
}

export function detectAnomalies(sessions: MemoryWorkoutSession[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  const volumes = sessions.filter(s => s.total_volume_kg != null).map(s => s.total_volume_kg!);
  if (volumes.length >= 5) {
    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, v) => sum + (v - mean) ** 2, 0) / volumes.length;
    const std = Math.sqrt(variance);

    for (const s of sessions) {
      if (s.total_volume_kg == null) continue;
      const z = zScore(s.total_volume_kg, mean, std);
      if (z > 2.5) {
        anomalies.push({
          entity: 'workout_sessions',
          field: 'total_volume_kg',
          value: s.total_volume_kg,
          expectedRange: { min: Math.round((mean - std) * 10) / 10, max: Math.round((mean + std) * 10) / 10 },
          deviation: Math.round(z * 10) / 10,
          severity: 'warning',
          description: `Unusual volume spike: ${s.total_volume_kg}kg (${Math.round(z)}σ above mean of ${Math.round(mean)}kg) on ${s.session_date}`,
        });
      }
      if (z > 3) {
        anomalies[anomalies.length - 1].severity = 'critical';
      }
    }
  }

  const rpes = sessions.filter(s => s.rpe_avg != null).map(s => s.rpe_avg!);
  if (rpes.length >= 5) {
    const mean = rpes.reduce((a, b) => a + b, 0) / rpes.length;
    const std = Math.sqrt(rpes.reduce((sum, v) => sum + (v - mean) ** 2, 0) / rpes.length);

    for (const s of sessions) {
      if (s.rpe_avg == null) continue;
      const z = zScore(s.rpe_avg, mean, std);
      if (s.rpe_avg > 9.5 || (z > 2 && s.rpe_avg > 9)) {
        anomalies.push({
          entity: 'workout_sessions',
          field: 'rpe_avg',
          value: s.rpe_avg,
          expectedRange: { min: Math.round((mean - std) * 10) / 10, max: Math.round((mean + std) * 10) / 10 },
          deviation: Math.round(z * 10) / 10,
          severity: 'warning',
          description: `Maximal effort session: RPE ${s.rpe_avg} on ${s.session_date} (mean ${Math.round(mean * 10) / 10}). Ensure adequate recovery.`,
        });
      }
    }
  }

  return anomalies;
}

export function detectPatterns(sessions: MemoryWorkoutSession[]): Insight[] {
  const insights: Insight[] = [];

  if (sessions.length < 3) return insights;

  const focusMap = new Map<string, number>();
  for (const s of sessions) {
    if (s.focus) focusMap.set(s.focus, (focusMap.get(s.focus) || 0) + 1);
  }

  const topFocus = [...focusMap.entries()].sort((a, b) => b[1] - a[1]);
  if (topFocus.length >= 2) {
    const ratio = topFocus[1][1] / Math.max(1, topFocus[0][1]);
    if (ratio > 0.3) {
      insights.push({
        id: makeId(),
        category: 'workout',
        severity: 'positive',
        title: 'Balanced Training',
        body: `You're training ${topFocus[0][0]} and ${topFocus[1][0]} in good proportion (${topFocus[0][1]} vs ${topFocus[1][1]} sessions).`,
        confidence: 0.6,
        actionable: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const focusCounts = [...focusMap.values()];
  const distinctCount = focusMap.size;
  if (distinctCount <= 2 && sessions.length >= 6) {
    insights.push({
      id: makeId(),
      category: 'workout',
      severity: 'warning',
      title: 'Limited Training Variety',
      body: `Last ${sessions.length} sessions only covered ${distinctCount} focus areas. Consider varying your training stimuli.`,
      confidence: 0.5,
      actionable: true,
      suggestedAction: 'Add a different training focus or try a new exercise variation.',
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}

export function analyzeTrends(
  sessions: MemoryWorkoutSession[],
  nutritionDays: MemoryNutritionDay[],
  ctxHistory: MemoryUserContext[],
): Insight[] {
  const insights: Insight[] = [];

  if (sessions.length >= 4) {
    const vol = queryWorkoutVolume(sessions, 1);
    if (vol.trend === 'up' && vol.trendMagnitude && vol.trendMagnitude > 0.2) {
      insights.push({
        id: makeId(),
        category: 'workout',
        severity: 'positive',
        title: 'Volume Increasing',
        body: `Training volume trending up (+${Math.round(vol.trendMagnitude * 100)}%). Your work capacity is improving.`,
        metric: vol.value as number,
        trend: 'up',
        confidence: 0.7,
        actionable: false,
        timestamp: new Date().toISOString(),
      });
    }
    if (vol.trend === 'down' && vol.trendMagnitude && vol.trendMagnitude > 0.2) {
      insights.push({
        id: makeId(),
        category: 'workout',
        severity: 'warning',
        title: 'Volume Declining',
        body: `Training volume dropping (-${Math.round(vol.trendMagnitude * 100)}%). Could indicate accumulated fatigue or reduced motivation.`,
        metric: vol.value as number,
        trend: 'down',
        confidence: 0.6,
        actionable: true,
        suggestedAction: 'Check recovery metrics. Consider a deload or motivation check-in.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (nutritionDays.length >= 4) {
    const adhere = adherenceRate(nutritionDays, 1);
    if (Number(adhere.value) < 0.5 && (adhere.samples ?? 0) >= 4) {
      insights.push({
        id: makeId(),
        category: 'nutrition',
        severity: 'warning',
        title: 'Nutrition Adherence Dropping',
        body: `Adherence score is ${Math.round(Number(adhere.value) * 100)}%. Below 50% suggests consistent challenges.`,
        metric: adhere.value as number,
        trend: adhere.trend,
        confidence: 0.7,
        actionable: true,
        suggestedAction: 'Simplify meal prep. Consider a 3-day meal plan reset.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (ctxHistory.length >= 3) {
    const stress = queryContextTrend(ctxHistory, 'current_stress_level');
    if (stress.trend === 'up' && Number(stress.value) > 6) {
      insights.push({
        id: makeId(),
        category: 'recovery',
        severity: 'warning',
        title: 'Rising Stress Levels',
        body: `Stress trending up at ${String(stress.value)}/10. Elevated stress impacts recovery, sleep, and adherence.`,
        metric: stress.value as number,
        trend: 'up',
        confidence: 0.65,
        actionable: true,
        suggestedAction: 'Incorporate stress management: 5-min breathing, walk, or meditation.',
        timestamp: new Date().toISOString(),
      });
    }

    const energy = queryContextTrend(ctxHistory, 'energy_level');
    if (energy.trend === 'down' && Number(energy.value) < 5 && ctxHistory.length >= 4) {
      insights.push({
        id: makeId(),
        category: 'recovery',
        severity: 'critical',
        title: 'Sustained Low Energy',
        body: `Energy levels declining over the past week (avg ${String(energy.value)}/10). This may indicate overreaching or under-recovery.`,
        metric: energy.value as number,
        trend: 'down',
        confidence: 0.7,
        actionable: true,
        suggestedAction: 'Take a rest day. Check sleep quality and calorie intake. Consider a deload week.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  return insights;
}

export function generateInsights(
  sessions: MemoryWorkoutSession[],
  nutritionDays: MemoryNutritionDay[],
  ctxHistory: MemoryUserContext[],
): Insight[] {
  return [
    ...detectPatterns(sessions),
    ...analyzeTrends(sessions, nutritionDays, ctxHistory),
    ...detectAnomalies(sessions).map(a => ({
      id: makeId(),
      category: a.entity === 'workout_sessions' ? 'workout' as InsightCategory : 'health' as InsightCategory,
      severity: a.severity,
      title: 'Anomaly Detected',
      body: a.description,
      metric: a.value,
      confidence: 0.7,
      actionable: true,
      suggestedAction: 'Review and adjust training accordingly.',
      timestamp: new Date().toISOString(),
    })),
  ];
}
