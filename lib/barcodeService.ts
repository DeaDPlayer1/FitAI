import { getDb } from './db';
import indianBarcodes from '@/assets/indian_barcodes.json';

function getUsdaApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_USDA_API_KEY || process.env.USDA_API_KEY;
  return key?.trim() || null;
}
let bundledSeeded = false;

// ── Rate limiter for Open Food Facts ──
let offRequestTimestamps: number[] = [];
const OFF_MAX_RPS = 10; // 10 requests per second max
const OFF_MIN_INTERVAL = 100; // 100ms between requests

async function rateLimitOpenFoodFacts(): Promise<void> {
  const now = Date.now();
  offRequestTimestamps = offRequestTimestamps.filter(t => now - t < 1000);
  while (offRequestTimestamps.length >= OFF_MAX_RPS) {
    await new Promise(resolve => setTimeout(resolve, OFF_MIN_INTERVAL));
    offRequestTimestamps = offRequestTimestamps.filter(t => Date.now() - t < 1000);
  }
  offRequestTimestamps.push(now);
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 && attempt < retries) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error('Fetch failed after retries');
}

async function seedBundledBarcodes(db: any): Promise<void> {
  if (bundledSeeded) return;
  bundledSeeded = true;
  try {
    const count = await db.getFirstAsync(
      "SELECT COUNT(*) as c FROM food_cache WHERE source = 'bundled_barcode'"
    ) as { c: number } | undefined;
    if (count && count.c > 0) return;
    const products = indianBarcodes as any[];
    for (const p of products) {
      const existing = await db.getFirstAsync(
        'SELECT id, barcode FROM food_cache WHERE food_name = ?',
        p.food_name.toLowerCase()
      ) as any;
      if (existing) {
        if (!existing.barcode) {
          await db.runAsync(
            `UPDATE food_cache SET barcode = ?, brand = ?, image_url = ?,
             calories_per_100g = ?, protein_per_100g = ?, carbs_per_100g = ?,
             fat_per_100g = ?, fiber_per_100g = ?, sugar_per_100g = ?,
             sodium_per_100g = ?, serving_size = ?, serving_grams = ?,
             source = 'bundled_barcode'
             WHERE id = ?`,
            p.barcode, p.brand, null,
            p.calories_per_100g, p.protein_per_100g, p.carbs_per_100g,
            p.fat_per_100g, p.fiber_per_100g || 0, p.sugar_per_100g || 0,
            p.sodium_per_100g || 0, p.serving_size || '100g', p.serving_grams || 100,
            existing.id
          );
        }
      } else {
        await db.runAsync(
          `INSERT INTO food_cache
           (food_name, barcode, brand, image_url, calories_per_100g, protein_per_100g,
            carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g,
            sodium_per_100g, serving_size, serving_grams, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'bundled_barcode')`,
          p.food_name.toLowerCase(), p.barcode, p.brand, null,
          p.calories_per_100g, p.protein_per_100g, p.carbs_per_100g,
          p.fat_per_100g, p.fiber_per_100g || 0, p.sugar_per_100g || 0,
          p.sodium_per_100g || 0, p.serving_size || '100g', p.serving_grams || 100
        );
      }
    }
    console.log('[barcode] Seeded', products.length, 'bundled Indian barcodes');
  } catch (err) {
    console.error('[barcode] Seed error:', err);
  }
}

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  serving_size: string;
  quantity: string;
  image_url: string | null;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  fiber_100g: number;
  sugar_100g: number;
  sodium_100g: number;
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  let db;
  try {
    db = await getDb();
  } catch {
    console.error('[barcode] DB init failed');
    return null;
  }

  // STEP 0: Seed bundled Indian barcodes (one-time)
  await seedBundledBarcodes(db);

  // STEP 1: Check local cache first (instant, zero cost)
  try {
    const cached = await db.getFirstAsync<any>(
      'SELECT * FROM food_cache WHERE barcode = ?', barcode
    );

    if (cached) {
      const hasNutrition = (cached.calories_per_100g || 0) > 0 || (cached.protein_per_100g || 0) > 0 ||
        (cached.carbs_per_100g || 0) > 0 || (cached.fat_per_100g || 0) > 0;
      if (hasNutrition || cached.source === 'open_food_facts') {
        console.log('[barcode] Cache hit:', barcode);
        return {
          barcode,
          name: cached.food_name || '',
          brand: cached.brand || '',
          serving_size: cached.serving_size || '100g',
          quantity: '',
          image_url: cached.image_url || null,
          calories_100g: cached.calories_per_100g || 0,
          protein_100g: cached.protein_per_100g || 0,
          carbs_100g: cached.carbs_per_100g || 0,
          fat_100g: cached.fat_per_100g || 0,
          fiber_100g: cached.fiber_per_100g || 0,
          sugar_100g: cached.sugar_per_100g || 0,
          sodium_100g: cached.sodium_per_100g || 0,
        };
      }
      // Cache hit but no nutrition data — delete stale entry and re-fetch from API
      console.log('[barcode] Cache hit with zero nutrition, re-fetching:', barcode);
      try {
        await db.runAsync('DELETE FROM food_cache WHERE barcode = ?', barcode);
      } catch {}
    }
  } catch (cacheErr) {
    console.error('[barcode] Cache lookup error:', cacheErr);
  }

  // STEP 2: Try multiple API sources in sequence

  // ── Source A: Open Food Facts ──
  const offProduct = await tryOpenFoodFacts(barcode);
  if (offProduct) {
    await cacheProduct(db, offProduct, 'open_food_facts');
    await saveScanHistory(db, barcode, offProduct, 'open_food_facts');
    return offProduct;
  }

  // ── Source B: USDA FoodData Central ──
  const usdaProduct = await tryUsda(barcode);
  if (usdaProduct) {
    await cacheProduct(db, usdaProduct, 'usda');
    await saveScanHistory(db, barcode, usdaProduct, 'usda');
    return usdaProduct;
  }

  await saveScanHistory(db, barcode, null, 'not_found');
  return null;
}

