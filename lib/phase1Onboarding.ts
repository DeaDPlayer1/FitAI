import type {
  Goal, ExperienceLevel, ActivityLevel, CardioPreference,
  EquipmentAccess, DietType, Gender,
} from './phaseCalculations';
import { defaultHealthProfile } from './auth';

export type OnboardingField =
  | 'goal' | 'weight' | 'targetWeight' | 'height' | 'age' | 'gender'
  | 'experience_level' | 'available_days' | 'equipment' | 'diet_type'
  | 'injuries' | 'sleep_hours' | 'stress_level' | 'cardio_preference'
  | 'weak_muscle_groups' | 'favorite_exercises';

export interface OnboardingState {
  collected: Partial<Record<OnboardingField, unknown>>;
  asked: Set<OnboardingField>;
  completed: boolean;
  currentQuestionIndex: number;
}

const QUESTION_PRIORITY: OnboardingField[] = [
  'goal', 'weight', 'targetWeight', 'height', 'age', 'gender',
  'experience_level', 'available_days', 'equipment', 'diet_type',
  'injuries', 'sleep_hours', 'stress_level', 'cardio_preference',
  'weak_muscle_groups', 'favorite_exercises',
];

const FIELD_TO_PROFILE: Record<OnboardingField, string> = {
  goal: 'goal',
  weight: 'weight',
  targetWeight: 'targetWeight',
  height: 'height',
  age: 'age',
  gender: 'gender',
  experience_level: 'experience_level',
  available_days: 'available_days',
  equipment: 'equipment',
  diet_type: 'diet_type',
  injuries: 'injuries',
  sleep_hours: 'sleep_hours',
  stress_level: 'stress_level',
  cardio_preference: 'cardio_preference',
  weak_muscle_groups: 'weak_muscle_groups',
  favorite_exercises: 'favorite_exercises',
};

const QUESTIONS: Record<OnboardingField, string> = {
  goal: "What's your main fitness goal right now? Fat loss, muscle gain, recomposition, strength, or maintenance?",
  weight: "What's your current bodyweight?",
  targetWeight: "Do you have a target weight in mind?",
  height: "And what's your height?",
  age: "How old are you?",
  gender: "And your gender?",
  experience_level: "How long have you been training seriously? (Beginner / Intermediate / Advanced)",
  available_days: "How many days a week can you realistically train?",
  equipment: "Are you training at a gym, or at home? What equipment do you have?",
  diet_type: "Any dietary preference? Vegetarian, non-veg, vegan, or eggetarian?",
  injuries: "Any injuries or body parts I should be careful with?",
  sleep_hours: "How many hours of sleep do you get on average?",
  stress_level: "How would you rate your daily stress? Low, medium, or high?",
  cardio_preference: "Do you enjoy cardio, or would you rather keep it minimal?",
  weak_muscle_groups: "Any muscle group you feel is lagging or weaker than the rest?",
  favorite_exercises: "Any exercises you absolutely love — or hate?",
};

/** Detect which profile fields are already known (from Phase 0 or DB) */
export function detectKnownFields(profile: Record<string, unknown>): Set<OnboardingField> {
  const known = new Set<OnboardingField>();
  for (const [field, profileKey] of Object.entries(FIELD_TO_PROFILE)) {
    const val = profile[profileKey];
    if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      known.add(field as OnboardingField);
    }
  }
  return known;
}

/** Determine which fields still need to be asked */
export function getMissingFields(
  knownFields: Set<OnboardingField>,
  askedFields: Set<OnboardingField>,
  collected: Partial<Record<OnboardingField, unknown>>
): OnboardingField[] {
  return QUESTION_PRIORITY.filter(
    (f) => !knownFields.has(f) && !askedFields.has(f) && !(f in collected)
  );
}

