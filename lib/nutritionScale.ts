/**
 * nutritionScale.ts — Centralized nutrition scaling engine
 *
 * Every food entry stores base per-unit values + serving metadata.
 * Changing the serving quantity instantly recomputes all macros.
 *
 * Formula: newMacro = baseMacro × (newServingValue / baseServingValue)
 */

// ── Supported serving units ──

export type ServingUnit =
  | 'g'
  | 'ml'
  | 'serving'
  | 'piece'
  | 'can'
  | 'bottle'
  | 'scoop'
  | 'cup'
  | 'bowl'
  | 'oz'
  | 'floz'
  | 'tbsp'
  | 'tsp'
  | 'plate';

// ── Unit metadata ──

export interface UnitMeta {
  label: string;
  plural: string;
  category: 'weight' | 'volume' | 'count';
  /** Approximate grams per 1 unit (for conversion estimates) */
  gramsPerUnit?: number;
}

export const UNIT_META: Record<ServingUnit, UnitMeta> = {
  g: { label: 'gram', plural: 'grams', category: 'weight' },
  ml: { label: 'ml', plural: 'ml', category: 'volume', gramsPerUnit: 1 },
  serving: { label: 'serving', plural: 'servings', category: 'count', gramsPerUnit: 100 },
  piece: { label: 'piece', plural: 'pieces', category: 'count', gramsPerUnit: 100 },
  can: { label: 'can', plural: 'cans', category: 'count', gramsPerUnit: 330 },
  bottle: { label: 'bottle', plural: 'bottles', category: 'count', gramsPerUnit: 500 },
  scoop: { label: 'scoop', plural: 'scoops', category: 'count', gramsPerUnit: 30 },
  cup: { label: 'cup', plural: 'cups', category: 'volume', gramsPerUnit: 240 },
  bowl: { label: 'bowl', plural: 'bowls', category: 'volume', gramsPerUnit: 300 },
  oz: { label: 'oz', plural: 'oz', category: 'weight', gramsPerUnit: 28.35 },
  floz: { label: 'fl oz', plural: 'fl oz', category: 'volume', gramsPerUnit: 29.57 },
  tbsp: { label: 'tbsp', plural: 'tbsp', category: 'volume', gramsPerUnit: 15 },
  tsp: { label: 'tsp', plural: 'tsp', category: 'volume', gramsPerUnit: 5 },
  plate: { label: 'plate', plural: 'plates', category: 'count', gramsPerUnit: 300 },
};

// ── Scaled nutrition result ──

export interface ScaledNutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_g: number;
  /** Human-readable serving description (e.g. "250 ml") */
  servingLabel: string;
  /** The numeric serving quantity used */
  servingQuantity: number;
  /** The serving unit used */
  servingUnit: ServingUnit;
}

// ── Base nutrition data (per reference unit) ──

export interface BaseNutrition {
  /** Value that `baseCalories` etc. correspond to */
  baseServingValue: number;
  /** Unit of `baseServingValue` */
  baseServingUnit: ServingUnit;
  /** Human-readable serving description (e.g. "1 can (330ml)") */
  baseServingLabel: string;

  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_g: number;
}

// ── Quick-select presets ──

export interface ServingPreset {
  label: string;
  value: number;
  unit: ServingUnit;
}

/**
 * Generate serving presets for a food based on its base unit.
 */
export function getServingPresets(base: BaseNutrition): ServingPreset[] {
  const presets: ServingPreset[] = [];
  const bv = base.baseServingValue;
  const bu = base.baseServingUnit;

  switch (bu) {
    case 'g':
    case 'ml':
      presets.push(
        { label: `½ ${UNIT_META[bu].label}`, value: Math.round(bv / 2), unit: bu },
        { label: `1 ${UNIT_META[bu].label}`, value: bv, unit: bu },
        { label: `2 ${UNIT_META[bu].plural}`, value: bv * 2, unit: bu },
      );
      break;
    case 'serving':
    case 'can':
    case 'bottle':
    case 'piece':
    case 'bowl':
    case 'cup':
    case 'scoop':
    case 'plate':
      presets.push(
        { label: `½ ${UNIT_META[bu].label}`, value: 0.5, unit: bu },
        { label: `1 ${UNIT_META[bu].label}`, value: 1, unit: bu },
        { label: `2 ${UNIT_META[bu].plural}`, value: 2, unit: bu },
      );
      break;
    default:
      presets.push(
        { label: '½', value: 0.5, unit: bu },
        { label: '1', value: 1, unit: bu },
        { label: '2', value: 2, unit: bu },
      );
  }

  return presets;
}

/**
 * Get available units for a given food category.
 */
export function getAvailableUnits(
  baseUnit: ServingUnit,
  isPackaged: boolean,
): ServingUnit[] {
  const units: ServingUnit[] = isPackaged
    ? ['ml', 'g', 'serving', 'can', 'bottle', 'piece', 'scoop']
    : ['g', 'cup', 'bowl', 'piece', 'serving'];
  // Always include the base unit so user can switch back to it
  if (baseUnit && !units.includes(baseUnit)) {
    units.unshift(baseUnit);
  }
  return units;
}