async function saveScanHistory(db: any, barcode: string, product: FoodProduct | null, source: string): Promise<void> {
  try {
    await db.runAsync(
      `INSERT INTO barcode_scan_history
       (barcode, food_name, brand, image_url, calories_100g, protein_100g, carbs_100g,
        fat_100g, fiber_100g, sugar_100g, sodium_100g, serving_size, scanned_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      barcode,
      product?.name || 'Unknown',
      product?.brand || '',
      product?.image_url || null,
      product?.calories_100g || 0,
      product?.protein_100g || 0,
      product?.carbs_100g || 0,
      product?.fat_100g || 0,
      product?.fiber_100g || 0,
      product?.sugar_100g || 0,
      product?.sodium_100g || 0,
      product?.serving_size || '100g',
      new Date().toISOString(),
      product ? source : 'not_found'
    );
  } catch (err) {
    console.error('[barcode] History save error:', err);
  }
}

export async function getScanHistory(limit = 20): Promise<any[]> {
  try {
    const db = await getDb();
    return await db.getAllAsync<any>(
      'SELECT * FROM barcode_scan_history ORDER BY scanned_at DESC LIMIT ?', limit
    );
  } catch {
    return [];
  }
}

export async function clearScanHistory(): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM barcode_scan_history');
  } catch {}
}

async function tryOpenFoodFacts(barcode: string): Promise<FoodProduct | null> {
  console.log('[barcode] Querying Open Food Facts:', barcode);
  try {
    await rateLimitOpenFoodFacts();
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,serving_size,nutriments,image_url,quantity`;
    const response = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'FitnessApp/1.0 (nutrition tracking)' },
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments || {};

    let calories = Number(n['energy-kcal_100g'] || n['energy_100g'] / 4.184 || 0);
    if (!calories) {
      const kj = Number(n['energy-kj_100g'] || 0);
      if (kj > 0) calories = Math.round(kj / 4.184);
    }

    const hasNutrition = calories > 0 ||
      Number(n['proteins_100g'] || 0) > 0 ||
      Number(n['carbohydrates_100g'] || 0) > 0 ||
      Number(n['fat_100g'] || 0) > 0;

    if (!hasNutrition) return null;

    return {
      barcode,
      name: p.product_name || 'Unknown Product',
      brand: p.brands || '',
      serving_size: p.serving_size || '100g',
      quantity: p.quantity || '',
      image_url: p.image_url || null,
      calories_100g: calories,
      protein_100g: Number(n['proteins_100g'] || 0),
      carbs_100g: Number(n['carbohydrates_100g'] || 0),
      fat_100g: Number(n['fat_100g'] || 0),
      fiber_100g: Number(n['fiber_100g'] || n['fibre_100g'] || 0),
      sugar_100g: Number(n['sugars_100g'] || 0),
      sodium_100g: Number(n['sodium_100g'] || 0),
    };
  } catch (err) {
    console.error('[barcode] Open Food Facts failed:', err);
    return null;
  }
}

