import { WORKOUT_COACH_PROMPT } from '@/constants/prompts/workoutCoach';
import { NUTRITION_AI_PROMPT } from '@/constants/prompts/nutritionAI';
import { RECOVERY_AI_PROMPT } from '@/constants/prompts/recoveryAI';
import { HEALTH_AWARE_AI_PROMPT } from '@/constants/prompts/healthAwareAI';
import { HABIT_COACH_PROMPT } from '@/constants/prompts/habitCoach';
import { MOTIVATION_AI_PROMPT } from '@/constants/prompts/motivationAI';
import { WEEKLY_REPORT_AI_PROMPT } from '@/constants/prompts/weeklyReportAI';
import { PROGRESSION_AI_PROMPT } from '@/constants/prompts/progressionAI';

export type SubAgentId =
  | 'workout_coach'
  | 'nutrition_ai'
  | 'recovery_ai'
  | 'health_aware_ai'
  | 'habit_coach'
  | 'motivation_ai'
  | 'weekly_report_ai'
  | 'progression_ai';

export interface SubAgentConfig {
  id: SubAgentId;
  label: string;
  prompt: string;
  keywords: RegExp[];
  priority: number;
}

export const SUB_AGENTS: SubAgentConfig[] = [
  {
    id: 'workout_coach',
    label: 'Workout Coach',
    prompt: WORKOUT_COACH_PROMPT,
    keywords: [
      /workout|exercise|training|split|routine|reps?\s*sets?|periodiz|program|plan|session|gym|lift|push|pull|squat|bench|deadlift|progression|volume|intensity|rpe|rir|deload|muscle|hypertrophy|strength/i,
    ],
    priority: 3,
  },
  {
    id: 'nutrition_ai',
    label: 'Nutrition AI',
    prompt: NUTRITION_AI_PROMPT,
    keywords: [
      /diet|nutrition|meal|eat|food|calorie|protein|carbs?|fat|macro|vitamin|mineral|recipe|ingredient|supplement|meal\s*plan|fasting|keto|vegan|vegetarian|hydration|water|sodium|potassium|phosphorus/i,
    ],
    priority: 3,
  },
  {
    id: 'recovery_ai',
    label: 'Recovery AI',
    prompt: RECOVERY_AI_PROMPT,
    keywords: [
      /recovery|rest|sleep|hrv|fatigue|soreness|deload|rest\s*day|active\s*recovery|hrv|rhr|heart\s*rate|readiness|sleep|circadian|stress\s*management|breath|meditation|mobility|stretch/i,
    ],
    priority: 2,
  },
  {
    id: 'health_aware_ai',
    label: 'Health-Aware AI',
    prompt: HEALTH_AWARE_AI_PROMPT,
    keywords: [
      /condition|disease|ckd|kidney|lupus|sle|diabetes|hypertension|blood\s*pressure|medication|medicine|prescription|side\s*effect|contraindication|symptom|flare|inflammation|autoimmune|chronic|disclaimer|safe/i,
    ],
    priority: 5,
  },
  {
    id: 'habit_coach',
    label: 'Habit Coach',
    prompt: HABIT_COACH_PROMPT,
    keywords: [
      /habit|routine|consistency|adherence|motivation|discipline|procrastinat|skip|miss|start|begin|stick|behavior|change|goal\s*setting|track|streak|accountability/i,
    ],
    priority: 2,
  },
  {
    id: 'motivation_ai',
    label: 'Motivation AI',
    prompt: MOTIVATION_AI_PROMPT,
    keywords: [
      /motivat|discourag|burnout|frustrat|demotivat|tired\s*of|lazy|not\s*feeling\s*it|dread|dreading|guilt|slump|plateau|lack\s*of|struggling|difficult|hard\s*to\s*find/i,
    ],
    priority: 1,
  },
  {
    id: 'weekly_report_ai',
    label: 'Weekly Report AI',
    prompt: WEEKLY_REPORT_AI_PROMPT,
    keywords: [
      /weekly\s*report|week\s*in\s*review|summary|this\s*week|last\s*week|weekly\s*summary|weekly\s*roundup|progress\s*report|check.in|weekly\s*check/i,
    ],
    priority: 1,
  },
  {
    id: 'progression_ai',
    label: 'Progression AI',
    prompt: PROGRESSION_AI_PROMPT,
    keywords: [
      /long.?term|mesocycle|macrocycle|phase|block|periodiz|next\s*(3|6|12)\s*(month|week)|6.week|12.week|roadmap|trajectory|big\s*picture|progress\s*over\s*time|future\s*plan/i,
    ],
    priority: 2,
  },
];

export interface IntentResult {
  primary: SubAgentId;
  secondary: SubAgentId[];
  scores: Record<SubAgentId, number>;
}

export function classifyIntent(message: string): IntentResult {
  const scores: Record<string, number> = {};
  for (const agent of SUB_AGENTS) {
    let score = 0;
    for (const pattern of agent.keywords) {
      const matches = message.match(pattern);
      if (matches) {
        score += matches.length * agent.priority;
      }
    }
    scores[agent.id] = score;
  }

  const sorted = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a);

  const primary = sorted.length > 0 ? sorted[0][0] as SubAgentId : 'workout_coach';
  const secondary = sorted.slice(1, 3).map(([id]) => id as SubAgentId);

  return { primary, secondary, scores: scores as Record<SubAgentId, number> };
}

export function getAgentPrompts(agentIds: SubAgentId[]): string {
  return agentIds
    .map(id => {
      const agent = SUB_AGENTS.find(a => a.id === id);
      if (!agent) return '';
      return `\n=== ${agent.label.toUpperCase()} MODULE ===\n${agent.prompt}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

export function buildSubAgentContext(
  userMessage: string,
  memoryContext: string,
  userProfileSummary: string,
): string {
  const intent = classifyIntent(userMessage);

  const agentPrompts = getAgentPrompts([intent.primary, ...intent.secondary]);

  return `${agentPrompts}

USER PROFILE:
${userProfileSummary}

MEMORY CONTEXT:
${memoryContext}

COACHING DIRECTIVE:
The user's message has been classified under the "${intent.primary}" sub-agent.
${intent.secondary.length > 0 ? `Secondary context from: ${intent.secondary.map(id => SUB_AGENTS.find(a => a.id === id)?.label).join(', ')}` : ''}

Follow the guidelines in the activated sub-agent module(s). Integrate the user's profile and memory context naturally.`;
}
