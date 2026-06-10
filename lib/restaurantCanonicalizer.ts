import restaurantDbJson from '@/assets/restaurant_food_database.json';

interface BrandInfo {
  brand: string;
  aliases: string[];
  cuisine: string;
  country: string;
}

interface ItemInfo {
  brand: string;
  itemName: string;
  canonicalName: string;
  category: string;
}

const BRANDS: BrandInfo[] = (restaurantDbJson as any[]).map(b => ({
  brand: b.brand,
  aliases: b.aliases || [],
  cuisine: b.cuisine || '',
  country: b.country || '',
}));

const BRAND_ALIAS_MAP: Record<string, string> = {};
const BRAND_NAME_LOWER_MAP: Record<string, string> = {};

for (const b of BRANDS) {
  const bl = b.brand.toLowerCase();
  BRAND_NAME_LOWER_MAP[bl] = b.brand;
  for (const a of b.aliases) {
    BRAND_ALIAS_MAP[a.toLowerCase()] = b.brand;
  }
}

const STATIC_FOOD_MAP: Record<string, { canonical: string; brand: string; calories: number }> = {};
const brandItems: Record<string, { name: string; canonical: string; aliases: string[]; cat: string }[]> = {};

for (const brand of restaurantDbJson as any[]) {
  for (const item of brand.items || []) {
    const canon = item.canonical.toLowerCase();
    STATIC_FOOD_MAP[canon] = { canonical: item.canonical, brand: brand.brand, calories: item.cal };
    const key = item.name.toLowerCase();
    if (!STATIC_FOOD_MAP[key]) {
      STATIC_FOOD_MAP[key] = { canonical: item.canonical, brand: brand.brand, calories: item.cal };
    }
    for (const alias of (item.aliases || [])) {
      const aliasKey = alias.toLowerCase();
      if (!STATIC_FOOD_MAP[aliasKey]) {
        STATIC_FOOD_MAP[aliasKey] = { canonical: item.canonical, brand: brand.brand, calories: item.cal };
      }
    }
    if (!brandItems[brand.brand]) brandItems[brand.brand] = [];
    brandItems[brand.brand].push({
      name: item.name,
      canonical: item.canonical,
      aliases: item.aliases || [],
      cat: item.cat || '',
    });
  }
}

export interface CanonicalResult {
  canonicalName: string;
  brand: string | null;
  itemName: string | null;
  calories: number | null;
  confidence: 'high' | 'medium' | 'low';
}

export function canonicalizeRestaurantFood(input: string): CanonicalResult {
  const lower = input.toLowerCase().trim();
  if (!lower) return { canonicalName: input, brand: null, itemName: null, calories: null, confidence: 'low' };

  // 1. Direct match on static map
  if (STATIC_FOOD_MAP[lower]) {
    const m = STATIC_FOOD_MAP[lower];
    return { canonicalName: m.canonical, brand: m.brand, itemName: m.canonical, calories: m.calories, confidence: 'high' };
  }

  // 2. Try to detect brand prefix
  let detectedBrand: string | null = null;
  let remainingText = lower;

  for (const [alias, brandName] of Object.entries(BRAND_ALIAS_MAP)) {
    if (lower.startsWith(alias) || lower.includes(alias)) {
      detectedBrand = brandName;
      remainingText = lower.replace(alias, '').trim().replace(/^[,\s]+|[,\s]+$/g, '');
      break;
    }
  }

  if (!detectedBrand) {
    for (const [bl, bn] of Object.entries(BRAND_NAME_LOWER_MAP)) {
      if (lower.startsWith(bl) || lower.includes(bl)) {
        detectedBrand = bn;
        remainingText = lower.replace(bl, '').trim().replace(/^[,\s]+|[,\s]+$/g, '');
        break;
      }
    }
  }

  // 3. If brand detected, search within that brand's items
  if (detectedBrand && brandItems[detectedBrand]) {
    const items = brandItems[detectedBrand];
    const exactMatch = items.find(i => i.name.toLowerCase() === remainingText || i.canonical.toLowerCase() === remainingText);
    if (exactMatch) {
      const m = STATIC_FOOD_MAP[exactMatch.canonical.toLowerCase()];
      return { canonicalName: exactMatch.canonical, brand: detectedBrand, itemName: exactMatch.canonical, calories: m?.calories || null, confidence: 'high' };
    }
    const aliasMatch = items.find(i => i.aliases.some(a => a.toLowerCase() === remainingText));
    if (aliasMatch) {
      const m = STATIC_FOOD_MAP[aliasMatch.canonical.toLowerCase()];
      return { canonicalName: aliasMatch.canonical, brand: detectedBrand, itemName: aliasMatch.canonical, calories: m?.calories || null, confidence: 'high' };
    }
    const fuzzyMatch = items.find(i =>
      i.name.toLowerCase().includes(remainingText) ||
      i.canonical.toLowerCase().includes(remainingText) ||
      i.aliases.some(a => a.toLowerCase().includes(remainingText))
    );
    if (fuzzyMatch) {
      const m = STATIC_FOOD_MAP[fuzzyMatch.canonical.toLowerCase()];
      return { canonicalName: fuzzyMatch.canonical, brand: detectedBrand, itemName: fuzzyMatch.canonical, calories: m?.calories || null, confidence: 'medium' };
    }
  }

  // 4. No brand detected — search all items
  for (const [canon, info] of Object.entries(STATIC_FOOD_MAP)) {
    if (canon.includes(lower)) {
      return { canonicalName: info.canonical, brand: info.brand, itemName: info.canonical, calories: info.calories, confidence: 'medium' };
    }
  }

  // 5. Substring fuzzy across all
  for (const [canon, info] of Object.entries(STATIC_FOOD_MAP)) {
    const words = lower.split(/\s+/);
    const matchCount = words.filter(w => canon.includes(w)).length;
    if (matchCount >= Math.min(2, words.length)) {
      return { canonicalName: info.canonical, brand: info.brand, itemName: info.canonical, calories: info.calories, confidence: 'medium' };
    }
  }

  return { canonicalName: input, brand: detectedBrand, itemName: null, calories: null, confidence: 'low' };
}

