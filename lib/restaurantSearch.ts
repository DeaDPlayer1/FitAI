import { getDb } from './db';
import { canonicalizeRestaurantFood, detectBrand, getAllBrands, getBrandMenuItems, getBrandMenuCategories, BRAND_EMOJI_MAP } from './restaurantCanonicalizer';

export interface RestaurantBrand {
  id: number;
  brand_name: string;
  aliases: string;
  cuisine: string;
  country: string;
  logo_url: string;
  menu_updated_at: string | null;
  is_verified: number;
  item_count?: number;
}

export interface RestaurantFoodItem {
  id: number;
  brand_id: number;
  item_name: string;
  canonical_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  serving_size: string;
  serving_weight: number;
  aliases: string;
  search_terms: string;
  category: string;
  country: string;
  is_verified: number;
  brand_name?: string;
}

export interface RestaurantSearchResult {
  items: RestaurantFoodItem[];
  brands: RestaurantBrand[];
  suggestions: string[];
}

let seedPromise: Promise<void> | null = null;

async function ensureSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const db = await getDb();
      // Check if database is up to date; re-seed from JSON if outdated
      const metaSeed = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM _meta WHERE key = 'restaurant_db_version'"
      );
      if (metaSeed && metaSeed.value === '5') return;

      if (metaSeed) {
        // Clear existing restaurant data
        try { await db.execAsync('DELETE FROM restaurant_foods'); } catch {}
        try { await db.execAsync('DELETE FROM restaurant_brands'); } catch {}
        try { await db.execAsync('DELETE FROM restaurant_foods_fts'); } catch {}
      }
      const resData = require('@/assets/restaurant_food_database.json');
      if (!Array.isArray(resData)) return;
      for (const brand of resData) {
        const existingBrand = await db.getFirstAsync<RestaurantBrand>(
          'SELECT id FROM restaurant_brands WHERE brand_name = ?', brand.brand
        );
        let brandId: number;
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          const result = await db.runAsync(
            `INSERT OR IGNORE INTO restaurant_brands (brand_name, aliases, cuisine, country, is_verified)
             VALUES (?, ?, ?, ?, 1)`,
            brand.brand, JSON.stringify(brand.aliases || []), brand.cuisine || '', brand.country || ''
          );
          brandId = result.lastInsertRowId;
        }
        if (!brandId) continue;
        for (const item of brand.items || []) {
          const searchTerms = [
            item.name.toLowerCase(), item.canonical.toLowerCase(),
            ...(item.aliases || []).map((a: string) => a.toLowerCase()),
            item.cat?.toLowerCase() || '', brand.brand.toLowerCase()
          ].join(' ').trim();
          await db.runAsync(
            `INSERT OR IGNORE INTO restaurant_foods
             (brand_id, item_name, canonical_name, calories, protein, carbs, fat, fiber, sugar, sodium,
              serving_size, serving_weight, aliases, search_terms, category, country, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            brandId, item.name, item.canonical, item.cal, item.p, item.c, item.f,
            item.fb || 0, item.sg || 0, item.na || 0,
            item.sv || '1 serving', item.g || 100,
            JSON.stringify(item.aliases || []), searchTerms,
            normalizeCategory(item.cat || ''), item.ctry || brand.country || ''
          );
        }
      }
      try {
        await (await getDb()).execAsync(`INSERT INTO restaurant_foods_fts(restaurant_foods_fts) VALUES('rebuild')`);
      } catch {}
      try {
        await db.runAsync(
          "INSERT OR REPLACE INTO _meta (key, value) VALUES ('restaurant_db_version', '5')"
        );
      } catch {}
    } catch (e) {
      console.warn('[restaurantSearch] seed error:', e);
    }
  })();
  return seedPromise;
}

export async function searchRestaurantFoods(
  query: string,
  limit: number = 20,
): Promise<RestaurantSearchResult> {
  const trimmed = query.trim().toLowerCase();
  const db = await getDb();
  await ensureSeeded();

  // Detect if query is for a specific brand
  const brandName = detectBrand(trimmed);
  let brands: RestaurantBrand[] = [];
  let items: RestaurantFoodItem[] = [];
  let suggestions: string[] = [];

  // If no specific brand, check if query matches a brand name broadly
  if (!brandName) {
    brands = await db.getAllAsync<any>(
      `SELECT * FROM restaurant_brands WHERE LOWER(brand_name) LIKE ? OR LOWER(IFNULL(aliases, '')) LIKE ? LIMIT 5`,
      `%${trimmed}%`, `%${trimmed}%`
    );
  }

  if (brandName) {
    // Search within brand
    const brandRow = await db.getFirstAsync<RestaurantBrand>(
      'SELECT id, brand_name FROM restaurant_brands WHERE LOWER(brand_name) = ?',
      brandName.toLowerCase()
    );
    if (brandRow) {
      brands = [brandRow];
      items = await db.getAllAsync<any>(
        `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
         JOIN restaurant_brands rb ON rb.id = rf.brand_id
         WHERE rf.brand_id = ?
         ORDER BY rf.category, rf.item_name
         LIMIT ?`,
        brandRow.id, limit
      );
    }
  } else {
    // Search across all foods
    try {
      const ftsQuery = trimmed.split(/\s+/).map(w => `${w}*`).join(' ');
      items = await db.getAllAsync<any>(
        `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
         JOIN restaurant_brands rb ON rb.id = rf.brand_id
         JOIN restaurant_foods_fts ON restaurant_foods_fts.rowid = rf.id
         WHERE restaurant_foods_fts MATCH ?
         ORDER BY rank
         LIMIT ?`,
        ftsQuery, limit
      );
    } catch {}

    if (items.length === 0) {
      const likePattern = `%${trimmed}%`;
      items = await db.getAllAsync<any>(
        `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
         JOIN restaurant_brands rb ON rb.id = rf.brand_id
         WHERE LOWER(rf.item_name) LIKE ?
            OR LOWER(rf.canonical_name) LIKE ?
            OR LOWER(rf.aliases) LIKE ?
            OR LOWER(rf.search_terms) LIKE ?
            OR LOWER(rf.category) LIKE ?
         LIMIT ?`,
        likePattern, likePattern, likePattern, likePattern, likePattern, limit
      );
    }
  }

  // Prioritize exact prefix
  const exactPrefix = items.filter(i => i.canonical_name.toLowerCase().startsWith(trimmed));
  const rest = items.filter(i => !i.canonical_name.toLowerCase().startsWith(trimmed));
  items = [...exactPrefix, ...rest].slice(0, limit);

  // Suggestions from canonical names
  if (items.length > 0) {
    suggestions = items.slice(0, 5).map(i => i.canonical_name);
  }

  return { items, brands, suggestions };
}

export async function getBrandById(brandId: number): Promise<RestaurantBrand | null> {
  const db = await getDb();
  return db.getFirstAsync<any>('SELECT * FROM restaurant_brands WHERE id = ?', brandId);
}

function normalizeCategory(cat: string): string {
  return cat.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

export async function getAllBrandFoods(brandId: number): Promise<RestaurantFoodItem[]> {
  const db = await getDb();
  return db.getAllAsync<any>(
    `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
     JOIN restaurant_brands rb ON rb.id = rf.brand_id
     WHERE rf.brand_id = ?
     ORDER BY rf.item_name`,
    brandId
  );
}

export async function getBrandFoodsByCategory(
  brandId: number,
  category: string,
): Promise<RestaurantFoodItem[]> {
  const db = await getDb();
  const normalized = normalizeCategory(category.toLowerCase());
  return db.getAllAsync<any>(
    `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
     JOIN restaurant_brands rb ON rb.id = rf.brand_id
     WHERE rf.brand_id = ? AND (LOWER(rf.category) = ? OR rf.category = '')
     ORDER BY rf.item_name`,
    brandId, normalized
  );
}

export async function getBrandCategoriesWithCounts(
  brandId: number,
): Promise<{ category: string; count: number }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT category, COUNT(*) as count FROM restaurant_foods
     WHERE brand_id = ? AND category != ''
     GROUP BY category
     ORDER BY COUNT(*) DESC`,
    brandId
  );
  const merged: Record<string, number> = {};
  for (const r of rows) {
    const norm = normalizeCategory(r.category);
    merged[norm] = (merged[norm] || 0) + r.count;
  }
  return Object.entries(merged).map(([category, count]) => ({ category, count }));
}

