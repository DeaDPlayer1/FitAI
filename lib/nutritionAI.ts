import * as ImageManipulator from 'expo-image-manipulator';
import { groqChat, groqChatRaw } from './groq';
import { validateResponse } from './safetyEngine';
import type { ValidationInput } from './safetyEngine';
import { getDb } from './db';
import Fuse from 'fuse.js';
import foodDatabaseJson from '@/assets/food_database.json';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

// ── Exported Types ──

export interface NutritionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving: string;
}

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

interface FoodResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
  serving_grams: number;
  source: string;
}

// ── Helpers ──

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text;
}

function autoMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours();
  return hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 19 ? 'snack' : 'dinner';
}

// ── Image Preprocessing (MANDATORY before any Groq vision call) ──

export async function preprocessImage(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );
  if (!manipulated.base64) throw new Error('Image preprocessing failed');
  return manipulated.base64;
}

// ── Two-Step AI Pipeline for Image Analysis ──

async function identifyFoodFromImage(base64: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 300,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `You are a food identification expert. Analyse the image carefully.
List every food item you see with:
- The exact food name
- The cooking method (fried, boiled, grilled, steamed, raw, baked, etc.)
- The estimated portion size with weight if possible (e.g. "2 large eggs ~100g", "1 cup cooked white rice ~200g")
If multiple items are present, list each one on a new line.
Be specific. No introductions, no filler, no explanations.`
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: 'List all food items in this image with portion sizes.' }
          ]
        }
      ]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(`Groq vision error: ${data.error.message}`);
  return data.choices?.[0]?.message?.content?.trim() || '';
}

async function calculateNutritionFromDescription(description: string): Promise<NutritionResult> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Nutrition database expert. Calculate total nutrition for all listed food items combined.
Reply ONLY with this JSON, no other text, no markdown:
{"name":"short combined name","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"what was eaten"}`
        },
        {
          role: 'user',
          content: `Calculate total nutrition for this meal: ${description}`
        }
      ]
    })
  });

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '{}';
  const clean = extractJSON(raw);
  return JSON.parse(clean);
}

export async function analyzeImageWithAI(uri: string): Promise<NutritionResult & { ai_description: string }> {
  const base64 = await preprocessImage(uri);

  const description = await identifyFoodFromImage(base64);
  if (!description || description.trim().length < 5) {
    throw new Error('No food detected in the image. Try a clearer photo with better lighting.');
  }

  const nutrition = await calculateNutritionFromDescription(description);
  return { ...nutrition, ai_description: description };
}

function nowISO(): string {
  return new Date().toISOString();
}

function toFoodItem(r: FoodResult, qty: number): FoodItem {
  return {
    name: r.food_name,
    quantity: String(qty) + ' serving(s)',
    calories: Math.round(r.calories * qty),
    protein: Math.round(r.protein * qty * 10) / 10,
    carbs: Math.round(r.carbs * qty * 10) / 10,
    fat: Math.round(r.fat * qty * 10) / 10,
    fiber: Math.round(r.fiber * qty * 10) / 10,
  };
}

function toMealLog(items: FoodItem[]): MealLog {
  return {
    items,
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProtein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
    totalCarbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
    totalFat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
    mealType: autoMealType(),
    timestamp: nowISO(),
  };
}

// ── Input Normalization + Quantity Parsing ──

const WORD_QUANTITIES: Record<string, number> = {
  half: 0.5, quarter: 0.25, '0.5': 0.5,
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

const IGNORE_WORDS = new Set([
  'of', 'the', 'large', 'small', 'medium', 'bowl', 'plate', 'glass',
  'slice', 'slices', 'piece', 'pieces', 'handful', 'cup', 'cups',
  'some', 'with', 'and', 'for', 'fresh', 'cooked', 'roasted', 'grilled',
  'fried', 'baked', 'sauteed', 'steamed', 'boiled', 'diced', 'chopped',
  'minced', 'sliced',
]);

const UNIT_WORDS = new Set([
  'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon',
  'teaspoons', 'g', 'gram', 'grams', 'kg', 'ml', 'oz', 'ounce', 'ounces',
  'lb', 'pound', 'pounds', 'piece', 'pieces', 'slice', 'slices',
]);

function parseInput(input: string): { quantity: number; unit: string | null; food_key: string } {
  let cleaned = input.toLowerCase().trim();
  // remove leading "a " or "an "
  cleaned = cleaned.replace(/^(a |an )/, '');
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 0);
  let quantity = 1;
  let unit: string | null = null;
  let wordIdx = 0;
  // try leading number
  const numMatch = cleaned.match(/^(\d+\.?\d*)\s*/);
  if (numMatch) {
    quantity = parseFloat(numMatch[1]);
    wordIdx = numMatch[0].trim().split(/\s+/).length;
  } else if (tokens.length > 0 && WORD_QUANTITIES[tokens[0]] !== undefined) {
    quantity = WORD_QUANTITIES[tokens[0]];
    wordIdx = 1;
  }
  // check for unit after quantity
  if (wordIdx < tokens.length && UNIT_WORDS.has(tokens[wordIdx])) {
    unit = tokens[wordIdx];
    wordIdx++;
  }
  // remaining tokens = food name
  let foodName = tokens.slice(wordIdx)
    .filter(t => !IGNORE_WORDS.has(t))
    .join(' ');
  // remove trailing punctuation
  foodName = foodName.replace(/[.,!?;:]+$/, '').trim();
  if (!foodName) foodName = cleaned;
  return { quantity, unit, food_key: foodName };
}

