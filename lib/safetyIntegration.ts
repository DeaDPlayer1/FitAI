import { groqChatRaw } from './groq';
import { validateResponse, type ValidationInput, type SafetyResult } from './safetyEngine';
import type { CoachContextInput, CoachResponse } from './aiTrainer';

export interface SafetyPipelineResult {
  validated: boolean;
  safetyResult: SafetyResult;
  finalContent: string;
  warnings: string[];
}

export async function runSafetyPipeline(
  rawResponse: string,
  context: CoachContextInput,
  chatHistory?: { role: string; content: string }[]
): Promise<SafetyPipelineResult> {
  const conditions = context.profile.conditions || [];

  const validationInput: ValidationInput = {
    response: rawResponse,
    userConditions: conditions,
    userAge: context.profile.age || undefined,
    userWeight: context.profile.weight || undefined,
    userWeightUnit: context.profile.weightUnit || undefined,
    recentAdvice: chatHistory?.filter(m => m.role === 'assistant').map(m => m.content),
    currentGoals: context.nutritionStatus
      ? { calories: context.nutritionStatus.calorieGoal }
      : undefined,
  };

  const safetyResult = validateResponse(validationInput);
  const { action, fallbackMessage, warnings } = safetyResult;

  let finalContent: string;
  const warningMessages: string[] = [];

  switch (action) {
    case 'refuse':
      finalContent = fallbackMessage || 'I cannot safely respond to this request. Please consult your healthcare provider.';
      break;
    case 'fallback':
      finalContent = fallbackMessage || 'I cannot safely respond to this request. Please consult your healthcare provider.';
      break;
    case 'caveat':
      finalContent = conditions.length > 0
        ? `${rawResponse}\n\n*This guidance is based on general principles. Individual responses vary — monitor how you feel and adjust accordingly. Consult your healthcare provider for personalized medical advice.*`
        : rawResponse;
      break;
    default:
      finalContent = rawResponse;
  }

  for (const w of warnings) {
    if (w.severity === 'high' || w.severity === 'critical') {
      warningMessages.push(w.message);
    }
  }

  return {
    validated: safetyResult.safe,
    safetyResult,
    finalContent,
    warnings: warningMessages,
  };
}