export async function getRestaurantFoodById(id: number): Promise<RestaurantFoodItem | null> {
  const db = await getDb();
  return db.getFirstAsync<any>(
    `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
     JOIN restaurant_brands rb ON rb.id = rf.brand_id
     WHERE rf.id = ?`,
    id
  );
}

export async function getRecentRestaurantFoods(
  brandId: number,
  limit: number = 10,
): Promise<RestaurantFoodItem[]> {
  const db = await getDb();
  return db.getAllAsync<any>(
    `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
     JOIN restaurant_brands rb ON rb.id = rf.brand_id
     WHERE rf.brand_id = ?
     ORDER BY rf.id DESC
     LIMIT ?`,
    brandId, limit
  );
}

export async function getAllBrandsFromDb(): Promise<RestaurantBrand[]> {
  const db = await getDb();
  await ensureSeeded();
  return db.getAllAsync<any>(
    `SELECT rb.*, (SELECT COUNT(*) FROM restaurant_foods rf WHERE rf.brand_id = rb.id) AS item_count
     FROM restaurant_brands rb ORDER BY rb.brand_name`
  );
}

export function getBrandEmoji(brandName: string): string {
  return BRAND_EMOJI_MAP[brandName] || '🍽️';
}

const CUISINE_CATEGORIES: Record<string, { icon: string; bg: string }> = {
  'indian': { icon: 'coffee', bg: '#10B981' },
  'fast food': { icon: 'navigation', bg: '#F97316' },
  'american fast food': { icon: 'navigation', bg: '#F97316' },
  'coffee': { icon: 'coffee', bg: '#92400E' },
  'pizza': { icon: 'circle', bg: '#EF4444' },
  'healthy': { icon: 'leaf', bg: '#22C55E' },
  'bakery': { icon: 'cake', bg: '#EC4899' },
  'dessert': { icon: 'star', bg: '#EC4899' },
  'ice cream': { icon: 'star', bg: '#EC4899' },
  'mexican': { icon: 'sunrise', bg: '#F59E0B' },
  'chinese': { icon: 'globe', bg: '#EF4444' },
  'italian': { icon: 'map-pin', bg: '#3B82F6' },
  'south indian': { icon: 'coffee', bg: '#10B981' },
  'north indian': { icon: 'coffee', bg: '#10B981' },
  'american': { icon: 'navigation', bg: '#F97316' },
  'global': { icon: 'globe', bg: '#6C3CE1' },
};