// ── Seed Food Cache ──

let seedPromise: Promise<void> | null = null;

async function seedFoodCache(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const db = await getDb();
      const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM food_cache');
      if (count && count.c > 0) return;
      const foods = foodDatabaseJson as any[];
      for (const f of foods) {
        await db.runAsync(
          `INSERT OR IGNORE INTO food_cache
           (food_name, aliases, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          f.food_name,
          JSON.stringify(f.aliases || []),
          f.calories_per_100g,
          f.protein_per_100g,
          f.carbs_per_100g,
          f.fat_per_100g,
          f.fiber_per_100g || 0,
          f.serving_size || '100g',
          f.serving_grams || 100,
          'bundled'
        );
      }
      console.log('[nutritionAI] Seeded food_cache with', foods.length, 'items');
    } catch (err) {
      console.error('[nutritionAI] seedFoodCache error:', err);
    }
  })();
  return seedPromise;
}

// ── Layer 1: User Personal Food History ──

async function lookupUserHistory(userId: string, food_key: string): Promise<FoodResult | null> {
  try {
    const db = await getDb();
    const like = `%${food_key}%`;
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM user_food_history
       WHERE user_id = ?
       AND (LOWER(food_name) LIKE ? OR aliases LIKE ?)
       ORDER BY log_count DESC
       LIMIT 5`,
      userId, like, like
    );
    if (rows.length === 0) return null;
    const best = rows[0];
    await db.runAsync(
      `UPDATE user_food_history SET log_count = log_count + 1, last_logged = ? WHERE id = ? AND user_id = ?`,
      nowISO(), best.id, userId
    );
    console.log('[nutritionAI] Resolved from Layer 1 (user history):', food_key);
    return {
      food_name: best.food_name,
      calories: best.calories,
      protein: best.protein,
      carbs: best.carbs,
      fat: best.fat,
      fiber: best.fiber || 0,
      serving_size: best.serving_size || '1 serving',
      serving_grams: best.serving_grams || 100,
      source: best.source || 'user',
    };
  } catch (err) {
    console.error('[nutritionAI] Layer 1 error:', err);
    return null;
  }
}

