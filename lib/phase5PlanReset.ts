import { classifyMessage, type UserMessageType } from './phase3ActiveCoach';
import { buildOpeningMessage, getNextQuestions, isOnboardingComplete, buildCompletionMessage } from './phase1Onboarding';

export interface ResetResult {
  detected: boolean;
  reason?: string;
  newGoal?: string;
  existingProfile: boolean;
  fieldsToReAsk: string[];
  transitionMessage: string;
}

const RESET_TRIGGERS = [
  /switch\s+to\s+(bulking|cutting|recomp|maintenance)/i,
  /change\s+(my\s+)?(goal|plan|program|routine)/i,
  /(start\s+over|reset|restart)/i,
  /new\s+(goal|plan|program|routine|approach)/i,
  /(want|like|thinking).*(new|different|change)/i,
  /(stop|pause).*(current|this).*(plan|program)/i,
];

const GOAL_EXTRACTION = [
  { pattern: /bulk(ing)?|muscle\s+gain|grow/i, goal: 'muscle_gain' },
  { pattern: /cut(ting)?|fat\s+loss|lose\s+weight|shred/i, goal: 'fat_loss' },
  { pattern: /recomp|recomposition/i, goal: 'recomposition' },
  { pattern: /strength|strong(er)?|power/i, goal: 'strength' },
  { pattern: /maintain|maintenance|hold/i, goal: 'maintenance' },
];

/** Detect if the user wants to change their plan/goal */
export function detectPlanReset(userMessage: string): { detected: boolean; newGoal?: string } {
  const lower = userMessage.toLowerCase();
  const matched = RESET_TRIGGERS.some(p => p.test(lower));
  if (!matched) return { detected: false };

  let newGoal: string | undefined;
  for (const { pattern, goal } of GOAL_EXTRACTION) {
    if (pattern.test(lower)) {
      newGoal = goal;
      break;
    }
  }

  return { detected: true, newGoal };
}

/** Build the transition message for goal change */
export function buildResetTransitionMessage(newGoal?: string): string {
  const goalLine = newGoal
    ? `I see you want to shift toward **${newGoal.replace('_', ' ')}**.`
    : 'I see you want to change direction.';

  return [
    `Got it — shifting gears. ${goalLine}`,
    '',
    'Before I build a new plan, let me confirm a couple things so I don\'t start from scratch unnecessarily.',
    '',
    'What\'s changed? Any updates to your weight, schedule, or something else?',
  ].join('\n');
}

/** Run full reset detection + transition */
export function runPlanReset(
  userMessage: string,
  profile: Record<string, unknown>,
  hasActivePlan: boolean,
): ResetResult | null {
  const { detected, newGoal } = detectPlanReset(userMessage);
  if (!detected) return null;

  const existingProfile = Object.values(profile).some(v => v !== null && v !== undefined && v !== '');

  const fieldsToReAsk: string[] = [];
  if (newGoal === 'muscle_gain' || newGoal === 'fat_loss') {
    if (!profile.weight) fieldsToReAsk.push('weight');
  }

  return {
    detected: true,
    reason: newGoal ? `Goal change to ${newGoal}` : 'Plan reset requested',
    newGoal,
    existingProfile,
    fieldsToReAsk,
    transitionMessage: buildResetTransitionMessage(newGoal),
  };
}
