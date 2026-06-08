import { groqChat, groqJSON, groqChatRaw } from './groq';
import { HealthProfile } from './auth';
import { AI_TRAINER_SYSTEM_PROMPT } from '@/constants/aiTrainerSystemPrompt';
import { STATE_SHARED_BASE } from '@/constants/statePrompts';
import { resolveStates, getStateSummary, hasMedicalState, type StateContext } from './adaptiveStates';
import { validateResponse, type ValidationInput } from './safetyEngine';
import { classifyIntent, buildSubAgentContext } from './subAgentOrchestrator';
import { buildMemoryContext } from './memoryService';
import { runSafetyPipeline } from './safetyIntegration';
import type { ResolvedState } from './adaptiveStates';
import { phase0SystemBoot, buildPhase0Summary, buildPhase0Directives, type Phase0Result, type EntryPhase } from './phase0SystemBoot';
import { generatePlan, formatPlan, type GeneratedPlan } from './phase2PlanGenerator';
import { classifyMessage, getPhase3ResponseTemplate, type UserMessageType } from './phase3ActiveCoach';
import { runWeeklyCheckin, type WeeklyData, type WeeklyReviewResult } from './phase4WeeklyCheckin';
import { detectPlanReset, buildResetTransitionMessage } from './phase5PlanReset';
import { calculateFullPlan, formatNutritionOutput, selectSplit, calculateRecoveryFlag, type ProfileInput } from './phaseCalculations';
import { getMissingFields, parseUserResponse, detectKnownFields, isOnboardingComplete, buildOpeningMessage } from './phase1Onboarding';

const MAX_INPUT_TOKENS = 7000;
const CHARS_PER_TOKEN_ESTIMATE = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

function truncateChatToTokenLimit(
  chatHistory: { role: string; content: string }[],
  maxTokens: number = MAX_INPUT_TOKENS
): { role: string; content: string }[] {
  const reversed: { role: string; content: string }[] = [];
  let totalTokens = 0;
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(chatHistory[i].content) + 1;
    if (totalTokens + msgTokens > maxTokens) break;
    totalTokens += msgTokens;
    reversed.unshift(chatHistory[i]);
  }
  return reversed;
}

// ── Re-export existing types for backward compatibility ──
export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  warmup: string;
  exercises: Exercise[];
  cooldown: string;
  estimatedMinutes: number;
}

export interface WeeklyPlan {
  planSummary: string;
  weeklyVolume: string;
  conditionAdaptations: string[];
  weeklyPlan: WorkoutDay[];
}

// ── AI Trainer Types ──
export type AiTrainerPhase =
  | 'idle' | 'consultation' | 'plan_generated' | 'plan_active'
  | 'weekly_review' | 'plan_updated' | 'paused';

export interface ActivePlan {
  id: string;
  userId: string;
  version: number;
  weekNumber: number;
  phase: AiTrainerPhase;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  sodiumLimit: number;
  weeklyVolumeTarget: number;
  conditionAdaptations: string[];
  trainingSplitSummary: string;
  aiSummary: string;
  createdAt: string;
  appliedAt: string | null;
  safetyValidated: boolean;
  safetyNotes: string[];
}

// ── New types ──
export interface CoachContextInput {
  profile: HealthProfile;
  name?: string;
  nutritionStatus?: {
    calories: number;
    calorieGoal: number;
    protein: number;
    carbs: number;
    fat: number;
    mealsLogged: number;
  };
  workoutSplit?: string;
  recoveryContext?: StateContext;
  recentConversation?: { role: string; content: string }[];
  userId?: string;
  phase0?: Phase0Result;
  memoryOverride?: string;
}

export interface CoachResponse {
  content: string;
  state: ResolvedState;
  safetyValidated: boolean;
  confidence: number;
  warnings: string[];
  intent?: string;
}

export function buildUserProfileSummary(input: CoachContextInput): string {
  const { profile, name, nutritionStatus, workoutSplit } = input;
  return `- Name: ${name || 'User'}
- Goal: ${profile.goal || 'Not set'}
- Conditions: ${profile.conditions?.join(', ') || 'None reported'}
- Age: ${profile.age || 'Unknown'}
- Weight: ${profile.weight || 'Unknown'}${profile.weightUnit || 'kg'}
- Experience: Based on profile and conversation context
- Daily Nutrition: ${nutritionStatus ? `${nutritionStatus.calories} / ${nutritionStatus.calorieGoal} kcal, P${nutritionStatus.protein}g C${nutritionStatus.carbs}g F${nutritionStatus.fat}g` : 'Not available'}
- Workout Split: ${workoutSplit || 'Not configured'}`;
}

/**
 * Build the complete system context for the AI coach.
 * Composes: shared base + adaptive state prompt + user profile + nutrition + split + sub-agent context.
 */