/**
 * Estimate initial base nutrition from per-100g values and a serving description.
 */
/**
 * Extract embedded amount from a serving description for count-based units.
 * e.g. "1 can (330ml)" → 330, "1 piece (200g)" → 200
 */
function extractCountAmount(servingDesc: string): { value: number; unit: 'g' | 'ml' } | null {
  if (!servingDesc) return null;
  const mlMatch = servingDesc.match(/\((\d+\.?\d*)\s*ml\)/i);
  if (mlMatch) return { value: parseFloat(mlMatch[1]), unit: 'ml' };
  const gMatch = servingDesc.match(/\((\d+\.?\d*)\s*g\b\)/i);
  if (gMatch) return { value: parseFloat(gMatch[1]), unit: 'g' };
  return null;
}

export function estimateBaseNutrition(
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  },
  servingDesc: string,
  servingGrams?: number,
): BaseNutrition {
  const parsedUnit = detectServingUnit(servingDesc);
  const unit = parsedUnit || 'g';

  const unitCat = UNIT_META[unit]?.category;

  let baseValue: number;
  if (servingGrams) {
    baseValue = servingGrams;
  } else if (unit === 'ml') {
    baseValue = parseServingMl(servingDesc) || 100;
  } else if (unit === 'g') {
    baseValue = parseServingGrams(servingDesc) || 100;
  } else if (unitCat === 'count') {
    // Count-based unit with embedded amount like "1 can (330ml)" or "1 piece (200g)"
    const embedded = extractCountAmount(servingDesc);
    if (embedded) {
      baseValue = embedded.value;
    } else {
      baseValue = parseServingGrams(servingDesc) || 100;
    }
  } else {
    baseValue = parseServingGrams(servingDesc) || 100;
  }

  const ratio = baseValue / 100;

  return {
    baseServingValue: unit === 'g' || unit === 'ml' ? baseValue : 1,
    baseServingUnit: unit,
    baseServingLabel: servingDesc || `${baseValue}g`,
    calories: Math.round(per100g.calories * ratio),
    protein_g: round1(per100g.protein * ratio),
    carbs_g: round1(per100g.carbs * ratio),
    fats_g: round1(per100g.fat * ratio),
    fiber_g: round1(per100g.fiber * ratio),
    sugar_g: round1(per100g.sugar * ratio),
    sodium_g: round1(per100g.sodium * ratio),
  };
}

function detectServingUnit(desc: string): ServingUnit | null {
  if (!desc) return null;
  const lower = desc.toLowerCase().trim();
  // Check explicit container words FIRST (before bare ml/g numbers)
  if (/\bpiece\b|\bpieces\b/i.test(lower)) return 'piece';
  if (/\bcan\b|\bcans\b/i.test(lower)) return 'can';
  if (/\bbottle\b|\bbottles\b/i.test(lower)) return 'bottle';
  if (/\bcap\b/i.test(lower)) return 'scoop';
  if (/\bcup\b/i.test(lower) && !/(\d+\.?\d*)\s*g\b/i.test(lower)) return 'cup';
  if (/\bbowl\b/i.test(lower)) return 'bowl';
  if (/\bplate\b|\bplates\b/i.test(lower)) return 'plate';
  if (/\bserving\b|\bservings\b/i.test(lower)) return 'serving';
  // Then check numeric patterns
  if (/(\d+\.?\d*)\s*ml/i.test(lower)) return 'ml';
  if (/(\d+\.?\d*)\s*g\b/i.test(lower)) return 'g';
  if (/(\d+\.?\d*)\s*oz/i.test(lower)) return 'oz';
  if (/(\d+\.?\d*)\s*fl\s*oz/i.test(lower)) return 'floz';
  return null;
}

/**
 * Parse a serving string like "1 bowl", "2 cups", "330ml" and extract numeric value + unit.
 */