async function saveToUserHistory(userId: string, fd: FoodResult): Promise<void> {
  try {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(
      `SELECT * FROM user_food_history WHERE user_id = ? AND LOWER(food_name) = ?`,
      userId, fd.food_name.toLowerCase()
    );
    if (existing) {
      await db.runAsync(
        `UPDATE user_food_history SET log_count = log_count + 1, last_logged = ? WHERE id = ?`,
        nowISO(), existing.id
      );
    } else {
      await db.runAsync(
        `INSERT INTO user_food_history
         (user_id, food_name, aliases, calories, protein, carbs, fat, fiber, serving_size, serving_grams, log_count, last_logged, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        userId, fd.food_name.toLowerCase(), '[]',
        fd.calories, fd.protein, fd.carbs, fd.fat, fd.fiber,
        fd.serving_size, fd.serving_grams, nowISO(), fd.source
      );
    }
  } catch (err) {
    console.error('[nutritionAI] saveToUserHistory error:', err);
  }
}

// ── Layer 2: Shared Food Cache ──

function convertPer100gToServing(cache: any): FoodResult {
  const sf = cache.serving_grams || 100;
  return {
    food_name: cache.food_name,
    calories: (sf / 100) * cache.calories_per_100g,
    protein: (sf / 100) * cache.protein_per_100g,
    carbs: (sf / 100) * cache.carbs_per_100g,
    fat: (sf / 100) * cache.fat_per_100g,
    fiber: (sf / 100) * (cache.fiber_per_100g || 0),
    serving_size: cache.serving_size || '100g',
    serving_grams: sf,
    source: cache.source || 'bundled',
  };
}

async function lookupFoodCache(food_key: string): Promise<FoodResult | null> {
  try {
    const db = await getDb();
    await seedFoodCache();
    const like = `%${food_key}%`;
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM food_cache
       WHERE LOWER(food_name) LIKE ? OR aliases LIKE ?
       LIMIT 3`,
      like, like
    );
    if (rows.length === 0) return null;
    console.log('[nutritionAI] Resolved from Layer 2 (food cache):', food_key);
    return convertPer100gToServing(rows[0]);
  } catch (err) {
    console.error('[nutritionAI] Layer 2 error:', err);
    return null;
  }
}

async function insertIntoFoodCache(fd: FoodResult): Promise<void> {
  try {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(
      `SELECT id FROM food_cache WHERE LOWER(food_name) = ?`,
      fd.food_name.toLowerCase()
    );
    if (existing) return;
    await db.runAsync(
      `INSERT OR IGNORE INTO food_cache
       (food_name, aliases, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      fd.food_name.toLowerCase(), '[]',
      fd.calories, fd.protein, fd.carbs, fd.fat, fd.fiber,
      fd.serving_size, fd.serving_grams, fd.source
    );
  } catch (err) {
    console.error('[nutritionAI] insertIntoFoodCache error:', err);
  }
}

// ── Layer 3: Fuzzy String Matching ──

async function fuzzyLookup(food_key: string): Promise<FoodResult | null> {
  try {
    const db = await getDb();
    await seedFoodCache();
    const cacheEntries = await db.getAllAsync<any>('SELECT food_name, aliases FROM food_cache');
    if (cacheEntries.length === 0) return null;
    const allEntries = cacheEntries.map((e: any) => ({
      food_name: e.food_name,
      aliases: (() => { try { return JSON.parse(e.aliases || '[]'); } catch { return []; } })(),
    }));
    const fuse = new Fuse(allEntries, {
      keys: ['food_name', 'aliases'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
    const results = fuse.search(food_key);
    if (results.length > 0 && results[0].score !== undefined && results[0].score! < 0.4) {
      const matchedName = results[0].item.food_name;
      const fullData = await db.getFirstAsync<any>(
        'SELECT * FROM food_cache WHERE food_name = ?',
        matchedName
      );
      if (fullData) {
        console.log('[nutritionAI] Resolved from Layer 3 (fuzzy):', food_key, '→', matchedName);
        return convertPer100gToServing(fullData);
      }
    }
    return null;
  } catch (err) {
    console.error('[nutritionAI] Layer 3 error:', err);
    return null;
  }
}

// ── Layer 4: Open Food Facts ──

async function lookupOpenFoodFacts(food_key: string): Promise<FoodResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(food_key)}&search_simple=1&action=process&json=1&page_size=3&fields=product_name,nutriments,serving_size`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.products || data.products.length === 0) return null;
    const product = data.products[0];
    const n = product.nutriments || {};
    const result: FoodResult = {
      food_name: (product.product_name || food_key).toLowerCase().trim(),
      calories: n['energy-kcal_100g'] || n['energy-kcal'] || 0,
      protein: n['proteins_100g'] || 0,
      carbs: n['carbohydrates_100g'] || 0,
      fat: n['fat_100g'] || 0,
      fiber: n['fiber_100g'] || 0,
      serving_size: product.serving_size || '100g',
      serving_grams: 100,
      source: 'open_food_facts',
    };
    await insertIntoFoodCache(result);
    console.log('[nutritionAI] Resolved from Layer 4 (Open Food Facts):', food_key);
    return result;
  } catch (err) {
    console.error('[nutritionAI] Layer 4 error:', err);
    return null;
  }
}

// ── Layer 5: Groq AI (text) ──

async function callGroqWithText(foodDescription: string, userId: string): Promise<FoodResult> {
  console.log('[nutritionAI] Resolved from Layer 5 (Groq AI):', foodDescription);
  const prompt = `Nutrition analyst. Reply ONLY with JSON, no other text:
{"name":"string","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"serving":"string"}
Values per single serving. Nutrition for: ${foodDescription}`;
  const raw = await groqChatRaw(
    [
      { role: 'system', content: 'You are a nutrition analyst. Return ONLY valid JSON, no markdown, no explanation.' },
      { role: 'user', content: prompt },
    ],
    'llama-3.3-70b-versatile',
    150
  );
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  const jsonStr = extractJSON(cleaned);
  const parsed = JSON.parse(jsonStr);
  const result: FoodResult = {
    food_name: (parsed.name || foodDescription).toLowerCase().trim(),
    calories: parsed.calories || 0,
    protein: parsed.protein || 0,
    carbs: parsed.carbs || 0,
    fat: parsed.fat || 0,
    fiber: parsed.fiber || 0,
    serving_size: parsed.serving || '1 serving',
    serving_grams: 100,
    source: 'ai',
  };
  await insertIntoFoodCache(result);
  await saveToUserHistory(userId, result);
  return result;
}

// ── Groq Vision (always for images) ──

async function callGroqWithImage(imageBase64: string, userId: string): Promise<MealLog> {
  const mt = autoMealType();
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
  "mealType": "${mt}",
  "timestamp": "${nowISO()}"
}`;
  const messages = [
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: prompt },
        { type: 'image_url' as const, image_url: { url: imageBase64 } },
      ],
    },
  ];
  const raw = await groqChatRaw(
    messages as any,
    'meta-llama/llama-4-scout-17b-16e-instruct',
    4000
  );
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  const jsonStr = extractJSON(cleaned);
  console.log('[nutritionAI] Image analysis:', jsonStr.substring(0, 200));
  const mealLog: MealLog = JSON.parse(jsonStr);
  // Save each food item to user history
  for (const item of mealLog.items) {
    await saveToUserHistory(userId, {
      food_name: item.name.toLowerCase(),
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber || 0,
      serving_size: item.quantity || '1 serving',
      serving_grams: 100,
      source: 'ai_vision',
    });
  }
  return mealLog;
}

// ── Fallback ──

function fallbackResult(): MealLog {
  return {
    items: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    mealType: autoMealType(),
    timestamp: nowISO(),
  };
}

// ── Main Entry Point ──

export async function analyzeFood(input: {
  text?: string;
  voiceTranscript?: string;
  imageBase64?: string;
  userId: string;
}): Promise<MealLog> {
  // Image → always Layer 5 (Groq Vision)
  if (input.imageBase64) {
    return await callGroqWithImage(input.imageBase64, input.userId);
  }

  const rawText = input.text || input.voiceTranscript || '';
  if (!rawText.trim()) return fallbackResult();

  // Safety check for text input
  const safetyInput: ValidationInput = {
    response: rawText,
    userConditions: [],
  };
  const safetyResult = validateResponse(safetyInput);
  if (safetyResult.action === 'refuse' || safetyResult.action === 'fallback') {
    throw new Error(safetyResult.fallbackMessage || 'Input could not be processed safely.');
  }

  const { quantity, food_key } = parseInput(rawText);

  // Layer 1: User personal history
  const layer1 = await lookupUserHistory(input.userId, food_key);
  if (layer1) {
    await saveToUserHistory(input.userId, layer1);
    return toMealLog([toFoodItem(layer1, quantity)]);
  }

  // Layer 2: Shared food cache
  const layer2 = await lookupFoodCache(food_key);
  if (layer2) {
    await saveToUserHistory(input.userId, layer2);
    return toMealLog([toFoodItem(layer2, quantity)]);
  }

  // Layer 3: Fuzzy matching
  const layer3 = await fuzzyLookup(food_key);
  if (layer3) {
    await saveToUserHistory(input.userId, layer3);
    return toMealLog([toFoodItem(layer3, quantity)]);
  }

  // Layer 4: Open Food Facts API
  const layer4 = await lookupOpenFoodFacts(food_key);
  if (layer4) {
    await saveToUserHistory(input.userId, layer4);
    return toMealLog([toFoodItem(layer4, quantity)]);
  }

  // Layer 5: Groq AI (last resort)
  try {
    const layer5 = await callGroqWithText(food_key, input.userId);
    return toMealLog([toFoodItem(layer5, quantity)]);
  } catch (err: any) {
    console.error('[nutritionAI] All layers failed:', err);
    return fallbackResult();
  }
}

// ── Backward-compatible aliases ──

export async function parseFoodInput(description: string): Promise<MealLog> {
  const userId = '';
  return analyzeFood({ text: description, userId });
}

export async function analyzeFoodImage(imageUrl: string): Promise<MealLog> {
  return analyzeFood({ imageBase64: imageUrl, userId: '' });
}

// ── getMealSuggestion (unchanged) ──

export async function getMealSuggestion(
  remainingCalories: number,
  remainingProtein: number,
  conditions: string[],
  mealType: string
): Promise<string> {
  try {
    const conditionNote = conditions.length > 0
      ? `User has: ${conditions.join(', ')}. Adapt suggestions accordingly (e.g., low sodium for hypertension, low GI for diabetes).`
      : '';

    const prompt = `Suggest a ${mealType} meal that fits these remaining macros:
- Calories: ~${remainingCalories} kcal
- Protein: ~${remainingProtein}g needed
${conditionNote}

Give 2-3 quick meal ideas with approximate macros. Keep it brief and practical.
Prefer Indian food options but include variety.`;

    return await groqChat(
      'You are FitAI Nutritionist. Give brief, practical meal suggestions. Use bullet points.',
      prompt
    );
  } catch (error) {
    console.error('[nutritionAI] getMealSuggestion error:', error);
    return 'Try a balanced meal with lean protein, complex carbs, and healthy fats. For example: grilled chicken with quinoa and roasted vegetables.';
  }
}
