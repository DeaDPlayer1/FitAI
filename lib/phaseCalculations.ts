export type Gender = 'male' | 'female' | 'other';
export type Goal = 'fat_loss' | 'muscle_gain' | 'recomposition' | 'strength' | 'maintenance';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type CardioPreference = 'none' | 'low' | 'moderate' | 'high';
export type EquipmentAccess = 'gym' | 'home_full' | 'home_minimal' | 'none';
export type DietType = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian';

export interface ProfileInput {
  age: number;
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  goal: Goal;
  experience_level: ExperienceLevel;
  activity_level: ActivityLevel;
  available_days: number;
  equipment: EquipmentAccess;
  diet_type: DietType;
  sleep_hours: number;
  stress_level: 'low' | 'moderate' | 'high';
  cardio_preference: CardioPreference;
  injuries?: string;
}

export interface CalorieResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  deficit?: number;
  surplus?: number;
  explanation: string;
}

export interface TrainingDay {
  dayName: string;
  focus: string;
  muscleGroups: string[];
  exercises: string[];
  cardio?: string;
  estimatedMinutes: number;
  recoveryLoad: 'Low' | 'Moderate' | 'High';
  focusCue: string;
}

export interface SplitResult {
  splitType: string;
  days: TrainingDay[];
  weeklyVolumeLevel: string;
}

export interface WorkoutSetItem {
  name: string;
  sets: string;
  reps: string;
  rir: string;
  notes?: string;
}

export interface WorkoutDayDetail {
  dayName: string;
  focus: string;
  muscleGroup: string;
  sets: WorkoutSetItem[];
  cardio?: string;
  estimatedMinutes: number;
  recoveryLoad: 'Low' | 'Moderate' | 'High';
  focusCue: string;
}

/** Mifflin-St Jeor BMR */
export function calculateBMR(weight_kg: number, height_cm: number, age: number, gender: Gender): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
}

/** TDEE = BMR × activity multiplier */
export function calculateTDEE(bmr: number, activity_level: ActivityLevel): number {
  const multipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  return Math.round(bmr * multipliers[activity_level]);
}

/** Target calories based on goal */
export function calculateTargetCalories(
  tdee: number, bmr: number, goal: Goal
): { calories: number; deficit?: number; surplus?: number; explanation: string } {
  switch (goal) {
    case 'fat_loss':
      return {
        calories: tdee - 300,
        deficit: 300,
        explanation: `Moderate deficit of 300 kcal (${tdee} − 300 = ${tdee - 300}). Never below BMR of ${bmr}.`,
      };
    case 'muscle_gain':
      return {
        calories: tdee + 300,
        surplus: 300,
        explanation: `Clean surplus of 300 kcal (${tdee} + 300 = ${tdee + 300}). Enough for muscle growth without excess fat gain.`,
      };
    case 'recomposition':
      return {
        calories: tdee,
        explanation: `Maintenance calories (TDEE = ${tdee}). Recomposition works best at or near maintenance with high protein.`,
      };
    case 'strength':
      return {
        calories: tdee + 200,
        surplus: 200,
        explanation: `Mild surplus of 200 kcal (${tdee} + 200 = ${tdee + 200}). Fuels strength gains without unnecessary bulk.`,
      };
    case 'maintenance':
      return {
        calories: tdee,
        explanation: `Maintenance level (TDEE = ${tdee}). Holding steady while focusing on performance.`,
      };
  }
}

/** Macro split based on goal */
export function calculateMacros(
  targetCalories: number, weight_kg: number, goal: Goal, protein_g?: number
): { proteinG: number; fatG: number; carbsG: number } {
  let proteinG: number;
  let fatRatio: number;

  switch (goal) {
    case 'fat_loss':
      proteinG = Math.round(2.2 * weight_kg);
      fatRatio = 0.28;
      break;
    case 'muscle_gain':
      proteinG = Math.round(2.0 * weight_kg);
      fatRatio = 0.28;
      break;
    case 'recomposition':
      proteinG = Math.round(2.4 * weight_kg);
      fatRatio = 0.25;
      break;
    case 'strength':
      proteinG = Math.round(1.8 * weight_kg);
      fatRatio = 0.28;
      break;
    default:
      proteinG = Math.round(2.0 * weight_kg);
      fatRatio = 0.25;
  }

  if (protein_g) proteinG = protein_g;

  const proteinCals = proteinG * 4;
  const fatCals = Math.round(targetCalories * fatRatio);
  const fatG = Math.round(fatCals / 9);
  const carbsCals = targetCalories - proteinCals - fatCals;
  const carbsG = Math.round(carbsCals / 4);

  return { proteinG, fatG, carbsG: Math.max(carbsG, 0) };
}

/** Full calculation pipeline */
export function calculateFullPlan(input: ProfileInput): CalorieResult {
  const bmr = calculateBMR(input.weight_kg, input.height_cm, input.age, input.gender);
  const tdee = calculateTDEE(bmr, input.activity_level);
  const { calories: targetCalories, deficit, surplus, explanation } =
    calculateTargetCalories(tdee, bmr, input.goal);
  const { proteinG, fatG, carbsG } = calculateMacros(targetCalories, input.weight_kg, input.goal);

  return {
    bmr, tdee, targetCalories,
    targetProteinG: proteinG,
    targetCarbsG: carbsG,
    targetFatG: fatG,
    deficit, surplus, explanation,
  };
}

