import type { MemoryWorkoutSession, MemoryNutritionDay, MemoryUserContext } from './memoryService';
import type { ActivePlan } from '@/store/aiTrainerStore';
import { estimate1RM, getE1rmTrend, type E1rmResult } from './e1rmCalculator';
import {
  TARGET_WEIGHT_LOSS_RATE, MAX_WEEKS_IN_DEFICIT, CALORIE_DROP_STEP, CALORIE_DROP_MAX,
  DEFAULT_CALORIE_FLOOR, MIN_PROTEIN_CKD, MAX_PROTEIN_CKD, MAX_SODIUM_CKD, MAX_SODIUM_LUPUS,
} from '@/constants/aiTrainerStates';

export interface WeightLog {
  date: string;
  weightKg: number;
}

export interface WeeklyReviewInput {
  userId: string;
  activePlan: ActivePlan;
  sessions: MemoryWorkoutSession[];
  nutritionDays: MemoryNutritionDay[];
  ctxHistory: MemoryUserContext[];
  weightLogs: WeightLog[];
  conditions: string[];
  gender?: string;
}

export interface WeeklyReviewOutput {
  weekNumber: number;
  sessionsCompleted: number;
  sessionsPlanned: number;
  adherenceScore: number;
  e1rmTrends: {
    exerciseName: string;
    trend: 'up' | 'down' | 'stable';
    changePct: number;
    recentAvg: number;
    previousAvg: number;
  }[];
  volumeTrends: { focus: string; weeklySets: number; status: string; suggestion: string }[];
  weightTrend: {
    weeklyAvg: number;
    weeklyChange: number;
    ratePct: number;
    inTargetZone: boolean;
    direction: 'losing' | 'gaining' | 'stable';
  };
  calAvg: number;
  calTarget: number;
  proteinAvg: number;
  calAdherencePct: number;
  avgRecoveryScore: number;
  fatigueTrend: 'up' | 'down' | 'stable';
  deloadRecommended: boolean;
  flareDetected: boolean;
  flareNotes: string[];
  adjustments: {
    type: 'calories' | 'protein' | 'volume' | 'intensity' | 'deload' | 'recovery' | 'none';
    action: string;
    reasoning: string;
  }[];
  summary: string;
  detailedReport: string;
}

function getDaysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function calcWeeklyAvg(values: { date: string; value: number }[]): number {
  const recent = values.filter(v => getDaysAgo(v.date) <= 7);
  if (recent.length === 0) return 0;
  return recent.reduce((s, v) => s + v.value, 0) / recent.length;
}

function calcRate(values: { date: string; value: number }[]): number {
  const sorted = [...values].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) return 0;
  const recent = sorted.slice(-7);
  const older = sorted.slice(-14, -7);
  if (older.length === 0 || recent.length === 0) return 0;
  const recentAvg = recent.reduce((s, v) => s + v.value, 0) / recent.length;
  const olderAvg = older.reduce((s, v) => s + v.value, 0) / older.length;
  return olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0;
}

