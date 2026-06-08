import type { MemoryWorkoutSession } from './memoryService';

export type PeriodizationType = 'linear' | 'dup' | 'block' | 'conjugate';
export type TrainingGoal = 'hypertrophy' | 'strength' | 'endurance' | 'power' | 'general';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';
export type AutoregulationMethod = 'rpe' | 'rir' | 'percentage';

export interface MesocycleParams {
  goal: TrainingGoal;
  level: TrainingLevel;
  weeks: number;
  daysPerWeek: number;
  periodization: PeriodizationType;
  experienceMonths: number;
  injuries?: string[];
  conditions?: string[];
}

export interface WeeklySession {
  day: number;
  focus: string;
  exercises: ExerciseAssignment[];
  estimatedMinutes: number;
}

export interface ExerciseAssignment {
  name: string;
  sets: number;
  reps: number;
  intensityPct: number;
  rpe: number;
  restSeconds: number;
  notes: string;
}

export interface MesocyclePlan {
  periodization: PeriodizationType;
  goal: TrainingGoal;
  weeks: number;
  sessionsPerWeek: number;
  weeklySessions: WeeklySession[][];
  deloadWeek: number;
  progression: string;
}

export interface VolumeCheck {
  muscleGroup: string;
  setsPerWeek: number;
  recommended: { min: number; max: number };
  status: 'low' | 'optimal' | 'high' | 'excessive';
  suggestion: string;
}

export interface AutoregulationAdjustment {
  intensityModifier: number;
  volumeModifier: number;
  restModifier: number;
  rpeTarget: number;
  notes: string;
}

export interface LoadAssignment {
  percentage: number;
  reps: number;
  rpe: number;
  rir: number;
}

const VOLUME_LANDMARKS: Record<TrainingGoal, { min: number; max: number }> = {
  hypertrophy: { min: 10, max: 20 },
  strength: { min: 5, max: 10 },
  endurance: { min: 15, max: 25 },
  power: { min: 4, max: 8 },
  general: { min: 8, max: 15 },
};

const RPE_REP_TABLE: Record<number, { minReps: number; maxReps: number; intensityPct: number }> = {
  10: { minReps: 1, maxReps: 3, intensityPct: 100 },
  9: { minReps: 2, maxReps: 4, intensityPct: 92 },
  8: { minReps: 4, maxReps: 7, intensityPct: 85 },
  7: { minReps: 6, maxReps: 10, intensityPct: 80 },
  6: { minReps: 9, maxReps: 14, intensityPct: 75 },
  5: { minReps: 12, maxReps: 18, intensityPct: 70 },
};

const RIR_MAP: Record<number, number> = {
  1: 10, 2: 9, 3: 8, 4: 7, 5: 6,
};

export function getVolumeLandmarks(goal: TrainingGoal): { min: number; max: number } {
  return VOLUME_LANDMARKS[goal];
}

export function rpeToPercentage(rpe: number): number {
  const entry = RPE_REP_TABLE[rpe];
  return entry?.intensityPct ?? Math.round(50 + rpe * 5);
}

export function percentageToRpe(pct: number): number {
  const closest = Object.entries(RPE_REP_TABLE)
    .map(([rpe, data]) => ({ rpe: Number(rpe), diff: Math.abs(data.intensityPct - pct) }))
    .sort((a, b) => a.diff - b.diff);
  return closest[0]?.rpe ?? 7;
}

export function calculateVolume(sets: number, reps: number, weight: number): number {
  return sets * reps * weight;
}

