export type ConditionType = 'ckd' | 'lupus' | 'diabetes_t1' | 'diabetes_t2' | 'hypertension' | 'none';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout';

export interface ConditionProtocol {
  condition: ConditionType;
  proteinMin: number;
  proteinMax: number;
  sodiumLimit: number;
  potassiumGuidance: 'restrict' | 'monitor' | 'normal';
  phosphorusGuidance: 'restrict' | 'monitor' | 'normal';
  fluidRestriction: boolean;
  antiInflammatoryEmphasis: boolean;
  warningFoods: string[];
  emphasisFoods: string[];
  specialRules: string[];
}

export interface NutritionCheck {
  condition: ConditionType;
  protocol: ConditionProtocol;
  issues: NutritionIssue[];
  overallScore: number;
  adjustedCalories: { min: number; max: number };
  adjustedProtein: { min: number; max: number };
  summary: string;
}

export interface NutritionIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  rule: string;
}

export interface MealAssessment {
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  potassium: number;
  phosphorus: number;
  fiber: number;
  foods: string[];
  bodyWeightKg?: number;
}

const PROTOCOLS: Record<ConditionType, ConditionProtocol> = {
  ckd: {
    condition: 'ckd',
    proteinMin: 0.55, proteinMax: 0.8,
    sodiumLimit: 2000,
    potassiumGuidance: 'restrict',
    phosphorusGuidance: 'restrict',
    fluidRestriction: false,
    antiInflammatoryEmphasis: false,
    warningFoods: ['banana', 'potato', 'avocado', 'dairy', 'nuts', 'cola', 'processed meat', 'canned soup'],
    emphasisFoods: ['berries', 'cabbage', 'cauliflower', 'garlic', 'onion', 'olive oil', 'fish'],
    specialRules: ['Never exceed 0.8g/kg protein', 'Limit phosphorus additives in processed foods', 'Monitor potassium with ACE/ARBs'],
  },
  lupus: {
    condition: 'lupus',
    proteinMin: 0.8, proteinMax: 1.2,
    sodiumLimit: 2300,
    potassiumGuidance: 'normal',
    phosphorusGuidance: 'normal',
    fluidRestriction: false,
    antiInflammatoryEmphasis: true,
    warningFoods: ['alfalfa', 'processed food', 'excessive sugar', 'fried food', 'red meat'],
    emphasisFoods: ['salmon', 'mackerel', 'sardine', 'walnut', 'flax', 'berry', 'leafy green', 'turmeric', 'ginger'],
    specialRules: ['Emphasize omega-3 fatty acids', 'Consider gluten/dairy elimination trial', 'Ensure vitamin D and calcium with corticosteroid use'],
  },
  diabetes_t1: {
    condition: 'diabetes_t1',
    proteinMin: 1.0, proteinMax: 1.5,
    sodiumLimit: 2300,
    potassiumGuidance: 'normal',
    phosphorusGuidance: 'normal',
    fluidRestriction: false,
    antiInflammatoryEmphasis: false,
    warningFoods: ['sugary drink', 'white bread', 'white rice', 'candy', 'pastry', 'juice'],
    emphasisFoods: ['whole grain', 'legume', 'non-starchy vegetable', 'lean protein', 'healthy fat'],
    specialRules: ['Consistent carbohydrate intake per meal', 'Protein with every meal to stabilize glucose', 'Pre-exercise carb timing critical', 'Adjust insulin for exercise intensity'],
  },
  diabetes_t2: {
    condition: 'diabetes_t2',
    proteinMin: 1.2, proteinMax: 1.6,
    sodiumLimit: 2300,
    potassiumGuidance: 'normal',
    phosphorusGuidance: 'normal',
    fluidRestriction: false,
    antiInflammatoryEmphasis: false,
    warningFoods: ['sugary drink', 'refined carb', 'processed snack', 'sweetened yogurt', 'white flour'],
    emphasisFoods: ['whole grain', 'legume', 'leafy green', 'berry', 'nuts', 'avocado', 'olive oil'],
    specialRules: ['Weight loss improves insulin sensitivity', 'Prioritize low glycemic index carbs', 'Resistance training improves glucose uptake', 'Morning exercise preferred for glucose control'],
  },
  hypertension: {
    condition: 'hypertension',
    proteinMin: 0.8, proteinMax: 1.2,
    sodiumLimit: 1500,
    potassiumGuidance: 'normal',
    phosphorusGuidance: 'normal',
    fluidRestriction: false,
    antiInflammatoryEmphasis: false,
    warningFoods: ['canned soup', 'processed meat', 'fast food', 'frozen dinner', 'salty snack', 'pickle'],
    emphasisFoods: ['leafy green', 'banana', 'potato', 'avocado', 'beet', 'yogurt', 'oatmeal'],
    specialRules: ['DASH diet framework recommended', 'Sodium <1500mg/day for BP reduction', 'Increase potassium-rich foods', 'Limit alcohol to 1 drink/day'],
  },
  none: {
    condition: 'none',
    proteinMin: 1.6, proteinMax: 2.2,
    sodiumLimit: 2300,
    potassiumGuidance: 'normal',
    phosphorusGuidance: 'normal',
    fluidRestriction: false,
    antiInflammatoryEmphasis: false,
    warningFoods: [],
    emphasisFoods: [],
    specialRules: ['General population guidelines apply'],
  },
};