export async function runWeeklyReview(input: WeeklyReviewInput): Promise<WeeklyReviewOutput> {
  const userId = input.userId;
  const plan = input.activePlan;
  const sessions = input.sessions.filter(s => getDaysAgo(s.session_date) <= 7);
  const nutrition = input.nutritionDays.filter(n => getDaysAgo(n.log_date) <= 7);
  const ctx = input.ctxHistory.filter(c => getDaysAgo(c.created_at || '') <= 7);
  const weights = input.weightLogs.filter(w => getDaysAgo(w.date) <= 14);

  const hasCkd = input.conditions.some(c => c.toLowerCase().includes('ckd') || c.toLowerCase().includes('kidney'));
  const hasLupus = input.conditions.some(c => c.toLowerCase().includes('lupus') || c.toLowerCase().includes('sle'));

  const sessionsPlanned = plan.weekNumber > 0 ? 4 : 0;
  const sessionsCompleted = sessions.length;
  const adherenceScore = sessionsPlanned > 0 ? Math.round((sessionsCompleted / sessionsPlanned) * 100) : 0;

  const calAvg = nutrition.length > 0
    ? Math.round(nutrition.reduce((s, n) => s + (n.total_calories || 0), 0) / nutrition.length)
    : 0;
  const calTarget = plan.calorieTarget;
  const proteinAvg = nutrition.length > 0
    ? Math.round(nutrition.reduce((s, n) => s + (n.total_protein_g || 0), 0) / nutrition.length)
    : 0;
  const calAdherencePct = calTarget > 0
    ? Math.round(nutrition.filter(n => {
        const ratio = (n.total_calories || 0) / calTarget;
        return ratio >= 0.9 && ratio <= 1.1;
      }).length / Math.max(1, nutrition.length) * 100)
    : 0;

  const avgRecoveryScore = ctx.length > 0
    ? Math.round(ctx
        .filter(c => c.energy_level != null)
        .reduce((s, c) => s + (c.energy_level || 0) * 10, 0) / Math.max(1, ctx.length))
    : 50;

  const fatigueValues = ctx
    .filter(c => c.energy_level != null)
    .map(c => 10 - (c.energy_level || 5));
  const fatigueTrend: 'up' | 'down' | 'stable' = fatigueValues.length >= 3
    ? (fatigueValues[fatigueValues.length - 1] > fatigueValues[0] ? 'up' :
       fatigueValues[fatigueValues.length - 1] < fatigueValues[0] ? 'down' : 'stable')
    : 'stable';

  const weightWeeklyAvg = weights.length > 0
    ? calcWeeklyAvg(weights.map(w => ({ date: w.date, value: w.weightKg })))
    : 0;
  const weightRate = weights.length >= 2 ? calcRate(weights.map(w => ({ date: w.date, value: w.weightKg }))) : 0;
  const inTargetZone = weightRate < 0 ? Math.abs(weightRate) >= TARGET_WEIGHT_LOSS_RATE.min && Math.abs(weightRate) <= TARGET_WEIGHT_LOSS_RATE.max : true;
  const weeklyChange = weightWeeklyAvg > 0 ? Math.round(weightRate * weightWeeklyAvg * 10) / 10 : 0;

  const e1rmResults: E1rmResult[] = [];
  for (const s of sessions) {
    if (s.exercises && Array.isArray(s.exercises)) {
      for (const ex of s.exercises) {
        if (ex.sets && Array.isArray(ex.sets)) {
          for (const set of ex.sets) {
            if (set.weight && set.reps) {
              e1rmResults.push({
                exerciseName: ex.name || ex.exercise_name || 'Unknown',
                e1rm: estimate1RM(set.weight, set.reps, set.rpe),
                brzycki: 0,
                epley: 0,
                weight: set.weight,
                reps: set.reps,
                rpe: set.rpe,
                sessionDate: s.session_date,
              });
            }
          }
        }
      }
    }
  }

  const e1rmTrends = getE1rmTrend(e1rmResults);

  const volumeTrends: { focus: string; weeklySets: number; status: string; suggestion: string }[] = [];
  const focusMap = new Map<string, number>();
  for (const session of sessions) {
    if (session.focus) {
      focusMap.set(session.focus, (focusMap.get(session.focus) || 0) + 1);
    }
  }
  for (const [focus, count] of focusMap) {
    const weeklySets = count * 3;
    volumeTrends.push({
      focus,
      weeklySets,
      status: weeklySets < 8 ? 'low' : weeklySets > 20 ? 'high' : 'optimal',
      suggestion: weeklySets < 8 ? 'Consider increasing volume' : weeklySets > 20 ? 'Monitor fatigue levels' : 'Volume is appropriate',
    });
  }

  const flareDetected = ctx.some(c => {
    const notes = c.notes?.toLowerCase() || '';
    return notes.includes('flare') || notes.includes('pain') || notes.includes('symptom');
  });
  const flareNotes = flareDetected
    ? ctx.filter(c => c.notes?.toLowerCase().includes('flare')).map(c => c.notes!)
    : [];

  const deloadRecommended = avgRecoveryScore < 40 || fatigueTrend === 'up' || flareDetected;

  const adjustments: WeeklyReviewOutput['adjustments'] = [];

  if (flareDetected) {
    adjustments.push({
      type: 'recovery',
      action: 'Auto-transition to recovery week',
      reasoning: 'Flare symptoms detected. Reducing training volume and maintaining nutrition targets. No calorie deficit this week.',
    });
  } else if (deloadRecommended && plan.weekNumber >= 3) {
    adjustments.push({
      type: 'deload',
      action: 'Deload week recommended — reduce volume by 40%',
      reasoning: `Recovery score ${avgRecoveryScore}/100 with ${fatigueTrend} fatigue trend. Scheduled deload.`,
    });
  } else {
    const ratePct = Math.abs(weightRate);
    const strengthDecline = e1rmTrends.some(t => t.trend === 'down' && t.changePct < -3);

    if (weightRate < 0 && ratePct < TARGET_WEIGHT_LOSS_RATE.min && !strengthDecline) {
      const drop = Math.min(CALORIE_DROP_MAX, Math.round(CALORIE_DROP_STEP * 1.5));
      adjustments.push({
        type: 'calories',
        action: `Drop calories by ${drop} kcal`,
        reasoning: `Weight loss at ${(ratePct * 100).toFixed(1)}% BW/week is below target. Strength is maintained — safe to increase deficit.`,
      });
    } else if (weightRate < 0 && ratePct < TARGET_WEIGHT_LOSS_RATE.min && strengthDecline) {
      adjustments.push({
        type: 'volume',
        action: 'Hold calories steady, add 2k daily steps',
        reasoning: 'Weight loss slowing and strength declining. Further calorie reduction may accelerate muscle loss. Increase NEAT instead.',
      });
    } else if (weightRate < 0 && ratePct > TARGET_WEIGHT_LOSS_RATE.max) {
      adjustments.push({
        type: 'calories',
        action: 'Hold calories or add 100 kcal refeed day',
        reasoning: `Weight loss at ${(ratePct * 100).toFixed(1)}% BW/week exceeds safe rate. Hold or slightly increase to preserve muscle.`,
      });
    } else if (weightRate > 0) {
      adjustments.push({
        type: 'calories',
        action: 'Weight stable or gaining — review food logging accuracy',
        reasoning: 'Weight not trending down as expected. Check for hidden calories or under-logging. Consider reducing by 100 kcal.',
      });
    } else {
      adjustments.push({
        type: 'none',
        action: 'Continue current plan',
        reasoning: `Weight loss at ${(ratePct * 100).toFixed(1)}% BW/week is in target zone (${(TARGET_WEIGHT_LOSS_RATE.min * 100).toFixed(1)}-${(TARGET_WEIGHT_LOSS_RATE.max * 100).toFixed(1)}%). Strength ${strengthDecline ? 'declining — monitor' : 'maintained'}.`,
      });
    }

    if (hasCkd && proteinAvg > MAX_PROTEIN_CKD * 70) {
      adjustments.push({
        type: 'protein',
        action: `Reduce protein to max ${MAX_PROTEIN_CKD}g/kg/day`,
        reasoning: `CKD protocol: protein at ${(proteinAvg / 70).toFixed(1)}g/kg exceeds safe limit of ${MAX_PROTEIN_CKD}g/kg.`,
      });
    }

    if (plan.weekNumber > MAX_WEEKS_IN_DEFICIT && weightRate < 0) {
      adjustments.push({
        type: 'calories',
        action: 'Diet break week — increase to maintenance',
        reasoning: `${plan.weekNumber} weeks in deficit. Time for a 1-2 week maintenance phase to reset metabolic hormones.`,
      });
    }
  }

  const calFloor = DEFAULT_CALORIE_FLOOR[(input.gender as keyof typeof DEFAULT_CALORIE_FLOOR) || 'other'];
  for (const adj of adjustments) {
    if (adj.type === 'calories' && adj.action.includes('Drop') && adj.action.includes('kcal')) {
      const newCal = calTarget - CALORIE_DROP_STEP;
      if (newCal < calFloor) {
        adj.action = `Calories at floor (${calFloor} kcal) — increase NEAT instead`;
        adj.reasoning = `Cannot drop below safe floor of ${calFloor} kcal. Increase activity instead.`;
      }
    }
  }

  const summaryParts: string[] = [];
  if (flareDetected) {
    summaryParts.push('⚠️ Health flare detected — switching to recovery mode this week.');
  }
  summaryParts.push(`Week ${plan.weekNumber} review: ${sessionsCompleted}/${sessionsPlanned} sessions (${adherenceScore}% adherence).`);
  summaryParts.push(`Avg ${calAvg}/${calTarget} kcal (${calAdherencePct}% days within target).`);
  summaryParts.push(`Weight ${weightRate < 0 ? 'down' : weightRate > 0 ? 'up' : 'stable'} ${(Math.abs(weightRate) * 100).toFixed(1)}% BW/week.`);
  if (e1rmTrends.length > 0) {
    const up = e1rmTrends.filter(t => t.trend === 'up').length;
    const down = e1rmTrends.filter(t => t.trend === 'down').length;
    if (up > 0) summaryParts.push(`${up} lift(s) improving.`);
    if (down > 0) summaryParts.push(`${down} lift(s) declining.`);
  }
  summaryParts.push(`Recovery: ${avgRecoveryScore}/100.`);
  summaryParts.push(`Adjustment: ${adjustments[0]?.action || 'No changes needed.'}`);

  const detailedParts: string[] = [];
  detailedParts.push(`# Week ${plan.weekNumber} Review`);
  detailedParts.push('');
  detailedParts.push(`## Adherence`);
  detailedParts.push(`- Sessions: ${sessionsCompleted}/${sessionsPlanned} completed`);
  detailedParts.push(`- Nutrition: ${calAdherencePct}% of days within 10% of target`);
  detailedParts.push(`- Recovery score: ${avgRecoveryScore}/100`);
  detailedParts.push('');
  detailedParts.push(`## Body Weight`);
  if (weightWeeklyAvg > 0) {
    detailedParts.push(`- Weekly average: ${weightWeeklyAvg.toFixed(1)} kg`);
    detailedParts.push(`- Rate: ${(Math.abs(weightRate) * 100).toFixed(2)}% BW/week`);
    detailedParts.push(`- Status: ${inTargetZone ? '✅ In target zone' : '⚠️ Outside target zone'}`);
  } else {
    detailedParts.push('- Insufficient weight data. Log weight daily for trend analysis.');
  }
  detailedParts.push('');
  detailedParts.push(`## Strength Trends`);
  if (e1rmTrends.length > 0) {
    for (const t of e1rmTrends) {
      detailedParts.push(`- ${t.exerciseName}: ${t.trend === 'up' ? '📈' : t.trend === 'down' ? '📉' : '➡️'} ${t.changePct > 0 ? '+' : ''}${t.changePct}% (${t.previousAvg} → ${t.recentAvg} kg)`);
    }
  } else {
    detailedParts.push('- Insufficient data. Log RPE with sets for e1RM tracking.');
  }
  detailedParts.push('');
  detailedParts.push(`## Nutrition`);
  detailedParts.push(`- Avg calories: ${calAvg} (target: ${calTarget})`);
  detailedParts.push(`- Avg protein: ${proteinAvg}g`);
  if (hasCkd) detailedParts.push(`- CKD: Protein range ${MIN_PROTEIN_CKD}-${MAX_PROTEIN_CKD}g/kg, sodium <${MAX_SODIUM_CKD}mg`);
  if (hasLupus) detailedParts.push(`- Lupus: Anti-inflammatory emphasis, sodium <${MAX_SODIUM_LUPUS}mg`);
  detailedParts.push('');
  detailedParts.push(`## Adjustments`);
  for (const adj of adjustments) {
    detailedParts.push(`- **${adj.action}**: ${adj.reasoning}`);
  }

  return {
    weekNumber: plan.weekNumber,
    sessionsCompleted,
    sessionsPlanned,
    adherenceScore: Math.min(100, adherenceScore),
    e1rmTrends,
    volumeTrends,
    weightTrend: {
      weeklyAvg: Math.round(weightWeeklyAvg * 10) / 10,
      weeklyChange,
      ratePct: Math.round(weightRate * 10000) / 100,
      inTargetZone,
      direction: weightRate < -0.001 ? 'losing' : weightRate > 0.001 ? 'gaining' : 'stable',
    },
    calAvg,
    calTarget,
    proteinAvg,
    calAdherencePct,
    avgRecoveryScore,
    fatigueTrend,
    deloadRecommended,
    flareDetected,
    flareNotes,
    adjustments,
    summary: summaryParts.join(' '),
    detailedReport: detailedParts.join('\n'),
  };
}
