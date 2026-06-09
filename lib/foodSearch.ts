import { getDb } from './db';
import foodDatabaseJson from '@/assets/food_database.json';

export interface FoodEntry {
  id: number;
  canonical_name: string;
  brand_name: string;
  barcode: string | null;
  category: string;
  verified: number;
  source: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  sodium_per_100g: number;
  serving_size: string;
  serving_grams: number;
  aliases: string;
  search_terms: string;
}

export interface RecentFood {
  id: number;
  food_id: number | null;
  food_name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  serving_size: string;
  serving_grams: number;
  last_quantity: number;
  last_unit: string;
  last_meal_type: string;
  log_count: number;
  last_logged: string;
  source: string;
}

export interface SavedMeal {
  id: number;
  meal_name: string;
  meal_type: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  is_favorite: number;
  foods: SavedMealFood[];
  created_at: string;
}

export interface SavedMealFood {
  id: number;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface SearchResult {
  foods: FoodEntry[];
  recent: RecentFood[];
  suggestions: string[];
}

const seedPromise: { current: Promise<void> | null } = { current: null };

export async function ensureFoodDatabaseSeeded(): Promise<void> {
  if (seedPromise.current) return seedPromise.current;
  seedPromise.current = (async () => {
    try {
      const db = await getDb();
      const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM foods');
      if (count && count.c > 500) return;
      const entries = (foodDatabaseJson as any[]) || [];
      for (const entry of entries) {
        const name = (entry.food_name || '').trim().toLowerCase();
        if (!name) continue;
        const existing = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM foods WHERE LOWER(canonical_name) = ?', name
        );
        if (existing) continue;
        const aliasesArr: string[] = entry.aliases || [];
        const aliasesStr = JSON.stringify(aliasesArr);
        const searchTerms = [name, ...aliasesArr.map((a: string) => a.toLowerCase())].join(' ');
        await db.runAsync(
          `INSERT INTO foods (canonical_name, category, verified, source, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, serving_size, serving_grams, aliases, search_terms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          name, entry.category || '', 1, 'bundled',
          entry.calories_per_100g || 0, entry.protein_per_100g || 0,
          entry.carbs_per_100g || 0, entry.fat_per_100g || 0,
          entry.fiber_per_100g || 0, 0, 0,
          entry.serving_size || '100g', entry.serving_grams || 100,
          aliasesStr, searchTerms
        );
        // Insert default serving
        const foodRow = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM foods WHERE LOWER(canonical_name) = ?', name
        );
        if (foodRow) {
          await db.runAsync(
            `INSERT OR IGNORE INTO food_servings (food_id, serving_name, grams, household_measure) VALUES (?, ?, ?, ?)`,
            foodRow.id, entry.serving_size || 'serving', entry.serving_grams || 100, 1
          );
          await db.runAsync(
            `INSERT OR IGNORE INTO food_servings (food_id, serving_name, grams, household_measure) VALUES (?, ?, ?, ?)`,
            foodRow.id, '100g', 100, 1
          );
        }
      }
      // Sync to FTS index
      try {
        await db.execAsync(`INSERT INTO foods_fts(foods_fts) VALUES('rebuild')`);
      } catch {}
    } catch (e) {
      console.error('[foodSearch] seed error:', e);
    }
  })();
  return seedPromise.current;
}

let searchCache: { query: string; results: FoodEntry[]; time: number } | null = null;
const SEARCH_CACHE_TTL = 5000;

export async function searchFoods(
  query: string,
  userId?: string,
  mealType?: string,
  limit: number = 20,
): Promise<SearchResult> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return { foods: [], recent: await getRecentFoods(userId, mealType), suggestions: [] };
  }

  // Check cache
  if (searchCache && searchCache.query === trimmed && Date.now() - searchCache.time < SEARCH_CACHE_TTL) {
    return { foods: searchCache.results, recent: await getRecentFoods(userId, mealType), suggestions: [] };
  }

  const db = await getDb();
  await ensureFoodDatabaseSeeded();

  let foods: FoodEntry[] = [];
  let suggestions: string[] = [];

  // Try FTS5 first
  try {
    const ftsQuery = trimmed.split(/\s+/).map(w => `${w}*`).join(' ');
    const rows = await db.getAllAsync<any>(
      `SELECT f.* FROM foods f
       INNER JOIN foods_fts ON foods_fts.rowid = f.id
       WHERE foods_fts MATCH ?
       ORDER BY rank
       LIMIT ?`,
      ftsQuery, limit
    );
    if (rows.length > 0) {
      foods = rows;
    }
  } catch {}

  // Fallback: LIKE search
  if (foods.length === 0) {
    const likePattern = `%${trimmed}%`;
    foods = await db.getAllAsync<any>(
      `SELECT * FROM foods
       WHERE LOWER(canonical_name) LIKE ?
          OR LOWER(aliases) LIKE ?
          OR LOWER(search_terms) LIKE ?
       LIMIT ?`,
      likePattern, likePattern, likePattern, limit
    );
  }

  // Prioritize exact prefix match first
  const exactPrefix = foods.filter(f => f.canonical_name.startsWith(trimmed));
  const rest = foods.filter(f => !f.canonical_name.startsWith(trimmed));
  foods = [...exactPrefix, ...rest].slice(0, limit);

  // Autocomplete suggestions
  if (foods.length > 0) {
    suggestions = foods.slice(0, 5).map(f => f.canonical_name);
  } else {
    // Check aliases for suggestions
    const aliasRows = await db.getAllAsync<{ canonical_name: string }>(
      `SELECT canonical_name FROM foods WHERE LOWER(aliases) LIKE ? LIMIT 5`,
      `%${trimmed}%`
    );
    suggestions = aliasRows.map(r => r.canonical_name);
  }

  searchCache = { query: trimmed, results: foods, time: Date.now() };

  return {
    foods,
    recent: trimmed.length < 2 ? await getRecentFoods(userId, mealType) : [],
    suggestions,
  };
}

export async function getRecentFoods(
  userId?: string,
  mealType?: string,
  limit: number = 10,
): Promise<RecentFood[]> {
  if (!userId) return [];
  const db = await getDb();
  if (mealType) {
    return db.getAllAsync<any>(
      `SELECT * FROM recent_foods
       WHERE user_id = ? AND last_meal_type = ?
       ORDER BY log_count DESC, last_logged DESC
       LIMIT ?`,
      userId, mealType, Math.min(limit, 5)
    );
  }
  return db.getAllAsync<any>(
    `SELECT * FROM recent_foods
     WHERE user_id = ?
     ORDER BY log_count DESC, last_logged DESC
     LIMIT ?`,
    userId, limit
  );
}

export async function getFrequentFoods(userId?: string, limit: number = 10): Promise<RecentFood[]> {
  if (!userId) return [];
  const db = await getDb();
  return db.getAllAsync<any>(
    `SELECT * FROM recent_foods
     WHERE user_id = ? AND log_count > 1
     ORDER BY log_count DESC
     LIMIT ?`,
    userId, limit
  );
}

export async function logFoodToRecent(
  userId: string,
  foodName: string,
  caloriesPer100g: number,
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number,
  fiberPer100g: number,
  servingSize: string,
  servingGrams: number,
  quantity: number,
  unit: string,
  mealType: string,
  source: string = 'bundled',
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  const existing = await db.getFirstAsync<any>(
    `SELECT id, log_count FROM recent_foods WHERE user_id = ? AND LOWER(food_name) = ?`,
    userId, foodName.toLowerCase()
  );
  if (existing) {
    await db.runAsync(
      `UPDATE recent_foods SET log_count = log_count + 1, last_logged = ?, last_quantity = ?, last_unit = ?, last_meal_type = ? WHERE id = ?`,
      now, quantity, unit, mealType, existing.id
    );
  } else {
    await db.runAsync(
      `INSERT INTO recent_foods (user_id, food_id, food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, last_quantity, last_unit, last_meal_type, log_count, last_logged, source)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      userId, foodName.toLowerCase(), caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g,
      servingSize, servingGrams, quantity, unit, mealType, now, source
    );
  }
}

export async function getSavedMeals(userId: string): Promise<SavedMeal[]> {
  const db = await getDb();
  const meals = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals WHERE user_id = ? ORDER BY is_favorite DESC, created_at DESC`,
    userId
  );
  const result: SavedMeal[] = [];
  for (const meal of meals) {
    const foods = await db.getAllAsync<any>(
      `SELECT * FROM saved_meal_foods WHERE meal_id = ?`, meal.id
    );
    result.push({
      id: meal.id,
      meal_name: meal.meal_name,
      meal_type: meal.meal_type,
      total_calories: meal.total_calories,
      total_protein: meal.total_protein,
      total_carbs: meal.total_carbs,
      total_fat: meal.total_fat,
      is_favorite: meal.is_favorite,
      foods: foods.map((f: any) => ({
        id: f.id,
        food_name: f.food_name,
        quantity: f.quantity,
        unit: f.unit,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: f.fiber,
      })),
      created_at: meal.created_at,
    });
  }
  return result;
}

export async function saveMeal(
  userId: string,
  mealName: string,
  mealType: string,
  foods: { foodName: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; fiber: number; foodId?: number; customFoodId?: number }[],
): Promise<number> {
  const db = await getDb();
  const totals = foods.reduce((acc, f) => ({
    cal: acc.cal + (f.calories || 0),
    prot: acc.prot + (f.protein || 0),
    carb: acc.carb + (f.carbs || 0),
    fat: acc.fat + (f.fat || 0),
  }), { cal: 0, prot: 0, carb: 0, fat: 0 });
  const result = await db.runAsync(
    `INSERT INTO saved_meals (user_id, meal_name, meal_type, total_calories, total_protein, total_carbs, total_fat)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    userId, mealName, mealType, totals.cal, totals.prot, totals.carb, totals.fat
  );
  const mealId = result.lastInsertRowId;
  for (const f of foods) {
    await db.runAsync(
      `INSERT INTO saved_meal_foods (meal_id, food_id, custom_food_id, food_name, quantity, unit, calories, protein, carbs, fat, fiber)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      mealId, f.foodId || null, f.customFoodId || null, f.foodName, f.quantity, f.unit,
      f.calories, f.protein, f.carbs, f.fat, f.fiber || 0
    );
  }
  return mealId;
}

export async function deleteSavedMeal(mealId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM saved_meal_foods WHERE meal_id = ?', mealId);
  await db.runAsync('DELETE FROM saved_meals WHERE id = ?', mealId);
}

export async function toggleFavoriteMeal(mealId: number, favorite: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE saved_meals SET is_favorite = ? WHERE id = ?', favorite ? 1 : 0, mealId);
}

export async function getFoodById(id: number): Promise<FoodEntry | null> {
  const db = await getDb();
  return db.getFirstAsync<any>('SELECT * FROM foods WHERE id = ?', id);
}

export async function getFoodServings(foodId: number): Promise<{ serving_name: string; grams: number | null; ml: number | null; household_measure: number }[]> {
  const db = await getDb();
  return db.getAllAsync<any>(
    'SELECT serving_name, grams, ml, household_measure FROM food_servings WHERE food_id = ? ORDER BY household_measure DESC',
    foodId
  );
}

export async function getVerifiedFoods(limit: number = 50): Promise<FoodEntry[]> {
  const db = await getDb();
  return db.getAllAsync<any>(
    `SELECT * FROM foods WHERE verified = 1 ORDER BY canonical_name LIMIT ?`, limit
  );
}

export async function createCustomFood(
  userId: string,
  name: string,
  brand: string,
  per100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number },
  servingSize: string,
  servingGrams: number,
  isRecipe: boolean = false,
  recipeJson?: string,
): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO user_custom_foods (user_id, name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, serving_size, serving_grams, is_recipe, recipe_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    userId, name, brand, per100g.calories, per100g.protein, per100g.carbs, per100g.fat,
    per100g.fiber, per100g.sugar, per100g.sodium, servingSize, servingGrams,
    isRecipe ? 1 : 0, recipeJson || null
  );
  return result.lastInsertRowId;
}

export async function getUserCustomFoods(userId: string): Promise<any[]> {
  const db = await getDb();
  return db.getAllAsync<any>(
    'SELECT * FROM user_custom_foods WHERE user_id = ? ORDER BY created_at DESC', userId
  );
}

export function calculateMacros(
  per100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
  grams: number,
) {
  const ratio = grams / 100;
  return {
    calories: Math.round(per100g.calories * ratio),
    protein: round1(per100g.protein * ratio),
    carbs: round1(per100g.carbs * ratio),
    fat: round1(per100g.fat * ratio),
    fiber: round1((per100g.fiber || 0) * ratio),
  };
}

function round1(v: number): number { return Math.round(v * 10) / 10; }
