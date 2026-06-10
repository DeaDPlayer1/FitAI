import { getDb } from './db';
import type { SQLiteDatabase } from 'expo-sqlite';
import foodDatabaseJson from '@/assets/food_database.json';
import globalFoodDatabaseJson from '@/assets/global_food_database.json';
import { searchRestaurantFoods, getBrandEmoji } from './restaurantSearch';
import { detectBrand } from './restaurantCanonicalizer';
import { supabase } from './supabase';

export interface FoodEntry {
  id: number;
  canonical_name: string;
  brand_name: string;
  barcode: string | null;
  category: string;
  cuisine: string;
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
  display_name?: string;
  base_serving_amount?: number;
  base_serving_unit?: string;
  base_serving_description?: string;
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
  total_fiber?: number;
  total_weight?: number;
  is_favorite: number;
  log_count?: number;
  last_logged?: string;
  meal_thumbnail?: string;
  position_order?: number;
  foods: SavedMealFood[];
  created_at: string;
  updated_at?: string;
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
  restaurantItems?: any[];
  detectedBrand?: string | null;
  brandEmoji?: string;
}

// ── Typo / Alias normalization ──
const FOOD_TYPO_MAP: Record<string, string> = {
  rotie: 'roti', roty: 'roti', rotii: 'roti', rorti: 'roti',
  chapati: 'roti', chappati: 'roti', chapathi: 'roti', chapaati: 'roti', phulka: 'roti',
  dosai: 'dosa', dose: 'dosa', doss: 'dosa', dossa: 'dosa',
  idly: 'idli', idili: 'idli', iddli: 'idli', idli: 'idli',
  parotta: 'paratha', parotha: 'paratha', parata: 'paratha', porotta: 'paratha',
  nan: 'naan',
  panir: 'paneer', panner: 'paneer', pannir: 'paneer',
  biryani: 'biryani', biriyani: 'biryani',
  chiken: 'chicken', chkn: 'chicken', chikn: 'chicken', chicen: 'chicken',
  muttun: 'mutton', mutton: 'mutton',
  samosha: 'samosa', samosa: 'samosa',
  poori: 'puri', puri: 'puri',
  uppuma: 'upma', upma: 'upma',
  macd: 'mcdonalds', mcd: 'mcdonalds',
  cofi: 'coffee', coffe: 'coffee',
  veg: 'vegetable', veggie: 'vegetable', vegi: 'vegetable',
  coke: 'coca cola',
  piza: 'pizza', pzza: 'pizza',
  berger: 'burger', burgir: 'burger',
  sandwitch: 'sandwich', sandwhich: 'sandwich',
};

export function normalizeFoodSearch(query: string): string {
  const q = query.trim().toLowerCase();
  // Exact alias match
  if (FOOD_TYPO_MAP[q]) return FOOD_TYPO_MAP[q];
  // Partial word substitution (handle multi-word queries like "roti curry")
  const words = q.split(/\s+/);
  const normalized = words.map(w => FOOD_TYPO_MAP[w] || w).join(' ');
  return normalized;
}

// ── Database reset utility ──
export async function resetNutritionDatabase(): Promise<void> {
  const { getDb } = await import('./db');
  const db = await getDb();
  try {
    await db.execAsync('DROP TABLE IF EXISTS foods_fts');
    await db.execAsync('DROP TABLE IF EXISTS food_servings');
    await db.execAsync('DROP TABLE IF EXISTS foods');
    await db.execAsync('DROP TABLE IF EXISTS recent_foods');
    await db.execAsync('DROP TABLE IF EXISTS saved_meal_foods');
    await db.execAsync('DROP TABLE IF EXISTS saved_meals');
    await db.execAsync('DROP TABLE IF EXISTS user_custom_foods');
    await db.execAsync('PRAGMA user_version = 0');
    console.log('[foodSearch] nutrition database reset');
  } catch (e) {
    console.error('[foodSearch] reset error:', e);
    throw e;
  }
  // Clear seed promise so re-seed runs on next search
  seedPromise.current = null;
}

const seedPromise: { current: Promise<void> | null } = { current: null };