/** Select optimal split based on decision tree */
export function selectSplit(input: ProfileInput): string {
  const { available_days, experience_level, goal } = input;

  if (experience_level === 'beginner' && available_days >= 4) return 'Full Body × 3';

  switch (available_days) {
    case 2: return 'Full Body × 2';
    case 3: return goal === 'strength' || experience_level === 'beginner' ? 'Full Body × 3' : 'Push / Pull / Legs';
    case 4: {
      if (experience_level === 'beginner') return 'Upper / Lower × 4';
      if (goal === 'muscle_gain' && experience_level === 'intermediate') return 'PPL + Upper specialization';
      if (goal === 'recomposition') return 'Push / Pull / Legs / Arms+Shoulders';
      return 'Upper / Lower × 4';
    }
    case 5: return experience_level === 'advanced' ? 'PPL + Upper + Specialization' : 'PPL / Upper / Lower';
    case 6: return 'PPL × 2 (High frequency hypertrophy)';
    default: return 'Full Body × 3';
  }
}

/** Volume & intensity rules based on experience and recovery */
export function calculateVolume(
  experience_level: ExperienceLevel,
  sleep_hours: number,
  stress_level: string,
  goal: Goal
): { setsPerExercise: string; repRange: string; rirTarget: string; volumeReduction: number } {
  let setsPerExercise: string;
  let repRange: string;
  let rirTarget: string;
  let volumeReduction = 0;

  switch (experience_level) {
    case 'beginner':
      setsPerExercise = '1–2';
      repRange = '8–12';
      rirTarget = '2–3 RIR';
      break;
    case 'intermediate':
      setsPerExercise = '2–3';
      repRange = '6–10';
      rirTarget = '1–2 RIR';
      break;
    case 'advanced':
      setsPerExercise = '3–4';
      repRange = '5–10';
      rirTarget = '0–1 RIR';
      break;
  }

  if (goal === 'strength') {
    repRange = '3–6';
    rirTarget = '1–2 RIR';
  }

  if (sleep_hours < 6 || stress_level === 'high') {
    volumeReduction = 25;
    setsPerExercise = experience_level === 'advanced' ? '2–3' : '1–2';
  }

  return { setsPerExercise, repRange, rirTarget, volumeReduction };
}

/** Cardio recommendation based on goal + preference */
export function recommendCardio(goal: Goal, cardio_preference: CardioPreference): string {
  if (goal === 'muscle_gain' || goal === 'strength') {
    return 'Minimal: < 2x 20 min zone 2 per week. Prioritize 8,000–10,000 daily steps.';
  }

  if (goal === 'recomposition') {
    return '2–3x 20–25 min zone 2 cardio. 8,000+ steps daily.';
  }

  if (goal === 'fat_loss') {
    switch (cardio_preference) {
      case 'none': return '10–15 min light walking post-workout only. Deficit does the work.';
      case 'low': return '2x 15–20 min steady state per week.';
      case 'moderate': return '2–3x 20–30 min steady state OR 15 min HIIT per week.';
      case 'high': return '4x 30 min zone 2 + 1x 15 min HIIT per week.';
    }
  }

  return '2–3x 20 min zone 2 per week.';
}

/** Injury overrides for exercise selection */
export function getInjuryReplacements(injury: string): string[] {
  const map: Record<string, string[]> = {
    knee: ['Leg curl', 'Romanian deadlift', 'Leg extension (light)', 'Step-ups (low box)'],
    shoulder: ['Cable lateral raise', 'Machine chest press', 'Face pull', 'Incline dumbbell press (neutral grip)'],
    back: ['Cable row', 'Lat pulldown', 'RD with light weight', 'Hyperextension'],
    wrist: ['Hammer curl', 'Dumbbell press (neutral grip)', 'Cable curl', 'Push-up on fists or handles'],
    neck: ['Avoid heavy shrugs', 'Trap bar carries', 'Band pull-apart'],
    hip: ['Belt squat', 'Hip thrust', 'Cable pull-through', 'Step-ups'],
  };

  for (const [key, replacements] of Object.entries(map)) {
    if (injury.toLowerCase().includes(key)) return replacements;
  }
  return ['Consult your physiotherapist for specific replacements'];
}

/** Format nutrition output */
export function formatNutritionOutput(
  calories: number, proteinG: number, carbsG: number, fatG: number,
  diet_type: DietType
): string {
  const proteinSources = diet_type === 'vegetarian' || diet_type === 'vegan' || diet_type === 'eggetarian'
    ? 'tofu, paneer, legumes, whey (if acceptable), Greek yogurt, eggs'
    : 'eggs, chicken, fish, whey';

  const mealDistribution = proteinG > 0
    ? Math.round(proteinG / 5)
    : 0;

  return [
    '🧮 YOUR DAILY NUTRITION TARGETS',
    `Calories:  ${calories} kcal`,
    `Protein:   ${proteinG}g  (~${mealDistribution}g per meal × 5 meals)`,
    `Carbs:     ${carbsG}g`,
    `Fats:      ${fatG}g`,
    '',
    'Suggested meal timing:',
    '- Pre-workout: Carbs + Protein (e.g., rice + chicken)',
    '- Post-workout: Protein priority (e.g., whey + banana)',
    '- Before bed: Slow protein (e.g., paneer, Greek yogurt, eggs)',
    '',
    `Primary protein sources: ${proteinSources}`,
    'Hydration: 3–4L water per day',
  ].join('\n');
}

/** Determine recovery load flag */
export function calculateRecoveryFlag(sleep_hours: number, stress_level: string): 'good' | 'fair' | 'poor' {
  if (sleep_hours < 6 || stress_level === 'high') return 'poor';
  if (sleep_hours < 7 || stress_level === 'moderate') return 'fair';
  return 'good';
}