export async function buildCoachContext(input: CoachContextInput, userMessage?: string): Promise<{ systemPrompt: string; state: ResolvedState }> {
  const { profile, name, nutritionStatus, workoutSplit, recoveryContext } = input;

  // Determine adaptive state(s)
  const state = resolveStates(profile, recoveryContext || {});

  const userProfileSummary = buildUserProfileSummary(input);

  // Gather memory context
  let memorySection = '';
  if (input.memoryOverride) {
    memorySection = input.memoryOverride;
  } else if (input.userId) {
    try {
      const memory = await buildMemoryContext(input.userId);
      memorySection = `
RECENT WORKOUTS:
${memory.recentWorkouts}

RECENT NUTRITION:
${memory.recentNutrition}

ACTIVE INJURIES:
${memory.activeInjuries}

ACTIVE CONDITIONS:
${memory.activeConditions}

TODAY'S CONTEXT:
${memory.latestContext}

CONTEXT TREND (7 days):
${memory.contextHistory}`;
    } catch {
      memorySection = 'Memory context unavailable.';
    }
  }

  // Build sub-agent context if we have a user message
  let subAgentSection = '';
  if (userMessage) {
    subAgentSection = buildSubAgentContext(userMessage, memorySection, userProfileSummary);
  }

  // Phase 0 — system boot & profile hydration
  const phase0Section = input.phase0 ? [
    '',
    buildPhase0Summary(input.phase0),
    '',
    buildPhase0Directives(input.phase0.entryPhase),
  ].join('\n') : '';

  // Compose the system prompt
  const systemPrompt = `${AI_TRAINER_SYSTEM_PROMPT}

${STATE_SHARED_BASE}

${state.prompt}

CURRENT USER PROFILE:
${userProfileSummary}

${nutritionStatus ? `
DAILY NUTRITION STATUS:
- Calorie goal: ${nutritionStatus.calorieGoal} kcal
- Consumed: ${nutritionStatus.calories} kcal (${nutritionStatus.calorieGoal > 0 ? Math.round(nutritionStatus.calories / nutritionStatus.calorieGoal * 100) : 0}% of goal)
- Protein: ${nutritionStatus.protein}g
- Carbs: ${nutritionStatus.carbs}g
- Fat: ${nutritionStatus.fat}g
- Meals logged today: ${nutritionStatus.mealsLogged}
` : ''}

WORKOUT SPLIT:
${workoutSplit || 'No active split configured'}

MEMORY CONTEXT:
${memorySection || 'No historical data available.'}

${subAgentSection}
${phase0Section}

ADAPTIVE STATE:
- Active AI State(s): ${getStateSummary(state)}
${hasMedicalState(state) ? '\n⚠️ MEDICAL STATE ACTIVE: All recommendations MUST follow the condition-specific rules above. Include a medical disclaimer.' : ''}

COACHING DIRECTIVES:
- You are Pulse AI — an elite fitness coach, nutrition advisor, and recovery specialist
- You are currently in "${getStateSummary(state)}" mode
- Adapt your tone, recommendations, and depth to this state
- Reference the user's name naturally
- Be science-based, premium, supportive, and non-judgmental
- Every response must consider the user's conditions, current state, and memory context
- PHASE RULES: Follow the Phase 0 entry phase instructions above strictly
- PHASE 1: Ask max 2 questions per message. Do NOT generate a plan during Phase 1. No CTA buttons.
- PHASE 3: If user completed a workout, ask how the weight/reps felt. If user asks to swap an exercise, suggest replacements. Do NOT change calories mid-week.
- PHASE 4: Weekly check-in mode. Analyze training, nutrition, recovery. Adjust calories/volume based on the data.
- PHASE 5: If user wants to reset, confirm the change, archive old plan, ask what's changed.
- Do NOT output JSON in your responses — respond conversationally.
- If a user provides data (weight, height, age, etc.), acknowledge it naturally.`;

  return { systemPrompt, state };
}

/**
 * Full coaching pipeline: build context → classify intent → call AI → safety pipeline → return.
 */