export function weeklyVolumePerMuscleGroup(sessions: MemoryWorkoutSession[], muscleGroup?: string): VolumeCheck[] {
  const checks: VolumeCheck[] = [];

  if (!sessions || sessions.length === 0) {
    return [{ muscleGroup: 'unspecified', setsPerWeek: 0, recommended: { min: 8, max: 15 }, status: 'low', suggestion: 'Start with minimum effective volume.' }];
  }

  const focusVolume = new Map<string, number>();
  for (const s of sessions) {
    if (s.focus) {
      focusVolume.set(s.focus, (focusVolume.get(s.focus) || 0) + 1);
    }
  }

  const goal: TrainingGoal = 'hypertrophy';
  const landmarks = getVolumeLandmarks(goal);

  for (const [focus, count] of focusVolume) {
    const estimatedSets = count * 9;
    const recommended = getVolumeLandmarks(goal);
    let status: VolumeCheck['status'] = 'optimal';
    if (estimatedSets < recommended.min * 0.7) status = 'low';
    else if (estimatedSets > recommended.max) status = 'high';
    else if (estimatedSets > recommended.max * 1.3) status = 'excessive';

    checks.push({
      muscleGroup: focus,
      setsPerWeek: Math.round(estimatedSets / Math.max(1, sessions.length / 4)),
      recommended: landmarks,
      status,
      suggestion: status === 'low' ? `Increase volume for ${focus}.` : status === 'high' ? `Monitor fatigue for ${focus}.` : 'Volume is optimal.',
    });
  }

  if (checks.length === 0) {
    checks.push({ muscleGroup: 'general', setsPerWeek: 0, recommended: landmarks, status: 'low', suggestion: 'Log workout focuses for volume analysis.' });
  }

  return checks;
}

export function autoregulate(readiness: number, plannedRPE: number, recentFatigue: number): AutoregulationAdjustment {
  const base = { intensityModifier: 1, volumeModifier: 1, restModifier: 1, rpeTarget: plannedRPE, notes: '' };

  if (readiness <= 3 || recentFatigue >= 8) {
    return {
      ...base,
      intensityModifier: 0.6,
      volumeModifier: 0.5,
      rpeTarget: Math.max(5, plannedRPE - 3),
      notes: 'Low readiness — reduce intensity and volume. Consider active recovery.',
    };
  }
  if (readiness <= 5 || recentFatigue >= 6) {
    return {
      ...base,
      intensityModifier: 0.8,
      volumeModifier: 0.75,
      rpeTarget: Math.max(5, plannedRPE - 2),
      notes: 'Moderate fatigue — reduce volume, keep intensity moderate.',
    };
  }
  if (readiness <= 7 || recentFatigue >= 4) {
    return {
      ...base,
      intensityModifier: 0.9,
      volumeModifier: 0.9,
      rpeTarget: Math.max(5, plannedRPE - 1),
      notes: 'Slightly fatigued — small reduction, focus on technique.',
    };
  }

  return { ...base, notes: 'Full readiness — execute as planned.' };
}

export function generateLinearProgression(week: number, totalWeeks: number, params: MesocycleParams): WeeklySession[] {
  const phase = week / totalWeeks;
  const intensity = 0.65 + phase * 0.25;
  const volumeScale = 1 - phase * 0.3;

  const sessions: WeeklySession[] = [];
  const days = ['Upper', 'Lower', 'Push', 'Pull', 'Legs', 'Full Body', 'Upper'];

  for (let d = 0; d < params.daysPerWeek; d++) {
    const dayFocus = days[d % days.length];
    const rpe = Math.round(percentageToRpe(intensity * 100));
    const repsPerSet = RPE_REP_TABLE[rpe]?.maxReps ?? 10;

    sessions.push({
      day: d + 1,
      focus: dayFocus,
      exercises: [
        {
          name: `Primary ${dayFocus} movement`,
          sets: Math.max(3, Math.round(4 * volumeScale)),
          reps: Math.max(4, Math.round(repsPerSet * volumeScale)),
          intensityPct: Math.round(intensity * 100),
          rpe,
          restSeconds: rpe >= 8 ? 180 : 90,
          notes: `Week ${week} of ${totalWeeks}`,
        },
      ],
      estimatedMinutes: Math.round(45 * volumeScale + 10),
    });
  }
  return sessions;
}