export function parseServingString(s: string): { value: number; unit: ServingUnit } | null {
  if (!s) return null;

  const lower = s.trim().toLowerCase();

  const unitMap: Record<string, ServingUnit> = {
    g: 'g', gram: 'g', grams: 'g',
    ml: 'ml', millilitre: 'ml', millilitres: 'ml', milliliter: 'ml', milliliters: 'ml',
    serving: 'serving', servings: 'serving',
    piece: 'piece', pieces: 'piece',
    can: 'can', cans: 'can',
    bottle: 'bottle', bottles: 'bottle',
    scoop: 'scoop', scoops: 'scoop',
    cup: 'cup', cups: 'cup',
    bowl: 'bowl', bowls: 'bowl',
    oz: 'oz', ounce: 'oz', ounces: 'oz',
    floz: 'floz', 'fl oz': 'floz', 'fluid ounce': 'floz',
    tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
    tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
    plate: 'plate', plates: 'plate',
  };

  const wordUnitMap: Record<string, { value: number }> = {
    half: { value: 0.5 },
    'half ': { value: 0.5 },
    a: { value: 1 },
    an: { value: 1 },
  };

  const match = lower.match(/^(\d+\.?\d*)\s*([a-z]+(?:\s+[a-z]+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    const rawUnit = match[2].trim();
    const mapped = unitMap[rawUnit];
    if (mapped && !isNaN(val)) {
      return { value: val, unit: mapped };
    }
  }

  const wordMatch = lower.match(/^(half|a|an)\s+([a-z]+(?:\s+[a-z]+)?)/);
  if (wordMatch) {
    const val = wordUnitMap[wordMatch[1]]?.value ?? 1;
    const rawUnit = wordMatch[2].trim();
    const mapped = unitMap[rawUnit];
    if (mapped) {
      return { value: val, unit: mapped };
    }
  }

  return null;
}

function parseServingGrams(s: string): number | null {
  const match = s.match(/\b(\d+\.?\d*)\s*g\b/i);
  return match ? parseFloat(match[1]) : null;
}

function parseServingMl(s: string): number | null {
  const match = s.match(/\b(\d+\.?\d*)\s*ml\b/i);
  return match ? parseFloat(match[1]) : null;
}

// ── Core scaling function ──

export interface ScaleInput {
  base: BaseNutrition;
  /** The new quantity (in `unit`) */
  quantity: number;
  /** The unit for `quantity` */
  unit: ServingUnit;
}

/**
 * Scale nutrition values from base to the requested serving.
 *
 * Rules:
 *   - Same unit → simple ratio (quantity / baseServingValue)
 *   - Target is count-based → 1 count = 1 base serving → ratio = quantity
 *   - Base is count-based → convert both to grams via gramsPerUnit
 *   - Both weight/volume → convert both to grams
 */
export function scaleNutrition(input: ScaleInput): ScaledNutrition {
  const { base, quantity, unit } = input;
  if (quantity <= 0 || !isFinite(quantity)) {
    return {
      calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0,
      fiber_g: 0, sugar_g: 0, sodium_g: 0,
      servingLabel: `0 ${UNIT_META[unit]?.plural || unit}`,
      servingQuantity: 0,
      servingUnit: unit,
    };
  }

  const baseMeta = UNIT_META[base.baseServingUnit];
  const targetMeta = UNIT_META[unit];
  const baseCat = baseMeta?.category || 'count';
  const targetCat = targetMeta?.category || 'count';

  let ratio: number;

  if (base.baseServingUnit === unit) {
    ratio = quantity / base.baseServingValue;
  } else if (targetCat === 'count') {
    ratio = quantity;
  } else if (baseCat === 'count') {
    const baseG = toGrams(base.baseServingValue, base.baseServingUnit);
    const targetG = toGrams(quantity, unit);
    ratio = baseG > 0 && targetG > 0 ? targetG / baseG : quantity;
  } else {
    const baseG = toGrams(base.baseServingValue, base.baseServingUnit);
    const targetG = toGrams(quantity, unit);
    ratio = baseG > 0 && targetG > 0 ? targetG / baseG : quantity / base.baseServingValue;
  }

  console.log(
    `[nutritionScale] ${base.baseServingValue}${base.baseServingUnit} → ${quantity}${unit} | ` +
    `ratio=${ratio.toFixed(4)} cal=${Math.round(base.calories * ratio)}`
  );

  return buildScaled(base, ratio, quantity, unit);
}

function toGrams(value: number, unit: ServingUnit): number {
  const meta = UNIT_META[unit];
  if (meta?.gramsPerUnit) return value * meta.gramsPerUnit;
  switch (unit) {
    case 'g': return value;
    case 'ml': return value;
    case 'oz': return value * 28.35;
    default: return value;
  }
}

function buildScaled(
  base: BaseNutrition,
  ratio: number,
  servingQuantity: number,
  servingUnit: ServingUnit,
): ScaledNutrition {
  const meta = UNIT_META[servingUnit];
  const label = servingQuantity === 1
    ? `1 ${meta?.label || servingUnit}`
    : `${fmtNum(servingQuantity)} ${meta?.plural || servingUnit + 's'}`;

  return {
    calories: Math.round(base.calories * ratio),
    protein_g: round1(base.protein_g * ratio),
    carbs_g: round1(base.carbs_g * ratio),
    fats_g: round1(base.fats_g * ratio),
    fiber_g: round1(base.fiber_g * ratio),
    sugar_g: round1(base.sugar_g * ratio),
    sodium_g: round1(base.sodium_g * ratio),
    servingLabel: label,
    servingQuantity,
    servingUnit,
  };
}

function fmtNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// ── Convenience: calculate macros from per-100g + grams ──

export function scaleFromPer100g(
  per100g: { calories: number; protein: number; carbs: number; fat: number },
  grams: number,
) {
  const ratio = grams / 100;
  return {
    calories: Math.round(per100g.calories * ratio),
    protein_g: round1(per100g.protein * ratio),
    carbs_g: round1(per100g.carbs * ratio),
    fats_g: round1(per100g.fat * ratio),
  };
}

// ── Re-export for convenience ──

export { parseServingGrams };