export function detectBrand(input: string): string | null {
  const lower = input.toLowerCase().trim();
  for (const [alias, brandName] of Object.entries(BRAND_ALIAS_MAP)) {
    if (lower.includes(alias)) return brandName;
  }
  for (const [bl, bn] of Object.entries(BRAND_NAME_LOWER_MAP)) {
    if (lower.includes(bl)) return bn;
  }
  return null;
}

export function getBrandByName(name: string): BrandInfo | null {
  const lower = name.toLowerCase();
  for (const b of BRANDS) {
    if (b.brand.toLowerCase() === lower) return b;
    if (b.aliases.some(a => a.toLowerCase() === lower)) return b;
  }
  return BRANDS.find(b => b.brand.toLowerCase().includes(lower)) || null;
}

export function getAllBrands(): BrandInfo[] {
  return BRANDS;
}

export function getBrandMenuItems(brandName: string): { name: string; canonical: string; aliases: string[]; cat: string }[] {
  return brandItems[brandName] || [];
}

export function getBrandMenuCategories(brandName: string): string[] {
  const items = brandItems[brandName];
  if (!items) return [];
  const cats = new Set<string>();
  for (const item of items) {
    if (item.cat) cats.add(item.cat);
  }
  return Array.from(cats);
}

export const BRAND_EMOJI_MAP: Record<string, string> = {
  "McDonald's": '🍔',
  "Burger King": '👑',
  "KFC": '🍗',
  "Subway": '🥪',
  "Domino's": '🍕',
  "Pizza Hut": '🍕',
  "Starbucks": '☕',
  "Dunkin'": '🍩',
  "Taco Bell": '🌮',
  "Chipotle": '🌯',
  "Haldiram's": '🥟',
  "Bikanervala": '🥟',
  "Barbeque Nation": '🍖',
  "Faasos": '🌯',
  "Burger Singh": '🍔',
  "Chaayos": '🫖',
  "Cafe Coffee Day": '☕',
  "Wow Momo": '🥟',
  "La Pino'z": '🍕',
  "Oven Story": '🍕',
  "Behrouz Biryani": '🍛',
  "Natural Ice Cream": '🍦',
  "Theobroma": '🍰',
  "Wendy's": '🧑‍🦰',
  "Popeyes": '🍗',
  "Chick-fil-A": '🐄',
  "Papa John's": '🍕',
  "Five Guys": '🍟',
  "Sagar Ratna": '🥞',
  "Jumboking": '🥔',
  "Goli Vada Pav": '🥔',
};
