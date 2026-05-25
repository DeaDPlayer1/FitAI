import { groqJSON, groqChat, groqChatRaw } from './groq';

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealLog {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
}

/**
 * Analyze an image of food using Groq Vision.
 */
export async function analyzeFoodImage(imageUrl: string): Promise<MealLog> {
  const now = new Date();
  const hour = now.getHours();
  const autoMealType = hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 19 ? 'snack' : 'dinner';

  const prompt = `Analyze this food image and provide detailed nutritional data. 
Identify all visible food items, estimate their portions, and calculate macros.

Return ONLY valid JSON matching this structure:
{
  "items": [
    {
      "name": "string",
      "quantity": "string",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "mealType": "${autoMealType}",
  "timestamp": "${now.toISOString()}"
}`;

  // Groq Vision requires a specific message format
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ];

  const raw = await groqChatRaw(
    messages as any, 
    'meta-llama/llama-4-scout-17b-16e-instruct' as any,
    4000
  );
  
  // Clean potential markdown wrappers
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  
  return JSON.parse(cleaned);
}

/**
 * Parse a natural language food description into structured macro data.
 */
export async function parseFoodInput(description: string): Promise<MealLog> {
  const now = new Date();
  const hour = now.getHours();
  const autoMealType = hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 19 ? 'snack' : 'dinner';

  const prompt = `You are a nutrition expert. Parse this food description into detailed macro data.
Use Indian/regional food knowledge when applicable.

Food description: "${description}"

Return ONLY valid JSON matching this structure:
{
  "items": [
    {
      "name": "Roti (whole wheat)",
      "quantity": "2 pieces",
      "calories": 210,
      "protein": 6,
      "carbs": 42,
      "fat": 3,
      "fiber": 4
    }
  ],
  "totalCalories": 210,
  "totalProtein": 6,
  "totalCarbs": 42,
  "totalFat": 3,
  "mealType": "${autoMealType}",
  "timestamp": "${now.toISOString()}"
}

Be accurate with calorie and macro estimates. Use standard serving sizes.
The totals should be the sum of all items.`;

  return groqJSON<MealLog>(prompt);
}

/**
 * Get AI-powered meal suggestions based on remaining macros and health profile.
 */
export async function getMealSuggestion(
  remainingCalories: number,
  remainingProtein: number,
  conditions: string[],
  mealType: string
): Promise<string> {
  const conditionNote = conditions.length > 0
    ? `User has: ${conditions.join(', ')}. Adapt suggestions accordingly (e.g., low sodium for hypertension, low GI for diabetes).`
    : '';

  const prompt = `Suggest a ${mealType} meal that fits these remaining macros:
- Calories: ~${remainingCalories} kcal
- Protein: ~${remainingProtein}g needed
${conditionNote}

Give 2-3 quick meal ideas with approximate macros. Keep it brief and practical.
Prefer Indian food options but include variety.`;

  return groqChat(
    'You are FitAI Nutritionist. Give brief, practical meal suggestions. Use bullet points.',
    prompt
  );
}
