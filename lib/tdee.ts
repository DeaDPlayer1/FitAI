export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type GoalType = 'lose' | 'maintain' | 'gain';
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'ft';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { title: string; desc: string }> = {
  sedentary: { title: 'Sedentary', desc: 'Little or no exercise, desk job' },
  light: { title: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  moderate: { title: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
  active: { title: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
  very_active: { title: 'Extra Active', desc: 'Very hard exercise, physical job' },
};

export function toCm(height: number, unit: HeightUnit): number {
  return unit === 'ft' ? height * 30.48 : height;
}

export function toKg(weight: number, unit: WeightUnit): number {
  return unit === 'lbs' ? weight * 0.453592 : weight;
}

export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(
  gender: Gender,
  weight: number,
  weightUnit: WeightUnit,
  height: number,
  heightUnit: HeightUnit,
  age: number,
  activityLevel: ActivityLevel,
): number {
  const weightKg = toKg(weight, weightUnit);
  const heightCm = toCm(height, heightUnit);
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel]);
}

export type WeeklyPace = '0.25' | '0.5' | '1' | '1.5' | '2';

export const PACE_DEFICITS: Record<WeeklyPace, number> = {
  '0.25': 250,
  '0.5': 500,
  '1': 750,
  '1.5': 1000,
  '2': 1250,
};

export const PACE_LABELS: Record<GoalType, Record<WeeklyPace, string>> = {
  lose: {
    '0.25': '0.25 kg/week (slow)',
    '0.5': '0.5 kg/week (recommended)',
    '1': '1 kg/week',
    '1.5': '1.5 kg/week',
    '2': '2 kg/week (aggressive)',
  },
  maintain: {
    '0.25': 'Maintain',
    '0.5': 'Maintain',
    '1': 'Maintain',
    '1.5': 'Maintain',
    '2': 'Maintain',
  },
  gain: {
    '0.25': 'Mild gain (0.25 kg/week)',
    '0.5': 'Moderate gain (0.5 kg/week)',
    '1': 'Steady gain (1 kg/week)',
    '1.5': 'Aggressive gain',
    '2': 'Very aggressive gain',
  },
};

export const GAIN_SURPLUSES: Record<WeeklyPace, number> = {
  '0.25': 200,
  '0.5': 350,
  '1': 500,
  '1.5': 700,
  '2': 900,
};

export function calculateTargetCalories(
  tdee: number,
  goal: GoalType,
  pace: WeeklyPace,
): number {
  if (goal === 'lose') return Math.max(1200, tdee - PACE_DEFICITS[pace]);
  if (goal === 'gain') return tdee + GAIN_SURPLUSES[pace];
  return tdee;
}

export interface TDEResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export function calculateAll(
  gender: Gender,
  weight: number,
  weightUnit: WeightUnit,
  height: number,
  heightUnit: HeightUnit,
  age: number,
  activityLevel: ActivityLevel,
  goal: GoalType,
  pace: WeeklyPace,
): TDEResult {
  const weightKg = toKg(weight, weightUnit);
  const heightCm = toCm(height, heightUnit);
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = Math.round(bmr * ACTIVITY_FACTORS[activityLevel]);
  const targetCalories = calculateTargetCalories(tdee, goal, pace);

  const proteinG = Math.round(weightKg * 1.6);
  const fatG = Math.round((targetCalories * 0.25) / 9);
  const carbsG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4);
  const fiberG = Math.max(25, Math.round(targetCalories / 1000 * 14));

  return { bmr, tdee, targetCalories, proteinG, carbsG, fatG, fiberG };
}