export function getProtocolForCondition(conditions: string[]): ConditionProtocol[] {
  const mapped: ConditionType[] = conditions.map(c => {
    const lower = c.toLowerCase();
    if (lower.includes('ckd') || lower.includes('kidney')) return 'ckd';
    if (lower.includes('lupus') || lower.includes('sle')) return 'lupus';
    if (lower.includes('diabetes') || lower.includes('t1') || lower.includes('type 1')) return 'diabetes_t1';
    if (lower.includes('diabetes') || lower.includes('t2') || lower.includes('type 2') || lower.includes('prediabetes')) return 'diabetes_t2';
    if (lower.includes('hypertension') || lower.includes('high blood pressure')) return 'hypertension';
    return 'none';
  }).filter((v, i, a) => a.indexOf(v) === i) as ConditionType[];

  if (mapped.length === 0) mapped.push('none');
  return mapped.map(ct => PROTOCOLS[ct]);
}

export function checkMealAgainstCondition(meal: Partial<MealAssessment>, protocols: ConditionProtocol[]): NutritionCheck {
  const issues: NutritionIssue[] = [];
  let overallScore = 100;
  const bodyWeightKg = meal.bodyWeightKg ?? 70;

  const protein = meal.protein ?? 0;
  const sodium = meal.sodium ?? 0;
  const potassium = meal.potassium ?? 0;
  const phosphorus = meal.phosphorus ?? 0;

  const conservative = protocols.reduce((c, p) => ({
    proteinMax: Math.min(c.proteinMax, p.proteinMax),
    proteinMin: Math.max(c.proteinMin, p.proteinMin),
    sodiumLimit: Math.min(c.sodiumLimit, p.sodiumLimit),
    restrictK: c.restrictK || p.potassiumGuidance === 'restrict',
    restrictP: c.restrictP || p.phosphorusGuidance === 'restrict',
    antiInflammatory: c.antiInflammatory || p.antiInflammatoryEmphasis,
  }), {
    proteinMax: Infinity, proteinMin: 0, sodiumLimit: Infinity,
    restrictK: false, restrictP: false, antiInflammatory: false,
  });

  const proteinPerKg = bodyWeightKg > 0 ? protein / bodyWeightKg : 0;
  if (proteinPerKg > conservative.proteinMax) {
    issues.push({ severity: 'high', message: `Protein ${proteinPerKg.toFixed(2)}g/kg exceeds max ${conservative.proteinMax}g/kg`, rule: 'protein_limit' });
    overallScore -= 20;
  }

  if (sodium > conservative.sodiumLimit) {
    issues.push({ severity: 'high', message: `Sodium ${sodium}mg exceeds limit of ${conservative.sodiumLimit}mg`, rule: 'sodium_limit' });
    overallScore -= 15;
  }

  if (conservative.restrictK && potassium > 500) {
    issues.push({ severity: 'high', message: `Potassium ${potassium}mg may be high for this condition`, rule: 'potassium_restrict' });
    overallScore -= 10;
  }

  if (conservative.restrictP && phosphorus > 700) {
    issues.push({ severity: 'medium', message: `Phosphorus ${phosphorus}mg may be high`, rule: 'phosphorus_restrict' });
    overallScore -= 10;
  }

  // Check warning foods
  if (meal.foods) {
    const allWarningFoods = new Set(protocols.flatMap(p => p.warningFoods));
    for (const food of meal.foods) {
      for (const warning of allWarningFoods) {
        if (food.toLowerCase().includes(warning.toLowerCase())) {
          issues.push({ severity: 'low', message: `"${food}" may be a trigger food for your condition`, rule: 'warning_food' });
          overallScore -= 5;
        }
      }
    }
  }

  const adjCalMin = conservative.proteinMin * bodyWeightKg;
  const adjCalMax = conservative.proteinMax * bodyWeightKg;

  return {
    condition: 'none',
    protocol: protocols[0],
    issues,
    overallScore: Math.max(0, overallScore),
    adjustedCalories: { min: Math.round(adjCalMin * 10), max: Math.round(adjCalMax * 10) },
    adjustedProtein: { min: Math.round(conservative.proteinMin * bodyWeightKg), max: Math.round(conservative.proteinMax * bodyWeightKg) },
    summary: issues.length > 0
      ? `${issues.length} issue(s) found. Score: ${Math.max(0, overallScore)}/100. ${conservative.antiInflammatory ? 'Prioritize anti-inflammatory foods.' : ''}`
      : 'Meal appears compatible with your health conditions.',
  };
}

export function suggestedMacros(weightKg: number, goal: string, conditions: string[]): { calories: number; protein: number; carbs: number; fat: number } {
  const protocols = getProtocolForCondition(conditions);
  const conservative = protocols.reduce((c, p) => ({
    proteinMin: Math.max(c.proteinMin, p.proteinMin),
    proteinMax: Math.min(c.proteinMax, p.proteinMax),
  }), { proteinMin: 0, proteinMax: 100 });

  const baseCalories = weightKg * (goal === 'fat_loss' ? 25 : goal === 'muscle_gain' ? 35 : 30);
  const protein = Math.round(weightKg * conservative.proteinMax);
  const fat = Math.round(weightKg * 0.8);
  const carbs = Math.round((baseCalories - protein * 4 - fat * 9) / 4);

  return {
    calories: Math.round(baseCalories),
    protein,
    carbs: Math.max(0, carbs),
    fat: Math.max(0, fat),
  };
}