export function generateDUPWeek(week: number, params: MesocycleParams): WeeklySession[] {
  const intensities = [0.8, 0.65, 0.75, 0.7, 0.85, 0.6, 0.7];
  const volumeMod = 1 + Math.sin(week * 0.5) * 0.15;

  return params.daysPerWeek > 0
    ? Array.from({ length: params.daysPerWeek }, (_, d) => {
        const rpe = Math.round(percentageToRpe(intensities[d % intensities.length] * 100));
        return {
          day: d + 1,
          focus: ['Heavy', 'Moderate', 'Light', 'Power', 'Hypertrophy', 'Recovery', 'Moderate'][d % 7],
          exercises: [{
            name: 'Main compound',
            sets: Math.max(3, Math.round(4 * volumeMod)),
            reps: RPE_REP_TABLE[rpe]?.maxReps ?? 8,
            intensityPct: Math.round(intensities[d % intensities.length] * 100),
            rpe,
            restSeconds: rpe >= 8 ? 180 : 90,
            notes: `DUP week ${week}`,
          }],
          estimatedMinutes: Math.round(40 * volumeMod + 10),
        };
      })
    : [];
}

export function generateBlockPeriodization(block: number, totalBlocks: number): { phase: string; intensity: number; volume: number } {
  if (totalBlocks === 0) return { phase: 'accumulation', intensity: 0.7, volume: 1 };
  const phaseProgress = block / totalBlocks;
  if (phaseProgress < 0.33) return { phase: 'accumulation', intensity: 0.65 + phaseProgress * 0.3, volume: 1 - phaseProgress * 0.2 };
  if (phaseProgress < 0.66) return { phase: 'intensification', intensity: 0.75 + phaseProgress * 0.2, volume: 0.7 - phaseProgress * 0.1 };
  return { phase: 'realization', intensity: 0.85 + phaseProgress * 0.1, volume: 0.5 - phaseProgress * 0.1 };
}

export function determineDeloadWeek(params: MesocycleParams): number {
  if (params.level === 'beginner') return Math.min(params.weeks, 6);
  if (params.level === 'intermediate') return Math.min(params.weeks, 4);
  return Math.min(params.weeks, 3);
}

export function generateMesocycle(params: MesocycleParams): MesocyclePlan {
  const deloadWeek = determineDeloadWeek(params);
  const weeklySessions: WeeklySession[][] = [];

  for (let w = 1; w <= params.weeks; w++) {
    if (w === deloadWeek) {
      weeklySessions.push(
        Array.from({ length: params.daysPerWeek }, (_, d) => ({
          day: d + 1,
          focus: 'Deload',
          exercises: [{
            name: 'Active recovery',
            sets: 2,
            reps: 12,
            intensityPct: 50,
            rpe: 4,
            restSeconds: 60,
            notes: 'Deload week — 50% intensity, 50% volume',
          }],
          estimatedMinutes: 25,
        }))
      );
      continue;
    }

    switch (params.periodization) {
      case 'linear':
        weeklySessions.push(generateLinearProgression(w, params.weeks, params));
        break;
      case 'dup':
        weeklySessions.push(generateDUPWeek(w, params));
        break;
      case 'block': {
        const totalBlocks = Math.ceil(params.weeks / 4);
        const block = Math.ceil(w / 4);
        const { intensity } = generateBlockPeriodization(block, totalBlocks);
        weeklySessions.push(generateLinearProgression(w % 4 === 0 ? 4 : w % 4, 4, { ...params, periodization: 'linear' }));
        break;
      }
      default:
        weeklySessions.push(generateLinearProgression(w, params.weeks, params));
    }
  }

  return {
    periodization: params.periodization,
    goal: params.goal,
    weeks: params.weeks,
    sessionsPerWeek: params.daysPerWeek,
    weeklySessions,
    deloadWeek,
    progression: params.periodization === 'linear' ? 'Weekly intensity +5%, volume -5%' :
      params.periodization === 'dup' ? 'Daily intensity variation (heavy/moderate/light)' :
      params.periodization === 'block' ? '3-block accumulation → intensification → realization' : 'Multi-quality concurrent training',
  };
}

export function assignLoad(percentage: number): LoadAssignment {
  const closest = Object.entries(RPE_REP_TABLE)
    .map(([rpe, data]) => ({ rpe: Number(rpe), diff: Math.abs(data.intensityPct - percentage) }))
    .sort((a, b) => a.diff - b.diff);
  const rpe = closest[0]?.rpe ?? 7;
  const entry = RPE_REP_TABLE[rpe];

  return {
    percentage: Math.round(percentage),
    reps: entry?.maxReps ?? 8,
    rpe,
    rir: RIR_MAP[rpe] ?? 1,
  };
}