export function getChainIcon(brandName: string, cuisine?: string): { icon: string; bg: string } {
  for (const [key, val] of Object.entries(CUISINE_CATEGORIES)) {
    if ((cuisine || '').toLowerCase().includes(key)) return val;
  }
  const lower = brandName.toLowerCase();
  if (lower.includes('pizza') || lower.includes("pino'z") || lower.includes('oven story')) return { icon: 'circle', bg: '#EF4444' };
  if (lower.includes('coffee') || lower.includes('starbucks') || lower.includes('dunkin') || lower.includes('chaayos') || lower.includes('ccd')) return { icon: 'coffee', bg: '#92400E' };
  if (lower.includes('mcdonald') || lower.includes('burger') || lower.includes('kfc') || lower.includes('wendy') || lower.includes('popeyes') || lower.includes('chick') || lower.includes('five guys') || lower.includes('shake shack') || lower.includes('in-n-out') || lower.includes('jollibee')) return { icon: 'navigation', bg: '#F97316' };
  if (lower.includes('domino') || lower.includes('pizza hut') || lower.includes("papa john") || lower.includes("pino'z") || lower.includes("oven story") || lower.includes("la pino")) return { icon: 'circle', bg: '#EF4444' };
  if (lower.includes('subway') || lower.includes('taco bell') || lower.includes('chipotle')) return { icon: 'sunrise', bg: '#F59E0B' };
  if (lower.includes('natural ice cream') || lower.includes('theobroma') || lower.includes('dunkin')) return { icon: 'star', bg: '#EC4899' };
  if (lower.includes('indian') || lower.includes('haldiram') || lower.includes('bikaner') || lower.includes('barbeque nation') || lower.includes('behrouz') || lower.includes('faasos') || lower.includes('wow momo') || lower.includes('sagar ratna') || lower.includes('jumboking') || lower.includes('goli vada pav') || lower.includes('eatfit') || lower.includes('behrouz') || lower.includes('mainland china')) return { icon: 'coffee', bg: '#10B981' };
  return { icon: 'globe', bg: '#6C3CE1' };
}

export async function searchBrands(query: string): Promise<RestaurantBrand[]> {
  const db = await getDb();
  await ensureSeeded();
  const pattern = `%${query.toLowerCase()}%`;
  return db.getAllAsync<any>(
    `SELECT * FROM restaurant_brands
     WHERE LOWER(brand_name) LIKE ? OR LOWER(IFNULL(aliases, '')) LIKE ? OR LOWER(IFNULL(cuisine, '')) LIKE ?
     ORDER BY brand_name
     LIMIT 10`,
    pattern, pattern, pattern
  );
}

export async function menuSearch(
  brandName: string,
  category?: string,
): Promise<RestaurantFoodItem[]> {
  const db = await getDb();
  await ensureSeeded();
  const brand = await db.getFirstAsync<RestaurantBrand>(
    'SELECT id FROM restaurant_brands WHERE LOWER(brand_name) = ?',
    brandName.toLowerCase()
  );
  if (!brand) return [];
  if (category) {
    return db.getAllAsync<any>(
      `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
       JOIN restaurant_brands rb ON rb.id = rf.brand_id
       WHERE rf.brand_id = ? AND LOWER(rf.category) = ?
       ORDER BY rf.item_name`,
      brand.id, category.toLowerCase()
    );
  }
  return db.getAllAsync<any>(
    `SELECT rf.*, rb.brand_name FROM restaurant_foods rf
     JOIN restaurant_brands rb ON rb.id = rf.brand_id
     WHERE rf.brand_id = ?
     ORDER BY rf.category, rf.item_name`,
    brand.id
  );
}

export { BRAND_EMOJI_MAP };