function safeNum(v: any, fallback: number = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

function safeStr(v: any, fallback: string = ''): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

export async function ensureFoodDatabaseSeeded(): Promise<void> {
  if (seedPromise.current) return seedPromise.current;
  seedPromise.current = (async () => {
    let db: any;
    try {
      db = await getDb();

      // Check if already seeded
      try {
        const count: any = await db.getFirstAsync('SELECT COUNT(*) as c FROM foods');
        if (count && count.c > 500) return;
      } catch (e) {
        // foods table might not exist yet, proceed with seed
      }

      await db.execAsync('BEGIN TRANSACTION');

      try {
        // expo-sqlite runAsync/getFirstAsync use variadic params, wrap array callers to spread
        const runSql = (sql: string, params: any[]) => db.runAsync(sql, ...params);
        const getFirst = (sql: string, params: any[]) => db.getFirstAsync(sql, ...params);

        const entries = (foodDatabaseJson as any[]) || [];
        for (const entry of entries) {
          try {
            const name = safeStr(entry.food_name).trim().toLowerCase();
            if (!name) continue;
            const aliasesArr: string[] = Array.isArray(entry.aliases) ? entry.aliases : [];
            const aliasesStr = JSON.stringify(aliasesArr);
            const searchTerms = [name, ...aliasesArr.map((a: string) => safeStr(a).toLowerCase())].join(' ');
            const res = await runSql(
              `INSERT OR IGNORE INTO foods (canonical_name, display_name, category, verified, source, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, serving_size, serving_grams, base_serving_amount, base_serving_unit, base_serving_description, aliases, search_terms)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [name, safeStr(entry.food_name, name), safeStr(entry.category), 1, 'bundled',
              safeNum(entry.calories_per_100g), safeNum(entry.protein_per_100g),
              safeNum(entry.carbs_per_100g), safeNum(entry.fat_per_100g),
              safeNum(entry.fiber_per_100g), 0, 0,
              safeStr(entry.serving_size, '100g'), safeNum(entry.serving_grams, 100),
              safeNum(entry.serving_grams, 100), 'g', safeStr(entry.serving_size, 'serving'),
              aliasesStr, searchTerms]
            );
            if (res.changes) {
              const foodRow: any = await getFirst(
                'SELECT id FROM foods WHERE LOWER(canonical_name) = ?', [name]
              );
              if (foodRow) {
                await runSql(
                  `INSERT OR IGNORE INTO food_servings (food_id, serving_name, grams, household_measure, serving_description, amount_in_grams, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [foodRow.id, safeStr(entry.serving_size, 'serving'), safeNum(entry.serving_grams, 100), 1, safeStr(entry.serving_size, 'serving'), safeNum(entry.serving_grams, 100), 1]
                );
                await runSql(
                  `INSERT OR IGNORE INTO food_servings (food_id, serving_name, grams, household_measure, serving_description, amount_in_grams, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [foodRow.id, '100g', 100, 1, '100g', 100, 0]
                );
              }
            }
          } catch {}
        }

        const globalEntries = (globalFoodDatabaseJson as any[]) || [];
        for (const entry of globalEntries) {
          try {
            if (!entry || !Array.isArray(entry) || entry.length < 13) continue;
            const canonical = safeStr(entry[0]).toLowerCase().trim();
            if (!canonical) continue;
            const displayName = safeStr(entry[1]);
            const category = safeStr(entry[2]);
            const cuisine = safeStr(entry[3]);
            const searchTerms = [
              canonical, displayName.toLowerCase(), category.toLowerCase(), cuisine.toLowerCase()
            ].join(' ').trim();
            const aliasesArr: string[] = Array.isArray(entry[13]) ? entry[13] : [];
            const aliasesStr = JSON.stringify(aliasesArr);

            const res = await runSql(
              `INSERT OR IGNORE INTO foods (canonical_name, display_name, category, cuisine, verified, source, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g, serving_size, serving_grams, base_serving_amount, base_serving_unit, base_serving_description, aliases, search_terms)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [canonical, displayName, category, cuisine, 1, 'bundled',
              safeNum(entry[4]), safeNum(entry[5]), safeNum(entry[6]), safeNum(entry[7]),
              safeNum(entry[8]), safeNum(entry[9]), safeNum(entry[10]),
              safeStr(entry[11], 'serving'), safeNum(entry[12], 100),
              safeNum(entry[12], 100), 'g', safeStr(entry[11], 'serving'),
              aliasesStr, searchTerms]
            );
            if (res.changes) {
              const foodRow: any = await getFirst(
                'SELECT id FROM foods WHERE LOWER(canonical_name) = ?', [canonical]
              );
              if (foodRow) {
                const sg = safeNum(entry[12], 100);
                await runSql(
                  `INSERT OR IGNORE INTO food_servings (food_id, serving_name, grams, household_measure, serving_description, amount_in_grams, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [foodRow.id, safeStr(entry[11], 'serving'), sg, 1, safeStr(entry[11], 'serving'), sg, 1]
                );
                await runSql(
                  `INSERT OR IGNORE INTO food_servings (food_id, serving_name, grams, household_measure, serving_description, amount_in_grams, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [foodRow.id, '100g', 100, 1, '100g', 100, 0]
                );
                if (sg < 200) {
                  await runSql(
                    `INSERT OR IGNORE INTO food_servings (food_id, serving_name, grams, household_measure, serving_description, amount_in_grams, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [foodRow.id, '1 bowl (250g)', 250, 0, '1 bowl (250g)', 250, 0]
                  );
                }
              }
            }
          } catch {}
        }

        await db.execAsync('COMMIT');
      } catch (txErr) {
        await db.execAsync('ROLLBACK');
        throw txErr;
      }

      // Sync to FTS index (non-critical)
      try {
        await db.execAsync(`INSERT INTO foods_fts(foods_fts) VALUES('rebuild')`);
      } catch {}
    } catch (e) {
      console.error('[foodSearch] seed error:', e);
      seedPromise.current = null; // Allow retry on next call
      // Don't throw — let search fall through to LIKE fallback gracefully
    }
  })();
  return seedPromise.current;
}

interface SearchCacheEntry {
  query: string;
  foods: FoodEntry[];
  time: number;
  suggestions: string[];
  restaurantItems: any[];
  detectedBrand: string | null;
  brandEmoji: string;
}
const searchCache = new Map<string, SearchCacheEntry>();
const SEARCH_CACHE_TTL = 5000;
const MAX_CACHE_ENTRIES = 10;

function cacheSearch(key: string, entry: SearchCacheEntry): void {
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = searchCache.keys().next().value;
    if (oldest) searchCache.delete(oldest);
  }
  searchCache.set(key, entry);
}

export async function searchFoods(
  query: string,
  userId?: string,
  mealType?: string,
  limit: number = 20,
): Promise<SearchResult> {
  try {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      try { return { foods: [], recent: await getRecentFoods(userId, mealType).catch(() => []), suggestions: [] }; } catch { return { foods: [], recent: [], suggestions: [] }; }
    }

    const now = Date.now();
    const cached = searchCache.get(trimmed);
    if (cached && now - cached.time < SEARCH_CACHE_TTL) {
      return {
        foods: cached.foods,
        recent: trimmed.length < 2 ? await getRecentFoods(userId, mealType).catch(() => []) : [],
        suggestions: cached.suggestions,
        restaurantItems: cached.restaurantItems,
        detectedBrand: cached.detectedBrand,
        brandEmoji: cached.brandEmoji,
      };
    }

    const db = await getDb();
    try { await ensureFoodDatabaseSeeded(); } catch {}

    const normalized = normalizeFoodSearch(trimmed);
    const searchQueries = normalized !== trimmed ? [trimmed, normalized] : [trimmed];

    const detectedBrand = detectBrand(trimmed);
    const brandEmoji = detectedBrand ? getBrandEmoji(detectedBrand) : '';

    let foods: FoodEntry[] = [];
    let suggestions: string[] = [];
    let restaurantItems: any[] = [];

    for (const sq of searchQueries) {
      try {
        const ftsQuery = sq.split(/\s+/).map(w => `${w}*`).join(' ');
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
          break;
        }
      } catch {}
    }

    if (foods.length === 0) {
      for (const sq of searchQueries) {
        try {
          const pattern = `%${sq}%`;
          const rows = await db.getAllAsync<any>(
            `SELECT * FROM foods
             WHERE LOWER(canonical_name) LIKE ?
                OR LOWER(IFNULL(display_name, '')) LIKE ?
                OR LOWER(IFNULL(aliases, '')) LIKE ?
                OR LOWER(IFNULL(search_terms, '')) LIKE ?
                OR LOWER(IFNULL(category, '')) LIKE ?
                OR LOWER(IFNULL(cuisine, '')) LIKE ?
             LIMIT ?`,
            pattern, pattern, pattern, pattern, pattern, pattern, limit
          );
          if (rows.length > 0) {
            foods = rows;
            break;
          }
        } catch {}
      }
    }

    try {
      const restResult = await searchRestaurantFoods(trimmed, limit);
      restaurantItems = restResult.items;
      if (foods.length === 0 && restResult.suggestions.length > 0) {
        suggestions = restResult.suggestions;
      }
    } catch {}

    const exactPrefix = foods.filter(f => f.canonical_name?.startsWith(trimmed));
    const rest = foods.filter(f => !f.canonical_name?.startsWith(trimmed));
    foods = [...exactPrefix, ...rest].slice(0, limit);

    if (foods.length > 0 && suggestions.length === 0) {
      suggestions = foods.slice(0, 5).map(f => f.canonical_name || '');
    } else if (foods.length === 0) {
      for (const sq of searchQueries) {
        try {
          const aliasRows = await db.getAllAsync<{ canonical_name: string }>(
            `SELECT canonical_name FROM foods WHERE LOWER(IFNULL(aliases, '')) LIKE ? LIMIT 5`,
            `%${sq}%`
          );
          if (aliasRows.length > 0) {
            suggestions = aliasRows.map(r => r.canonical_name || '');
            break;
          }
        } catch {}
      }
    }

    cacheSearch(trimmed, { query: trimmed, foods, time: now, suggestions, restaurantItems, detectedBrand, brandEmoji });

    return {
      foods,
      recent: trimmed.length < 2 ? await getRecentFoods(userId, mealType).catch(() => []) : [],
      suggestions,
      restaurantItems,
      detectedBrand,
      brandEmoji,
    };
  } catch (e) {
    console.error('[foodSearch] searchFoods error:', e);
    return { foods: [], recent: [], suggestions: [], restaurantItems: [], detectedBrand: null, brandEmoji: '' };
  }
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
  const lowerName = foodName.toLowerCase();
  await db.runAsync(
    `INSERT OR IGNORE INTO recent_foods (user_id, food_id, food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, last_quantity, last_unit, last_meal_type, log_count, last_logged, source)
     VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    userId, lowerName, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g,
    servingSize, servingGrams, quantity, unit, mealType, now, source
  );
  await db.runAsync(
    `UPDATE recent_foods SET log_count = log_count + 1, last_logged = ?, last_quantity = ?, last_unit = ?, last_meal_type = ? WHERE user_id = ? AND food_name = ?`,
    now, quantity, unit, mealType, userId, lowerName
  );
}

export async function getSavedMeals(userId: string): Promise<SavedMeal[]> {
  const db = await getDb();
  const meals = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals WHERE user_id = ? ORDER BY is_favorite DESC, log_count DESC, created_at DESC`,
    userId
  );
  const result: SavedMeal[] = [];
  for (const meal of meals) {
    const foods = await db.getAllAsync<any>(
      `SELECT * FROM saved_meal_foods WHERE meal_id = ? ORDER BY position_order`, meal.id
    );
    result.push({
      id: meal.id,
      meal_name: meal.meal_name,
      meal_type: meal.meal_type,
      total_calories: meal.total_calories,
      total_protein: meal.total_protein,
      total_carbs: meal.total_carbs,
      total_fat: meal.total_fat,
      total_fiber: meal.total_fiber,
      total_weight: meal.total_weight,
      is_favorite: meal.is_favorite,
      log_count: meal.log_count,
      last_logged: meal.last_logged,
      meal_thumbnail: meal.meal_thumbnail || generateMealEmoji(foods.map((f: any) => f.food_name)),
      position_order: meal.position_order,
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
      updated_at: meal.updated_at,
    });
  }
  return result;
}

const FOOD_EMOJI_MAP: Record<string, string> = {
  rice: '🍚', chicken: '🍗', paneer: '🧀', bread: '🍞', egg: '🥚', eggs: '🥚',
  oats: '🥣', milk: '🥛', banana: '🍌', apple: '🍎', salad: '🥗', fish: '🐟',
  roti: '🫓', naan: '🫓', dal: '🫘', curry: '🍛', soup: '🍜',
  smoothie: '🥤', shake: '🥤', coffee: '☕', tea: '🫖', water: '💧',
  beef: '🥩', pork: '🥓', tofu: '🫘', pasta: '🍝', pizza: '🍕', burger: '🍔',
  fries: '🍟', cheese: '🧀', butter: '🧈', yogurt: '🥛', nuts: '🥜',
  berries: '🫐', avocado: '🥑', potato: '🥔', sweet_potato: '🍠',
  broccoli: '🥦', cucumber: '🥒', tomato: '🍅', carrot: '🥕',
};

function generateMealEmoji(foodNames: string[]): string {
  const seen = new Set<string>();
  const emojis: string[] = [];
  for (const name of foodNames) {
    const lower = name.toLowerCase();
    for (const [key, emoji] of Object.entries(FOOD_EMOJI_MAP)) {
      if (lower.includes(key) && !seen.has(emoji)) {
        seen.add(emoji); emojis.push(emoji);
        break;
      }
    }
    if (emojis.length >= 4) break;
  }
  return emojis.length > 0 ? emojis.join(' ') : '🍽️';
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
    fib: acc.fib + (f.fiber || 0),
    w: acc.w + (f.quantity || 0),
  }), { cal: 0, prot: 0, carb: 0, fat: 0, fib: 0, w: 0 });
  const result = await db.runAsync(
    `INSERT INTO saved_meals (user_id, meal_name, meal_type, total_calories, total_protein, total_carbs, total_fat, total_weight, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    userId, mealName, mealType, totals.cal, totals.prot, totals.carb, totals.fat, totals.w
  );
  const mealId = result.lastInsertRowId;
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    await db.runAsync(
      `INSERT INTO saved_meal_foods (meal_id, food_id, custom_food_id, food_name, quantity, unit, calories, protein, carbs, fat, fiber, position_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      mealId, f.foodId || null, f.customFoodId || null, f.foodName, f.quantity, f.unit,
      f.calories, f.protein, f.carbs, f.fat, f.fiber || 0, i
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

export async function getMealById(mealId: number): Promise<SavedMeal | null> {
  const db = await getDb();
  const meal = await db.getFirstAsync<any>('SELECT * FROM saved_meals WHERE id = ?', mealId);
  if (!meal) return null;
  const foods = await db.getAllAsync<any>('SELECT * FROM saved_meal_foods WHERE meal_id = ? ORDER BY position_order', mealId);
  return {
    id: meal.id, meal_name: meal.meal_name, meal_type: meal.meal_type,
    total_calories: meal.total_calories, total_protein: meal.total_protein,
    total_carbs: meal.total_carbs, total_fat: meal.total_fat,
    total_fiber: meal.total_fiber, total_weight: meal.total_weight,
    is_favorite: meal.is_favorite, log_count: meal.log_count,
    last_logged: meal.last_logged, meal_thumbnail: meal.meal_thumbnail,
    position_order: meal.position_order,
    foods: foods.map((f: any) => ({
      id: f.id, food_name: f.food_name, quantity: f.quantity, unit: f.unit,
      calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber,
    })),
    created_at: meal.created_at, updated_at: meal.updated_at,
  };
}

export async function updateSavedMeal(
  mealId: number,
  updates: { meal_name?: string; meal_type?: string; is_favorite?: number; position_order?: number },
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const vals: any[] = [];
  if (updates.meal_name !== undefined) { fields.push('meal_name = ?'); vals.push(updates.meal_name); }
  if (updates.meal_type !== undefined) { fields.push('meal_type = ?'); vals.push(updates.meal_type); }
  if (updates.is_favorite !== undefined) { fields.push('is_favorite = ?'); vals.push(updates.is_favorite); }
  if (updates.position_order !== undefined) { fields.push('position_order = ?'); vals.push(updates.position_order); }
  if (fields.length === 0) return;
  fields.push('updated_at = ?'); vals.push(new Date().toISOString());
  vals.push(mealId);
  await db.runAsync(`UPDATE saved_meals SET ${fields.join(', ')} WHERE id = ?`, ...vals);
}

export async function duplicateMeal(mealId: number, newName: string): Promise<number> {
  const original = await getMealById(mealId);
  if (!original) throw new Error('Meal not found');
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO saved_meals (user_id, meal_name, meal_type, total_calories, total_protein, total_carbs, total_fat, total_weight, is_favorite, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`,
    '', newName, original.meal_type, original.total_calories, original.total_protein,
    original.total_carbs, original.total_fat, original.total_weight || 0
  );
  const newId = result.lastInsertRowId;
  for (let i = 0; i < original.foods.length; i++) {
    const f = original.foods[i];
    await db.runAsync(
      `INSERT INTO saved_meal_foods (meal_id, food_id, food_name, quantity, unit, calories, protein, carbs, fat, fiber, position_order)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId, f.food_name, f.quantity, f.unit, f.calories, f.protein, f.carbs, f.fat, f.fiber || 0, i
    );
  }
  return newId;
}

export async function logMeal(
  userId: string, mealId: number, mealType: string,
): Promise<void> {
  const meal = await getMealById(mealId);
  if (!meal) throw new Error('Meal not found');
  const db = await getDb();
  const now = new Date().toISOString();
  for (const f of meal.foods) {
    const ratio = f.quantity / 100 || 1;
    await db.runAsync(
      `INSERT OR REPLACE INTO recent_foods (user_id, food_id, food_name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, last_quantity, last_unit, last_meal_type, log_count, last_logged, source)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT log_count FROM recent_foods WHERE user_id = ? AND food_name = ?), 0) + 1, ?, 'meal')`,
      userId, f.food_name, f.calories / ratio, f.protein / ratio,
      f.carbs / ratio, f.fat / ratio, (f.fiber || 0) / ratio,
      '1 serving', f.quantity, f.quantity, f.unit, mealType,
      userId, f.food_name, now
    );
    await supabase.from('meal_logs').insert({
      user_id: userId, food_name: f.food_name,
      calories: f.calories, protein_g: f.protein, carbs_g: f.carbs, fat_g: f.fat,
      fiber_g: f.fiber || 0, meal_type: mealType, logged_at: now,
    }).maybeSingle();
  }
  await db.runAsync(
    `UPDATE saved_meals SET log_count = COALESCE(log_count, 0) + 1, last_logged = ? WHERE id = ?`,
    now, mealId
  );
}

export async function getFrequentMeals(userId: string, limit: number = 5): Promise<SavedMeal[]> {
  const db = await getDb();
  const meals = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals WHERE user_id = ? AND log_count > 0 ORDER BY log_count DESC, last_logged DESC LIMIT ?`,
    userId, limit
  );
  return Promise.all(meals.map(async (m: any) => attachMealFoods(db, m)));
}

export async function getRecentMeals(userId: string, limit: number = 5): Promise<SavedMeal[]> {
  const db = await getDb();
  const meals = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals WHERE user_id = ? ORDER BY last_logged DESC, updated_at DESC LIMIT ?`,
    userId, limit
  );
  return Promise.all(meals.map(async (m: any) => attachMealFoods(db, m)));
}

export async function getMealsByTimeOfDay(userId: string, mealType: string, limit: number = 3): Promise<SavedMeal[]> {
  const db = await getDb();
  const meals = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals WHERE user_id = ? AND meal_type = ? ORDER BY is_favorite DESC, log_count DESC, last_logged DESC LIMIT ?`,
    userId, mealType, limit
  );
  return Promise.all(meals.map(async (m: any) => attachMealFoods(db, m)));
}

export async function getFavoriteMeals(userId: string, limit: number = 10): Promise<SavedMeal[]> {
  const db = await getDb();
  const meals = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals WHERE user_id = ? AND is_favorite = 1 ORDER BY log_count DESC, created_at DESC LIMIT ?`,
    userId, limit
  );
  return Promise.all(meals.map(async (m: any) => attachMealFoods(db, m)));
}

export async function searchMeals(userId: string, query: string, limit: number = 10): Promise<SavedMeal[]> {
  const db = await getDb();
  const pattern = `%${query.toLowerCase()}%`;
  const meals = await db.getAllAsync<any>(
    `SELECT * FROM saved_meals WHERE user_id = ? AND LOWER(meal_name) LIKE ? ORDER BY is_favorite DESC, log_count DESC LIMIT ?`,
    userId, pattern, limit
  );
  return Promise.all(meals.map(async (m: any) => attachMealFoods(db, m)));
}

export async function getYesterdayMeals(userId: string): Promise<{ meal_type: string; foods: { food_name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number }[] }[]> {
  const db = await getDb();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
  const rows = await db.getAllAsync<any>(
    `SELECT DISTINCT meal_type, food_name, last_quantity, last_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g FROM recent_foods
     WHERE user_id = ? AND last_logged >= ? AND last_logged <= ?
     ORDER BY meal_type`,
    userId, start.toISOString(), end.toISOString()
  );
  const grouped: Record<string, any[]> = {};
  for (const r of rows) {
    if (!grouped[r.meal_type]) grouped[r.meal_type] = [];
    grouped[r.meal_type].push({
      food_name: r.food_name, quantity: r.last_quantity, unit: r.last_unit,
      calories: r.calories_per_100g * (r.last_quantity / 100),
      protein: r.protein_per_100g * (r.last_quantity / 100),
      carbs: r.carbs_per_100g * (r.last_quantity / 100),
      fat: r.fat_per_100g * (r.last_quantity / 100),
    });
  }
  return Object.entries(grouped).map(([meal_type, foods]) => ({ meal_type, foods }));
}

export async function getSuggestedMeals(userId: string, mealType: string, limit: number = 3): Promise<SavedMeal[]> {
  return getMealsByTimeOfDay(userId, mealType, limit);
}

export async function updateMealFoods(
  mealId: number,
  foods: { food_name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fat: number; fiber?: number }[],
): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM saved_meal_foods WHERE meal_id = ?', mealId);
  let totalCal = 0, totalProt = 0, totalCarb = 0, totalFat = 0, totalFib = 0, totalW = 0;
  for (let i = 0; i < foods.length; i++) {
    const f = foods[i];
    const fib = f.fiber || 0;
    totalCal += f.calories; totalProt += f.protein; totalCarb += f.carbs; totalFat += f.fat; totalFib += fib;
    totalW += f.quantity;
    await db.runAsync(
      `INSERT INTO saved_meal_foods (meal_id, food_name, quantity, unit, calories, protein, carbs, fat, fiber, position_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      mealId, f.food_name, f.quantity, f.unit, f.calories, f.protein, f.carbs, f.fat, fib, i
    );
  }
  await db.runAsync(
    `UPDATE saved_meals SET total_calories = ?, total_protein = ?, total_carbs = ?, total_fat = ?, total_weight = ?, updated_at = datetime('now') WHERE id = ?`,
    totalCal, totalProt, totalCarb, totalFat, totalW, mealId
  );
}

async function attachMealFoods(db: any, meal: any): Promise<SavedMeal> {
  const foods: any[] = await db.getAllAsync('SELECT * FROM saved_meal_foods WHERE meal_id = ? ORDER BY position_order', meal.id);
  return {
    id: meal.id, meal_name: meal.meal_name, meal_type: meal.meal_type,
    total_calories: meal.total_calories, total_protein: meal.total_protein,
    total_carbs: meal.total_carbs, total_fat: meal.total_fat,
    total_fiber: meal.total_fiber, total_weight: meal.total_weight,
    is_favorite: meal.is_favorite, log_count: meal.log_count,
    last_logged: meal.last_logged, meal_thumbnail: meal.meal_thumbnail || generateMealEmoji(foods.map((f: any) => f.food_name)),
    position_order: meal.position_order,
    foods: foods.map((f: any) => ({
      id: f.id, food_name: f.food_name, quantity: f.quantity, unit: f.unit,
      calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, fiber: f.fiber,
    })),
    created_at: meal.created_at, updated_at: meal.updated_at,
  };
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
  try {
    return db.getAllAsync<any>(
      `SELECT * FROM foods WHERE IFNULL(verified, 0) = 1 ORDER BY canonical_name LIMIT ?`, limit
    );
  } catch { return []; }
}

export async function getHighProteinFoods(limit: number = 20): Promise<FoodEntry[]> {
  const db = await getDb();
  return db.getAllAsync<any>(
    `SELECT * FROM foods WHERE protein_per_100g >= 15 ORDER BY protein_per_100g DESC LIMIT ?`, limit
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

export interface MealHistoryGroup {
  dateKey: string;
  dateLabel: string;
  meals: {
    mealType: string;
    mealLabel: string;
    foods: { foodName: string; calories: number; protein_g: number; carbs_g: number; fat_g: number; id: string }[];
    totalCalories: number;
  }[];
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};

function formatDateLabel(dateStr: string): string {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(dateStr);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export async function getRecentMealHistory(userId: string, daysBack: number = 7): Promise<MealHistoryGroup[]> {
  try {
    const start = new Date(); start.setDate(start.getDate() - daysBack); start.setHours(0,0,0,0);
    const { data, error } = await supabase
      .from('meal_logs')
      .select('id, food_name, calories, protein_g, carbs_g, fat_g, meal_type, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', start.toISOString())
      .order('logged_at', { ascending: false });
    if (error || !data) return [];
    const groups: Record<string, { mealType: string; foods: any[] }> = {};
    for (const row of data) {
      if (!row.meal_type) continue;
      const d = new Date(row.logged_at);
      const dateKey = d.toDateString();
      const key = `${dateKey}_${row.meal_type}`;
      if (!groups[key]) groups[key] = { mealType: row.meal_type, foods: [] };
      groups[key].foods.push(row);
    }
    const dateOrder: Record<string, MealHistoryGroup> = {};
    for (const [key, g] of Object.entries(groups)) {
      const dateKey = key.split('_')[0];
      if (!dateOrder[dateKey]) dateOrder[dateKey] = { dateKey, dateLabel: formatDateLabel(dateKey), meals: [] };
      dateOrder[dateKey].meals.push({
        mealType: g.mealType,
        mealLabel: MEAL_LABELS[g.mealType] || g.mealType,
        foods: g.foods.map(f => ({ foodName: f.food_name, calories: f.calories || 0, protein_g: f.protein_g || 0, carbs_g: f.carbs_g || 0, fat_g: f.fat_g || 0, id: f.id })),
        totalCalories: g.foods.reduce((s, f) => s + (f.calories || 0), 0),
      });
    }
    return Object.values(dateOrder).sort((a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime());
  } catch (e) {
    console.error('[foodSearch] getRecentMealHistory error:', e);
    return [];
  }
}

/**
 * Convert restaurant food total values to per-100g values.
 * Restaurant DB stores total calories/macros per serving.
 * The food-detail screen expects per-100g values for scaling.
 */
export function restaurantTotalToPer100g(
  totalCal: number, totalProt: number, totalCarb: number, totalFat: number,
  servingGrams: number, totalFiber = 0,
): { calPer100g: number; protPer100g: number; carbPer100g: number; fatPer100g: number; fiberPer100g: number } {
  if (servingGrams <= 0) servingGrams = 100;
  const f = 100 / servingGrams;
  return {
    calPer100g: Math.round(totalCal * f),
    protPer100g: Math.round(totalProt * f * 10) / 10,
    carbPer100g: Math.round(totalCarb * f * 10) / 10,
    fatPer100g: Math.round(totalFat * f * 10) / 10,
    fiberPer100g: Math.round((totalFiber || 0) * f * 10) / 10,
  };
}