export async function getCoachResponse(
  userMessage: string,
  context: CoachContextInput,
  chatHistory?: { role: string; content: string }[]
): Promise<CoachResponse> {
  try {
    const { systemPrompt, state } = await buildCoachContext(context, userMessage);

    const systemTokens = estimateTokens(systemPrompt);
    const userMsgTokens = estimateTokens(userMessage);
    const remainingTokens = MAX_INPUT_TOKENS - systemTokens - userMsgTokens - 10;

    const truncatedHistory = truncateChatToTokenLimit(chatHistory || [], Math.max(remainingTokens, 100));
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...truncatedHistory.map(m => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const rawResponse = await groqChatRaw(messages, 'llama-3.3-70b-versatile');

    // Intent classification for metadata
    const intent = classifyIntent(userMessage);

    // Mandatory safety pipeline
    const { finalContent, warnings, safetyResult } = await runSafetyPipeline(
      rawResponse,
      context,
      chatHistory
    );

    return {
      content: finalContent,
      state,
      safetyValidated: safetyResult.safe,
      confidence: safetyResult.confidence,
      warnings,
      intent: intent.primary,
    };
  } catch (error) {
    console.error('[getCoachResponse] AI service error:', error);
    return {
      content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      state: { primary: 'maintenance', secondary: [], allActive: [], labels: [], prompt: '' },
      safetyValidated: false,
      confidence: 0,
      warnings: ['AI service unavailable'],
      intent: 'unknown',
    };
  }
}

// ── Backward-compatible wrappers ──

/**
 * Generate a personalized weekly workout plan using Groq AI.
 * Preserves original signature for existing callers.
 */
export async function generateWorkoutPlan(
  healthProfile: HealthProfile,
  preferences?: { daysPerWeek?: number; equipmentAccess?: string; customInstructions?: string }
): Promise<WeeklyPlan> {
  try {
    const conditionWarnings = healthProfile.conditions.length > 0
      ? `CRITICAL: User has these medical conditions: ${healthProfile.conditions.join(', ')}. 
         You MUST adapt exercises to be safe.`
      : 'No medical conditions reported.';

    const refinementNote = preferences?.customInstructions 
      ? `CRITICAL INSTRUCTION: The user has provided a SPECIFIC workout or request: "${preferences.customInstructions}". 
         You MUST parse this exactly as provided. If this text describes a single workout (e.g. 1 day upper body), return EXACTLY ONE day in the weeklyPlan array. IGNORE the default "Days per week" below.`
      : '';

    const state = resolveStates(healthProfile, {});

    const prompt = `You are an expert fitness coach creating a structured workout plan.
You are currently in "${getStateSummary(state)}" mode.

USER PROFILE:
- Goal: ${healthProfile.goal || 'general fitness'}
- Age: ${healthProfile.age || 'unknown'}
- Default Days per week: ${preferences?.daysPerWeek || 4}
- Equipment: ${preferences?.equipmentAccess || 'full gym'}
- Active AI State(s): ${getStateSummary(state)}

${refinementNote}

MEDICAL CONSIDERATIONS:
${conditionWarnings}

Return ONLY valid JSON matching this structure exactly. (If it's a 1-day workout, the array should have length 1):
{
  "planSummary": "string",
  "weeklyVolume": "string",
  "conditionAdaptations": ["string"],
  "weeklyPlan": [
    {
      "day": "string",
      "focus": "string",
      "warmup": "string",
      "exercises": [
        { "name": "string", "sets": number, "reps": "string", "restSeconds": number, "notes": "string" }
      ],
      "cooldown": "string",
      "estimatedMinutes": number
    }
  ]
}`;

    const plan = await groqJSON<WeeklyPlan>(prompt);
    return plan;
  } catch (error) {
    console.error('[generateWorkoutPlan] AI generation failed:', error);
    return {
      planSummary: 'Unable to generate plan at this time. Please try again.',
      weeklyVolume: 'N/A',
      conditionAdaptations: [],
      weeklyPlan: [],
    };
  }
}

/**
 * Chat with the AI coach (legacy interface, uses adaptive states internally).
 */
export async function askCoach(
  question: string,
  healthProfile: HealthProfile,
  currentPlan?: WeeklyPlan
): Promise<string> {
  const state = resolveStates(healthProfile, {});
  const planContext = currentPlan
    ? `The user is following this plan: "${currentPlan.planSummary}" with ${currentPlan.weeklyPlan.length} days/week.`
    : 'The user does not have a workout plan yet.';

  const systemPrompt = `${STATE_SHARED_BASE}

${state.prompt}

You are Pulse AI — a personalized fitness coach. You are in "${getStateSummary(state)}" mode.

${planContext}
User profile: ${healthProfile.goal || 'general'} goal, ${healthProfile.age || 'unknown'} years old, ${healthProfile.weight || 'unknown'}${healthProfile.weightUnit || 'kg'}.
Conditions: ${healthProfile.conditions?.join(', ') || 'None'}

Be concise but helpful (3-4 sentences). Always consider their medical conditions.`;

  return groqChat(systemPrompt, question);
}

// ── Phase module re-exports ───────────────────────────────────────────────────
export type { EntryPhase, Phase0Result } from './phase0SystemBoot';
export { phase0SystemBoot, buildPhase0Summary, buildPhase0Directives } from './phase0SystemBoot';
export { generatePlan, formatPlan } from './phase2PlanGenerator';
export type { GeneratedPlan } from './phase2PlanGenerator';
export { classifyMessage, getPhase3ResponseTemplate } from './phase3ActiveCoach';
export type { UserMessageType } from './phase3ActiveCoach';
export { runWeeklyCheckin } from './phase4WeeklyCheckin';
export type { WeeklyData, WeeklyReviewResult, NextWeekStrategy } from './phase4WeeklyCheckin';
export { detectPlanReset, buildResetTransitionMessage } from './phase5PlanReset';
export { calculateFullPlan, selectSplit, calculateRecoveryFlag, formatNutritionOutput } from './phaseCalculations';
export type { ProfileInput } from './phaseCalculations';
export { getMissingFields, parseUserResponse, detectKnownFields, isOnboardingComplete, buildOpeningMessage } from './phase1Onboarding';
export type { OnboardingField, OnboardingState } from './phase1Onboarding';