async function tryUsda(barcode: string): Promise<FoodProduct | null> {
  const usdaKey = getUsdaApiKey();
  if (!usdaKey) return null;

  console.log('[barcode] Querying USDA FoodData Central:', barcode);
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}&query=${encodeURIComponent(barcode)}&dataType=Branded&pageSize=1`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.foods || data.foods.length === 0) return null;

    const food = data.foods[0];
    if (!food.gtinUpc || food.gtinUpc !== barcode) return null;

    const nutrients: Record<string, number> = {};
    for (const n of (food.foodNutrients || [])) {
      const name = n.nutrientName?.toLowerCase() || '';
      const val = n.value || 0;
      if (name.includes('energy') && n.unitName === 'KCAL') nutrients.energy = val;
      if (name === 'protein') nutrients.protein = val;
      if (name === 'carbohydrate, by difference') nutrients.carbs = val;
      if (name === 'total lipid (fat)') nutrients.fat = val;
      if (name === 'fiber, total dietary') nutrients.fiber = val;
      if (name === 'total sugars') nutrients.sugar = val;
      if (name === 'sodium, na') nutrients.sodium = val;
    }

    // Convert per-serving to per-100g
    const servingSize = food.servingSize || 100;
    const ratio = 100 / servingSize;

    const calories = Math.round((nutrients.energy || 0) * ratio);

    const hasNutrition = calories > 0 ||
      (nutrients.protein || 0) > 0 ||
      (nutrients.carbs || 0) > 0 ||
      (nutrients.fat || 0) > 0;

    if (!hasNutrition) return null;

    return {
      barcode,
      name: food.description || 'Unknown Product',
      brand: food.brandName || food.brandOwner || '',
      serving_size: food.householdServingFullText || (servingSize + 'g'),
      quantity: food.packageWeight || '',
      image_url: null,
      calories_100g: calories,
      protein_100g: round1((nutrients.protein || 0) * ratio),
      carbs_100g: round1((nutrients.carbs || 0) * ratio),
      fat_100g: round1((nutrients.fat || 0) * ratio),
      fiber_100g: round1((nutrients.fiber || 0) * ratio),
      sugar_100g: round1((nutrients.sugar || 0) * ratio),
      sodium_100g: round1(((nutrients.sodium || 0) / 1000) * ratio), // USDA returns MG per serving, convert to G per 100g
    };
  } catch (err) {
    console.error('[barcode] USDA lookup failed:', err);
    return null;
  }
}

async function cacheProduct(db: any, product: FoodProduct, source: string): Promise<void> {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO food_cache
       (barcode, food_name, brand, image_url, calories_per_100g, protein_per_100g,
        carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
        serving_size, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      product.barcode, product.name, product.brand, product.image_url,
      product.calories_100g, product.protein_100g, product.carbs_100g,
      product.fat_100g, product.fiber_100g, product.sugar_100g, product.sodium_100g,
      product.serving_size, source
    );
  } catch (cacheErr) {
    console.error('[barcode] Cache write error:', cacheErr);
  }
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

export function parseServingGrams(servingStr: string): number | null {
  if (!servingStr) return null;
  const match = servingStr.match(/(\d+\.?\d*)\s*(g|ml)/i);
  return match ? parseFloat(match[1]) : null;
}

export function autoDetectMealType(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'Breakfast';
  if (hour >= 10 && hour < 14) return 'Lunch';
  if (hour >= 14 && hour < 18) return 'Snack';
  if (hour >= 18 && hour < 22) return 'Dinner';
  return 'Snack';
}
