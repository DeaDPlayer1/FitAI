import { groqChat, groqJSON } from './groq';
import { HealthProfile } from './auth';

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g. "8-12" or "30 sec"
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

/**
 * Generate a personalized weekly workout plan using Groq AI.
 * The plan adapts to the user's health conditions, goal, and fitness level.
 */
export async function generateWorkoutPlan(
  healthProfile: HealthProfile,
  preferences?: { daysPerWeek?: number; equipmentAccess?: string; customInstructions?: string }
): Promise<WeeklyPlan> {
  const conditionWarnings = healthProfile.conditions.length > 0
    ? `CRITICAL: User has these medical conditions: ${healthProfile.conditions.join(', ')}. 
       You MUST adapt exercises to be safe.`
    : 'No medical conditions reported.';

  const refinementNote = preferences?.customInstructions 
    ? `CRITICAL INSTRUCTION: The user has provided a SPECIFIC workout or request: "${preferences.customInstructions}". 
       You MUST parse this exactly as provided. If this text describes a single workout (e.g. 1 day upper body), return EXACTLY ONE day in the weeklyPlan array. IGNORE the default "Days per week" below.`
    : '';

  const prompt = `You are an expert fitness coach creating a structured workout plan.

USER PROFILE:
- Goal: ${healthProfile.goal || 'general fitness'}
- Age: ${healthProfile.age || 'unknown'}
- Default Days per week: ${preferences?.daysPerWeek || 4}
- Equipment: ${preferences?.equipmentAccess || 'full gym'}

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
}

/**
 * Chat with the AI coach — ask questions about form, nutrition, substitutions, etc.
 */
export async function askCoach(
  question: string,
  healthProfile: HealthProfile,
  currentPlan?: WeeklyPlan
): Promise<string> {
  const context = currentPlan
    ? `The user is following this plan: "${currentPlan.planSummary}" with ${currentPlan.weeklyPlan.length} days/week.`
    : 'The user does not have a workout plan yet.';

  const conditions = healthProfile.conditions.length > 0
    ? `Medical conditions: ${healthProfile.conditions.join(', ')}. Always consider safety.`
    : '';

  const systemPrompt = `You are FitAI Coach, a knowledgeable and motivating fitness coach.
${context}
${conditions}
User profile: ${healthProfile.goal} goal, ${healthProfile.age} years old, ${healthProfile.weight}${healthProfile.weightUnit}.

Rules:
- Be concise but helpful (max 3-4 sentences)
- If user asks about exercises, give form tips
- If user asks about diet, give macro-aware advice
- Always consider their medical conditions
- Be encouraging and positive
- Use emojis sparingly`;

  return groqChat(systemPrompt, question);
}
