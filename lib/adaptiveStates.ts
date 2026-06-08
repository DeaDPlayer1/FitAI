import { StateId, STATE_PROMPTS, getStatePrompt, getStateLabel } from '@/constants/statePrompts';
import type { UserProfile, HealthProfile } from './auth';

export interface StateContext {
  recoveryScore?: number;
  hrvTrend?: 'stable' | 'declining' | 'improving';
  restingHr?: number;
  fatigueScore?: number;
  sorenessScore?: number;
  sleepHours?: number;
  sleepQuality?: number;
  recentPerformance?: 'normal' | 'declining' | 'improving';
  trainingAgeMonths?: number;
  currentGoal?: string;
  userConditions?: string[];
  recentMissedSessions?: number;
  stressLevel?: number;
  adherenceRate?: number;
}

export interface ResolvedState {
  primary: StateId;
  secondary: StateId[];
  allActive: StateId[];
  labels: string[];
  prompt: string;
}

type StateTrigger = (profile: HealthProfile, context: StateContext) => boolean;

interface StateEval {
  id: StateId;
  active: boolean;
  priority: number;
}

const triggers: Record<StateId, StateTrigger> = {
  recovery: (_profile, ctx) => {
    if (ctx.recoveryScore !== undefined && ctx.recoveryScore < 40) return true;
    if (ctx.hrvTrend === 'declining' && ctx.fatigueScore !== undefined && ctx.fatigueScore >= 7) return true;
    if (ctx.sorenessScore !== undefined && ctx.sorenessScore >= 8) return true;
    return false;
  },

  beginner: (profile, ctx) => {
    if (ctx.trainingAgeMonths !== undefined && ctx.trainingAgeMonths < 6) return true;
    return false;
  },

  ckd: (profile, _ctx) => {
    const conditions = profile.conditions.map(c => c.toLowerCase());
    return conditions.some(c => c.includes('ckd') || c.includes('chronic kidney') || c.includes('kidney disease'));
  },

  lupus: (profile, _ctx) => {
    const conditions = profile.conditions.map(c => c.toLowerCase());
    return conditions.some(c => c.includes('lupus') || c === 'sle' || c.includes('systemic lupus'));
  },

  fatLoss: (profile, ctx) => {
    const goal = (profile.goal || ctx.currentGoal || '').toLowerCase();
    return goal === 'fat_loss' || goal.includes('lose') || goal.includes('fat');
  },

  highFatigue: (_profile, ctx) => {
    if (ctx.fatigueScore !== undefined && ctx.fatigueScore >= 7 && ctx.recentMissedSessions !== undefined && ctx.recentMissedSessions >= 2) return true;
    if (ctx.fatigueScore !== undefined && ctx.fatigueScore >= 8) return true;
    if (ctx.recentPerformance === 'declining' && ctx.fatigueScore !== undefined && ctx.fatigueScore >= 6) return true;
    return false;
  },

  hypertrophy: (profile, ctx) => {
    const goal = (profile.goal || ctx.currentGoal || '').toLowerCase();
    if (goal === 'muscle_gain' || goal.includes('muscle') || goal.includes('grow')) return true;
    return false;
  },

  strength: (profile, ctx) => {
    const goal = (profile.goal || ctx.currentGoal || '').toLowerCase();
    if (goal === 'strength' || goal.includes('strong') || goal.includes('power')) return true;
    return false;
  },

  maintenance: (profile, ctx) => {
    const goal = (profile.goal || ctx.currentGoal || '').toLowerCase();
    if (!goal || goal === 'maintenance' || goal.includes('health') || goal.includes('general')) return true;
    // Fallback — if no other goal state triggered
    return false;
  },
};

/**
 * Resolve active states for the user based on their profile and current context.
 * States are sorted by priority (medical > recovery > goal > fallback).
 */
export function resolveStates(profile: HealthProfile, context: StateContext): ResolvedState {
  const evaluations: StateEval[] = STATE_PROMPTS.map(sp => ({
    id: sp.id,
    active: triggers[sp.id](profile, context),
    priority: sp.priority,
  }));

  const active = evaluations
    .filter(e => e.active)
    .sort((a, b) => b.priority - a.priority);

  if (active.length === 0) {
    // Fallback to maintenance
    const maintenance = STATE_PROMPTS.find(s => s.id === 'maintenance')!;
    return {
      primary: 'maintenance',
      secondary: [],
      allActive: ['maintenance'],
      labels: [maintenance.label],
      prompt: maintenance.prompt,
    };
  }

  const primary = active[0];
  const secondary = active.slice(1).filter(s => s.id !== primary.id);

  // Build the combined prompt
  let combinedPrompt = getStatePrompt(primary.id);

  // Append secondary state modifiers if they have high priority (>50)
  for (const s of secondary) {
    if (s.priority > 50) {
      combinedPrompt += `\n\nADDITIONAL CONTEXT — ${getStateLabel(s.id)}:\n${getStatePrompt(s.id)}`;
    }
  }

  return {
    primary: primary.id,
    secondary: secondary.map(s => s.id),
    allActive: active.map(s => s.id),
    labels: active.map(s => getStateLabel(s.id)),
    prompt: combinedPrompt,
  };
}

/**
 * Get a human-readable summary of active states for UI display.
 */
export function getStateSummary(resolved: ResolvedState): string {
  return resolved.labels.join(' + ');
}

/**
 * Check if any medical states are active (requires extra caution).
 */
export function hasMedicalState(resolved: ResolvedState): boolean {
  const medicalStates: StateId[] = ['ckd', 'lupus'];
  return resolved.allActive.some(s => medicalStates.includes(s));
}

/**
 * Get the "most conservative" state priority for methodology selection.
 * Used to determine which coaching methodology is safe.
 */
export function getConservativePriority(resolved: ResolvedState): number {
  return STATE_PROMPTS.find(s => s.id === resolved.primary)?.priority || 0;
}
