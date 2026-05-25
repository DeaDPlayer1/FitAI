import { groqChatRaw } from './groq';
import { NUTRITION_SYSTEM_PROMPT } from '@/constants/nutritionSystemPrompt';

export interface NutritionAnalysisInput {
  meals: { name: string; calories: number; protein_g: number; carbs_g: number; fat_g: number }[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goals: { calories: number; protein: number; carbs: number; fat: number; water: number };
  userProfile: {
    name: string;
    age?: number | null;
    weight?: number | null;
    weightUnit?: string;
    conditions: string[];
    goal?: string | null;
  };
}

export async function analyzeNutrition(input: NutritionAnalysisInput): Promise<string> {
  const {
    meals, totals, goals, userProfile
  } = input;

  const mealDetails = meals.length > 0
    ? meals.map(m => `- ${m.name}: ${m.calories} kcal, P${m.protein_g}g / C${m.carbs_g}g / F${m.fat_g}g`).join('\n')
    : 'No meals logged yet today.';

  const conditionContext = userProfile.conditions.length > 0
    ? `\nMEDICAL CONSIDERATIONS:\nThe user has these conditions: ${userProfile.conditions.join(', ')}.\nAnalyze nutrition with these conditions in mind.`
    : '';

  const systemPrompt = `${NUTRITION_SYSTEM_PROMPT}
${conditionContext}

Your analysis should cover:
1. Calorie adherence vs goal
2. Protein quality and adequacy
3. Carbohydrate and fat balance
4. Meal quality and distribution
5. Hydration status
6. Recovery and workout support
7. Condition-specific nutrition guidance
8. Specific, actionable suggestions`;

  const nutritionContext = `NUTRITION ANALYSIS REQUEST for ${userProfile.name}

USER PROFILE:
- Age: ${userProfile.age || 'Unknown'}
- Weight: ${userProfile.weight || 'Unknown'} ${userProfile.weightUnit || 'kg'}
- Goal: ${userProfile.goal || 'General fitness'}
- Conditions: ${userProfile.conditions.length > 0 ? userProfile.conditions.join(', ') : 'None reported'}

DAILY NUTRITION GOALS:
- Calories: ${goals.calories} kcal
- Protein: ${goals.protein}g
- Carbs: ${goals.carbs}g
- Fat: ${goals.fat}g
- Water: ${goals.water} glasses

TODAY'S TOTALS:
- Calories: ${totals.calories} kcal (${Math.round(totals.calories / goals.calories * 100)}% of goal)
- Protein: ${totals.protein}g (${Math.round(totals.protein / goals.protein * 100)}% of goal)
- Carbs: ${totals.carbs}g (${Math.round(totals.carbs / goals.carbs * 100)}% of goal)
- Fat: ${totals.fat}g (${Math.round(totals.fat / goals.fat * 100)}% of goal)

LOGGED MEALS:
${mealDetails}

Please provide a premium, science-based nutrition analysis.`;

  try {
    const response = await groqChatRaw(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: nutritionContext },
      ],
      'llama-3.3-70b-versatile',
      1500
    );
    
    // Append safety disclaimer for users with conditions
    const hasConditions = userProfile.conditions && userProfile.conditions.length > 0;
    const hasDisclaimer = response.toLowerCase().includes('healthcare provider') || 
                          response.toLowerCase().includes('consult your');
    const safetySuffix = hasConditions && !hasDisclaimer
      ? '\n\n*This analysis is for informational purposes. Consult your healthcare provider for medical nutrition advice, especially given your health conditions.*'
      : '';
    
    return response + safetySuffix;
  } catch (e: any) {
    console.error('[nutritionAnalyzer] Error:', e);
    throw new Error('Unable to analyze nutrition at this time. Please try again.');
  }
}
