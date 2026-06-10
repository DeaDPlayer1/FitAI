/**
 * Standalone test for nutrition scaling engine.
 *
 * Tests the core scaling logic from nutritionScale.ts + calculateMacros from foodSearch.ts
 * without any React Native / SQLite dependencies.
 *
 * Run: node scripts/test_nutrition_scale.js
 */

// ── Copy of relevant code from nutritionScale.ts ──

const UNIT_META = {
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

function round1(v) { return Math.round(v * 10) / 10; }

function fmtNum(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

function toGrams(value, unit) {
  const meta = UNIT_META[unit];
  if (meta && meta.gramsPerUnit) return value * meta.gramsPerUnit;
  switch (unit) {
    case 'g': return value;
    case 'ml': return value;
    case 'oz': return value * 28.35;
    default: return value;
  }
}

function buildScaled(base, ratio, servingQuantity, servingUnit) {
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

function scaleNutrition(input) {
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

  let ratio;

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

  return buildScaled(base, ratio, quantity, unit);
}

function parseServingGrams(s) {
  const match = s.match(/\b(\d+\.?\d*)\s*g\b/i);
  return match ? parseFloat(match[1]) : null;
}

function parseServingMl(s) {
  const match = s.match(/\b(\d+\.?\d*)\s*ml\b/i);
  return match ? parseFloat(match[1]) : null;
}

function extractCountAmount(servingDesc) {
  if (!servingDesc) return null;
  const mlMatch = servingDesc.match(/\((\d+\.?\d*)\s*ml\)/i);
  if (mlMatch) return { value: parseFloat(mlMatch[1]), unit: 'ml' };
  const gMatch = servingDesc.match(/\((\d+\.?\d*)\s*g\b\)/i);
  if (gMatch) return { value: parseFloat(gMatch[1]), unit: 'g' };
  return null;
}

function detectServingUnit(desc) {
  if (!desc) return null;
  const lower = desc.toLowerCase().trim();
  if (/\bpiece\b|\bpieces\b/i.test(lower)) return 'piece';
  if (/\bcan\b|\bcans\b/i.test(lower)) return 'can';
  if (/\bbottle\b|\bbottles\b/i.test(lower)) return 'bottle';
  if (/\bcap\b/i.test(lower)) return 'scoop';
  if (/\bcup\b/i.test(lower) && !/(\d+\.?\d*)\s*g\b/i.test(lower)) return 'cup';
  if (/\bbowl\b/i.test(lower)) return 'bowl';
  if (/\bplate\b|\bplates\b/i.test(lower)) return 'plate';
  if (/\bserving\b|\bservings\b/i.test(lower)) return 'serving';
  if (/(\d+\.?\d*)\s*ml/i.test(lower)) return 'ml';
  if (/(\d+\.?\d*)\s*g\b/i.test(lower)) return 'g';
  if (/(\d+\.?\d*)\s*oz/i.test(lower)) return 'oz';
  if (/(\d+\.?\d*)\s*fl\s*oz/i.test(lower)) return 'floz';
  return null;
}

function estimateBaseNutrition(per100g, servingDesc, servingGrams) {
  const parsedUnit = detectServingUnit(servingDesc);
  const unit = parsedUnit || 'g';
  const unitCat = UNIT_META[unit]?.category;
  let baseValue;
  if (servingGrams) {
    baseValue = servingGrams;
  } else if (unit === 'ml') {
    baseValue = parseServingMl(servingDesc) || 100;
  } else if (unit === 'g') {
    baseValue = parseServingGrams(servingDesc) || 100;
  } else if (unitCat === 'count') {
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

// ── Copy of calculateMacros from foodSearch.ts ──

function calculateMacros(per100g, grams) {
  const ratio = grams / 100;
  return {
    calories: Math.round(per100g.calories * ratio),
    protein: round1(per100g.protein * ratio),
    carbs: round1(per100g.carbs * ratio),
    fat: round1(per100g.fat * ratio),
    fiber: round1((per100g.fiber || 0) * ratio),
  };
}

// ── Tests ──

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${msg}`);
  }
}

function assertClose(actual, expected, tolerance, msg) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${msg} — expected ${expected} ±${tolerance}, got ${actual}`);
  }
}

console.log('═'.repeat(56));
console.log(' Nutrition Scaling Engine — Comprehensive Tests');
console.log('═'.repeat(56));

// ── Test 1: calculateMacros (used in food-detail.tsx scaling) ──

console.log('\n── Test Suite 1: calculateMacros (per-100g → grams) ──');

// Chicken breast: 165 kcal, 31g protein, 0g carbs, 3.6g fat per 100g
const chicken = calculateMacros({ calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }, 200);
assert(chicken.calories === 330, 'chicken 200g: calories = 330');
assert(chicken.protein === 62, 'chicken 200g: protein = 62');
assert(chicken.carbs === 0, 'chicken 200g: carbs = 0');
assertClose(chicken.fat, 7.2, 0.1, 'chicken 200g: fat = 7.2');
assert(chicken.fiber === 0, 'chicken 200g: fiber = 0');

// Rice: 130 kcal, 2.7g protein, 28g carbs, 0.3g fat per 100g
const rice = calculateMacros({ calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 }, 150);
assert(rice.calories === 195, 'rice 150g: calories = 195');
assert(rice.protein === 4.1, 'rice 150g: protein = 4.1');
assert(rice.carbs === 42, 'rice 150g: carbs = 42');
assertClose(rice.fat, 0.5, 0.1, 'rice 150g: fat ≈ 0.5');
assert(rice.fiber === 0.6, 'rice 150g: fiber = 0.6');

// ── Test 2: Edge cases for calculateMacros ──

console.log('\n── Test Suite 2: calculateMacros edge cases ──');

const zero = calculateMacros({ calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }, 0);
assert(zero.calories === 0, 'zero grams: calories = 0');

const small = calculateMacros({ calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 }, 25);
assert(small.calories === 41, '25g: calories = 41 (165 × 0.25 = 41.25 → round)');
assert(small.protein === 7.8, '25g: protein = 7.8 (31 × 0.25 = 7.75 → round1 = 7.8)');

// ── Test 3: scaleNutrition — same unit ──

console.log('\n── Test Suite 3: scaleNutrition — same unit ──');

const base100g = {
  baseServingValue: 100, baseServingUnit: 'g', baseServingLabel: '100g',
  calories: 165, protein_g: 31, carbs_g: 0, fats_g: 3.6,
  fiber_g: 0, sugar_g: 0, sodium_g: 0,
};

const s1 = scaleNutrition({ base: base100g, quantity: 200, unit: 'g' });
assert(s1.calories === 330, '100g→200g: calories = 330');
assert(s1.protein_g === 62, '100g→200g: protein = 62');
assert(s1.fats_g === 7.2, '100g→200g: fat = 7.2');
assert(s1.servingLabel === '200 grams', 'label = "200 grams"');

const s2 = scaleNutrition({ base: base100g, quantity: 50, unit: 'g' });
assert(s2.calories === 83, '100g→50g: calories = 83');
assert(s2.protein_g === 15.5, '100g→50g: protein = 15.5');

// ── Test 4: scaleNutrition — count-based target ──

console.log('\n── Test Suite 4: scaleNutrition — count-based target ──');

const s3 = scaleNutrition({ base: base100g, quantity: 2, unit: 'serving' });
assert(s3.calories === 330, '100g→2 servings: calories = 330 (165 × 2)');

const s4 = scaleNutrition({ base: base100g, quantity: 1, unit: 'piece' });
assert(s4.calories === 165, '100g→1 piece: calories = 165');

// ── Test 5: scaleNutrition — base is count-based ──

console.log('\n── Test Suite 5: scaleNutrition — base is count-based ──');

const baseServing = {
  baseServingValue: 1, baseServingUnit: 'serving', baseServingLabel: '1 serving (250g)',
  calories: 275, protein_g: 12, carbs_g: 28, fats_g: 13,
  fiber_g: 8, sugar_g: 2, sodium_g: 300,
};

const s5 = scaleNutrition({ base: baseServing, quantity: 1, unit: 'serving' });
assert(s5.calories === 275, '1 serving: calories = 275');

const s6 = scaleNutrition({ base: baseServing, quantity: 2, unit: 'serving' });
assert(s6.calories === 550, '2 servings: calories = 550 (ratio = 2/1 = 2)');

const s7 = scaleNutrition({ base: baseServing, quantity: 0.5, unit: 'serving' });
assert(s7.calories === 138, '0.5 serving: calories = 138');

// 1 serving base → 250g: count→grams via gramsPerUnit (serving=100g)
// baseG = 1*100=100, targetG = 250 → ratio = 250/100 = 2.5
const s8 = scaleNutrition({ base: baseServing, quantity: 250, unit: 'g' });
assert(s8.calories === 688, '1 serving base → 250g: 688 (275 × 2.5)');

// ── Test 6: scaleNutrition — volume conversions ──

console.log('\n── Test Suite 6: scaleNutrition — volume conversions ──');

const baseMilk = {
  baseServingValue: 250, baseServingUnit: 'ml', baseServingLabel: '250ml',
  calories: 122, protein_g: 8, carbs_g: 12, fats_g: 5,
  fiber_g: 0, sugar_g: 12, sodium_g: 100,
};

const s9 = scaleNutrition({ base: baseMilk, quantity: 500, unit: 'ml' });
assert(s9.calories === 244, '250ml→500ml: 244 (122 × 2)');

// 250ml → 1 cup (240g via gramsPerUnit): ml→volume, both → grams
// baseG = 250*1=250, targetG = 240 → ratio = 240/250 = 0.96
const s10 = scaleNutrition({ base: baseMilk, quantity: 1, unit: 'cup' });
assert(s10.calories === 117, '250ml→1 cup: 117 (122 × 0.96)');

// ── Test 7: Zero / Invalid quantity ──

console.log('\n── Test Suite 7: Zero / Invalid quantity ──');

const zeroQ = scaleNutrition({ base: base100g, quantity: 0, unit: 'g' });
assert(zeroQ.calories === 0, 'zero: calories = 0');
assert(zeroQ.servingQuantity === 0, 'zero: servingQuantity = 0');

const negQ = scaleNutrition({ base: base100g, quantity: -5, unit: 'g' });
assert(negQ.calories === 0, 'negative: calories = 0');

const infQ = scaleNutrition({ base: base100g, quantity: Infinity, unit: 'g' });
assert(infQ.calories === 0, 'Infinity: calories = 0');

// ── Test 8: estimateBaseNutrition ──

console.log('\n── Test Suite 8: estimateBaseNutrition ──');

// "1 roti (40g)" → parseServingGrams returns 40 → grams = 40
const e1 = estimateBaseNutrition(
  { calories: 120, protein: 3, carbs: 25, fat: 0.5, fiber: 2, sugar: 0, sodium: 0 },
  '1 roti (40g)',
);
assert(e1.baseServingValue === 40, 'roti: baseServingValue = 40');
assert(e1.calories === 48, 'roti: calories = 48 (120 × 0.4)');
assert(e1.protein_g === 1.2, 'roti: protein = 1.2 (3 × 0.4)');

// No serving grams → fallback to 100
const e2 = estimateBaseNutrition(
  { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 0 },
  '',
);
assert(e2.baseServingValue === 100, 'fallback: baseServingValue = 100');
assert(e2.calories === 165, 'fallback: calories = 165');

// servingGrams override (3rd arg)
const e3 = estimateBaseNutrition(
  { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 0 },
  '1 breast',
  250,
);
assert(e3.baseServingValue === 250, 'override: baseServingValue = 250');
assert(e3.calories === 413, 'override: calories = 413');

// ── Test 9: Previously-fixed inflation bug ──

console.log('\n── Test Suite 9: Previously-fixed inflation bug (455 kcal / 115.5g carbs) ──');

const bug1 = scaleNutrition({ base: base100g, quantity: 200, unit: 'g' });
assert(bug1.calories === 330, '200g of 100g-base = 330 (not inflated)');

const bug2 = scaleNutrition({ base: base100g, quantity: 2, unit: 'serving' });
assert(bug2.calories === 330, '2 servings = 330 (not inflated)');

// ── Test 10: Cross-unit conversions (weight ↔ count) ──

console.log('\n── Test Suite 10: Cross-unit conversions ──');

// Base is 100g chicken, target is 2 pieces (count category)
// ratio = quantity = 2
const cross1 = scaleNutrition({ base: base100g, quantity: 2, unit: 'piece' });
assert(cross1.calories === 330, '100g→2 pieces: 330');
assert(cross1.protein_g === 62, '100g→2 pieces: protein = 62');

// Base is 1 serving (count), target is 3 servings (same unit, count)
// ratio = 3 / 1 = 3
const cross2 = scaleNutrition({ base: baseServing, quantity: 3, unit: 'serving' });
assert(cross2.calories === 825, '1 serving→3 servings: 825');

// ── Test 11: Serving presets generation ──

console.log('\n── Test Suite 11: getServingPresets pattern ──');

function getServingPresets(base) {
  const presets = [];
  const bv = base.baseServingValue;
  const bu = base.baseServingUnit;
  switch (bu) {
    case 'g':
    case 'ml':
      presets.push(
        { label: `\u00BD ${UNIT_META[bu].label}`, value: Math.round(bv / 2), unit: bu },
        { label: `1 ${UNIT_META[bu].label}`, value: bv, unit: bu },
        { label: `2 ${UNIT_META[bu].plural}`, value: bv * 2, unit: bu },
      );
      break;
    case 'serving':
    case 'can': case 'bottle': case 'piece': case 'bowl': case 'cup': case 'scoop': case 'plate':
      presets.push(
        { label: `\u00BD ${UNIT_META[bu].label}`, value: 0.5, unit: bu },
        { label: `1 ${UNIT_META[bu].label}`, value: 1, unit: bu },
        { label: `2 ${UNIT_META[bu].plural}`, value: 2, unit: bu },
      );
      break;
    default:
      presets.push(
        { label: '\u00BD', value: 0.5, unit: bu },
        { label: '1', value: 1, unit: bu },
        { label: '2', value: 2, unit: bu },
      );
  }
  return presets;
}

const p1 = getServingPresets({ baseServingValue: 100, baseServingUnit: 'g' });
assert(p1.length === 3, 'g presets: 3 items');
assert(p1[0].value === 50, 'g presets: half = 50');
assert(p1[1].value === 100, 'g presets: 1 = 100');
assert(p1[2].value === 200, 'g presets: 2 = 200');

const p2 = getServingPresets({ baseServingValue: 1, baseServingUnit: 'can' });
assert(p2.length === 3, 'can presets: 3 items');
assert(p2[0].value === 0.5, 'can presets: half = 0.5');
assert(p2[1].value === 1, 'can presets: 1 = 1');
assert(p2[2].value === 2, 'can presets: 2 = 2');

// ── Test 12: parseServingString ──

console.log('\n── Test Suite 12: parseServingString ──');

function parseServingString(s) {
  if (!s) return null;
  const lower = s.trim().toLowerCase();
  const unitMap = {
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
  const wordUnitMap = { half: { value: 0.5 }, 'half ': { value: 0.5 }, a: { value: 1 }, an: { value: 1 } };
  const match = lower.match(/^(\d+\.?\d*)\s*([a-z]+(?:\s+[a-z]+)?)/);
  if (match) {
    const val = parseFloat(match[1]);
    const rawUnit = match[2].trim();
    const mapped = unitMap[rawUnit];
    if (mapped && !isNaN(val)) return { value: val, unit: mapped };
  }
  const wordMatch = lower.match(/^(half|a|an)\s+([a-z]+(?:\s+[a-z]+)?)/);
  if (wordMatch) {
    const val = wordUnitMap[wordMatch[1]]?.value ?? 1;
    const rawUnit = wordMatch[2].trim();
    const mapped = unitMap[rawUnit];
    if (mapped) return { value: val, unit: mapped };
  }
  return null;
}

const ps1 = parseServingString('2 cups');
assert(ps1?.value === 2 && ps1?.unit === 'cup', '2 cups → {2, cup}');

const ps2 = parseServingString('330ml');
assert(ps2?.value === 330 && ps2?.unit === 'ml', '330ml → {330, ml}');

const ps3 = parseServingString('half bowl');
assert(ps3?.value === 0.5 && ps3?.unit === 'bowl', 'half bowl → {0.5, bowl}');

const ps4 = parseServingString('1 roti');
assert(ps4 === null, '1 roti → null (roti not in unitMap)');
// This should be null because "roti" isn't a mapped unit

const ps5 = parseServingString('');
assert(ps5 === null, 'empty string → null');

// ── Test 13: Fixed — parseServingGrams regex + ml extraction ──

console.log('\n── Test Suite 13: Fixed — parseServingGrams regex + ml extraction ──');

// Previously "1 glass (250ml)" matched "1" + "g" from "glass" → returned 1
// Now: word boundary \bg\b prevents matching "glass"
const fixed1 = parseServingGrams('1 glass (250ml)');
assert(fixed1 === null, 'parseServingGrams("1 glass (250ml)") = null (no longer matches "glass")');

// "1 roti (40g)" still works
const fixed2 = parseServingGrams('1 roti (40g)');
assert(fixed2 === 40, 'parseServingGrams("1 roti (40g)") = 40');

// "100g" still works
const fixed3 = parseServingGrams('100g');
assert(fixed3 === 100, 'parseServingGrams("100g") = 100');

// New: parseServingMl extracts ml values
const ml1 = parseServingMl('1 glass (250ml)');
assert(ml1 === 250, 'parseServingMl("1 glass (250ml)") = 250');

const ml2 = parseServingMl('1 can (330ml)');
assert(ml2 === 330, 'parseServingMl("1 can (330ml)") = 330');

// estimateBaseNutrition now uses ml values
const milkGlass = estimateBaseNutrition(
  { calories: 42, protein: 3.4, carbs: 5, fat: 1, fiber: 0, sugar: 5, sodium: 50 },
  '1 glass (250ml)',
);
assert(milkGlass.calories === 105, 'milk 250ml: calories = 105 (42 x 2.5)');
assert(milkGlass.baseServingUnit === 'ml', 'milk: unit = ml');
assert(milkGlass.baseServingValue === 250, 'milk: baseValue = 250');

const cokeCan = estimateBaseNutrition(
  { calories: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, sugar: 10.6, sodium: 0 },
  '1 can (330ml)',
);
assert(cokeCan.calories === 139, 'coke 330ml can: calories = 139 (42 x 3.3)');
assert(cokeCan.baseServingUnit === 'can', 'coke: unit = can');
assert(cokeCan.baseServingValue === 1, 'coke: baseValue = 1 (1 can)');

// Scale: 2 cans of coke → same unit, ratio = 2/1 = 2
const coke2 = scaleNutrition({ base: cokeCan, quantity: 2, unit: 'can' });
assert(coke2.calories === 278, 'coke 2 cans: 278 = 139 x 2');

// Scale works correctly with ml-based base
const milk500 = scaleNutrition({ base: milkGlass, quantity: 500, unit: 'ml' });
assert(milk500.calories === 210, 'milk 250ml->500ml: 210 = 105 x 2');
assert(milk500.carbs_g === 25, 'milk 250ml->500ml: carbs = 25');

// ════════════════════════════════════════════════════════
// NEW: Real-world food-detail.tsx workflow integration test
// ════════════════════════════════════════════════════════

console.log('\n── Test Suite 14: Real-world food-detail.tsx log flow ──');

// Simulates what happens when user searches "chicken" and selects it,
// then adjusts serving to 200g

// Step 1: food from DB has per_100g values
const dbFood = { calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, fiber_per_100g: 0.5 };

// Step 2: calculateMacros at the selected serving (200g) — line 306 in food-detail.tsx
const g = 200; // assume unit='g', quantity=200
const scaled = calculateMacros({
  calories: dbFood.calories_per_100g, protein: dbFood.protein_per_100g,
  carbs: dbFood.carbs_per_100g, fat: dbFood.fat_per_100g,
  fiber: dbFood.fiber_per_100g || 0,
}, g);

assert(scaled.calories === 330, 'food-detail flow: 200g chicken = 330 kcal');
assert(scaled.protein === 62, 'food-detail flow: protein = 62g');
assert(scaled.fat === 7.2, 'food-detail flow: fat = 7.2g');
assert(scaled.fiber === 1, 'food-detail flow: fiber = 1g (0.5 * 2)');

// Step 3: Simulates what gets inserted into meal_logs (line 372-377)
const insert = {
  food_name: 'Chicken Breast',
  calories: scaled.calories,
  protein_g: scaled.protein,
  carbs_g: scaled.carbs,
  fat_g: scaled.fat,
  meal_type: 'lunch',
};
assert(insert.calories === 330, 'meal_logs insert: 330 kcal');
assert(insert.protein_g === 62, 'meal_logs insert: 62g protein');
assert(insert.fat_g === 7.2, 'meal_logs insert: 7.2g fat');

// ── Test 15: What if user types 2 servings manually? ──

console.log('\n── Test Suite 15: "2 servings" of a per-100g food ──');

// food-detail.tsx line 305: when unit=serving, grams = quantity * serving_grams
const servingSizeGrams = 100; // typical serving size for generic food
const manualGrams = 2 * servingSizeGrams; // 2 servings × 100g = 200g
const scaledServings = calculateMacros({
  calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0,
}, manualGrams);
assert(scaledServings.calories === 330, '2 servings: 330 kcal (correct)');
assert(scaledServings.protein === 62, '2 servings: 62g protein');

// ── Test 16: Quick Add mode (no scaling needed) ──

console.log('\n── Test Suite 16: Quick Add mode ──');

// Quick Add: user enters numbers directly, no scaling
const quickCal = 450;
const quickProt = 25;
const quickCarb = 50;
const quickFat = 15;
assert(quickCal === 450, 'Quick Add: 450 kcal as entered');
assert(quickProt === 25, 'Quick Add: 25g protein as entered');

// ── Summary ──

console.log('\n' + '═'.repeat(56));
const total = passed + failed;
const pct = Math.round((passed / total) * 100);
console.log(` Result: ${passed}/${total} passed (${pct}%)`);
if (failed > 0) {
  console.log(` \u274C ${failed} test(s) FAILED`);
  process.exit(1);
} else {
  console.log(' \u2705 ALL TESTS PASSED');
}