/** Smart parse user response into structured data */
export function parseUserResponse(text: string): Partial<Record<OnboardingField, string | number | boolean>> {
  const result: Partial<Record<OnboardingField, string | number | boolean>> = {};
  const lower = text.toLowerCase();

  const goalMap: Record<string, Goal> = {
    'fat loss': 'fat_loss', 'fat': 'fat_loss', 'lose weight': 'fat_loss', 'cut': 'fat_loss',
    'muscle gain': 'muscle_gain', 'gain muscle': 'muscle_gain', 'build muscle': 'muscle_gain', 'bulk': 'muscle_gain',
    'recomposition': 'recomposition', 'recomp': 'recomposition', 'body recomp': 'recomposition',
    'strength': 'strength', 'get stronger': 'strength', 'strong': 'strength',
    'maintenance': 'maintenance', 'maintain': 'maintenance', 'stay': 'maintenance',
  };
  for (const [key, val] of Object.entries(goalMap)) {
    if (lower.includes(key)) { result.goal = val; break; }
  }

  const expMap: Record<string, ExperienceLevel> = {
    'never': 'beginner', 'new': 'beginner', 'beginner': 'beginner', 'starting': 'beginner',
    'few months': 'beginner', 'year': 'intermediate', 'years': 'intermediate', 'intermediate': 'intermediate',
    'advanced': 'advanced', 'years seriously': 'advanced', 'long time': 'advanced',
  };
  for (const [key, val] of Object.entries(expMap)) {
    if (lower.includes(key)) { result.experience_level = val; break; }
  }

  const equipMap: Record<string, EquipmentAccess> = {
    'gym': 'gym', 'commercial gym': 'gym',
    'home gym': 'home_full', 'full home': 'home_full',
    'home': 'home_minimal', 'dumbbells': 'home_minimal', 'bands': 'home_minimal',
    'none': 'none', 'no equipment': 'none', 'bodyweight': 'none',
  };
  for (const [key, val] of Object.entries(equipMap)) {
    if (lower.includes(key)) { result.equipment = val; break; }
  }

  const dietMap: Record<string, DietType> = {
    'veg': 'vegetarian', 'vegetarian': 'vegetarian', 'plant': 'vegetarian',
    'non veg': 'non_vegetarian', 'non-veg': 'non_vegetarian', 'nonvegetarian': 'non_vegetarian', 'meat': 'non_vegetarian', 'chicken': 'non_vegetarian', 'fish': 'non_vegetarian',
    'vegan': 'vegan', 'plant based': 'vegan',
    'eggetarian': 'eggetarian', 'eggs': 'eggetarian', 'egg': 'eggetarian',
  };
  for (const [key, val] of Object.entries(dietMap)) {
    if (lower.includes(key)) { result.diet_type = val; break; }
  }

  const genderMap: Record<string, Gender> = {
    'male': 'male', 'man': 'male', 'guy': 'male',
    'female': 'female', 'woman': 'female', 'girl': 'female',
    'other': 'other', 'non-binary': 'other',
  };
  for (const [key, val] of Object.entries(genderMap)) {
    if (lower.includes(key)) { result.gender = val; break; }
  }

  const stressMap: Record<string, string> = {
    'low': 'low', 'not much': 'low', 'relaxed': 'low',
    'moderate': 'moderate', 'medium': 'moderate', 'okay': 'moderate', 'ok': 'moderate',
    'high': 'high', 'stressed': 'high', 'very': 'high', 'lot': 'high',
  };
  for (const [key, val] of Object.entries(stressMap)) {
    if (lower.includes(key)) { result.stress_level = val; break; }
  }

  const cardioMap: Record<string, CardioPreference> = {
    'none': 'none', 'hate': 'none', 'don\'t like': 'none', 'avoid': 'none',
    'low': 'low', 'minimal': 'low', 'little': 'low',
    'moderate': 'moderate', 'okay': 'moderate', 'fine': 'moderate', 'medium': 'moderate',
    'high': 'high', 'love': 'high', 'enjoy': 'high', 'like': 'high',
  };
  for (const [key, val] of Object.entries(cardioMap)) {
    if (lower.includes(key)) { result.cardio_preference = val; break; }
  }

  // Detect injury mentions
  const injuryKeywords = [
    'injury', 'injured', 'pain', 'hurt', 'knee', 'shoulder', 'back',
    'wrist', 'ankle', 'elbow', 'hip', 'neck',
  ];
  for (const kw of injuryKeywords) {
    if (lower.includes(kw)) {
      result.injuries = text;
      break;
    }
  }

  const daysMatch = lower.match(/(\d+)\s*days?/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    if (days >= 1 && days <= 7) result.available_days = days;
  }

  const weightMatch = lower.match(/(\d+[\.\d]*)\s*kgs?\b/i) || lower.match(/weight.*?(\d+[\.\d]*)/i);
  if (weightMatch && !result.goal) {
    result.weight = parseFloat(weightMatch[1]);
  }

  const sleepMatch = lower.match(/(\d+[\.\d]*)\s*hours?\s*(sleep|rest)?/i) || lower.match(/(\d+[\.\d]*)\s*h\s*(sleep)?/i);
  if (sleepMatch) {
    const h = parseFloat(sleepMatch[1]);
    if (h >= 1 && h <= 24) result.sleep_hours = h;
  }

  const ageMatch = lower.match(/(\d+)\s*(years?\s*old|yo|yrs?)/i);
  if (ageMatch) {
    const a = parseInt(ageMatch[1]);
    if (a >= 10 && a <= 120) result.age = a;
  }

  const heightMatch = lower.match(/(\d+[\.\d]*)\s*(cm|centimeters?)/i) ||
                       lower.match(/(\d+[\.\d]*)\s*(feet|ft)\s*(\d+[\.\d]*)\s*(inches|in)?/i);
  if (heightMatch) {
    if (heightMatch[2]?.toLowerCase() === 'cm' || heightMatch[2]?.toLowerCase() === 'centimeters') {
      result.height = parseFloat(heightMatch[1]);
    } else {
      const feet = parseFloat(heightMatch[1]);
      const inches = parseFloat(heightMatch[3] || '0');
      result.height = Math.round((feet * 30.48 + inches * 2.54) * 10) / 10;
    }
  }

  return result;
}

/** Build the next question(s) to ask — max 2 */
export function getNextQuestions(
  knownFields: Set<OnboardingField>,
  askedFields: Set<OnboardingField>,
  collected: Partial<Record<OnboardingField, unknown>>,
): string[] {
  const missing = getMissingFields(knownFields, askedFields, collected);

  if (missing.length === 0) return [];

  const toAsk = missing.slice(0, 2);
  return toAsk.map((f) => QUESTIONS[f]);
}

/** Check if all Phase 1 fields are complete */
export function isOnboardingComplete(
  knownFields: Set<OnboardingField>,
  collected: Partial<Record<OnboardingField, unknown>>
): boolean {
  const mandatory: OnboardingField[] = [
    'goal', 'weight', 'height', 'age', 'gender',
    'experience_level', 'available_days', 'equipment', 'diet_type',
    'injuries', 'sleep_hours', 'cardio_preference',
  ];
  return mandatory.every((f) => knownFields.has(f) || (f in collected));
}

/** Build the welcome / opening message based on known info */
export function buildOpeningMessage(
  name: string | null,
  knownFields: Set<OnboardingField>,
): string {
  if (knownFields.has('goal')) {
    return [
      `Hey ${name || 'there'}! 👋 I see you're going for improvement — smart choice.`,
      '',
      `I want to dig a bit deeper before I design your exact plan.`,
      `A few quick questions and we'll have something really dialed in for you.`,
    ].join('\n');
  }

  return [
    `Hey ${name || 'there'}! 💪 Great to have you here.`,
    '',
    `Before I build your plan, I want to make sure I actually understand your body, schedule, and goals — not just give you a generic template.`,
    '',
    `Let's start simple — what's the main thing you want to achieve right now? Fat loss, muscle gain, recomposition, or something else?`,
  ].join('\n');
}

/** Build the Phase 1 completion / transition message */
export function buildCompletionMessage(goal: string | undefined): string {
  return [
    `Okay, I've got a good picture of where you're at. Let me now build your personalized plan — I'll factor in your recovery, schedule, experience and goal to make sure this is actually optimized for you and not just some template.`,
    '',
    `Give me a second... 🔄`,
  ].join('\n');
}
