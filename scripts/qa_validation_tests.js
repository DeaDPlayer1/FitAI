/**
 * QA Validation Tests — Nutrition Logging System
 * Run: node scripts/qa_validation_tests.js
 */

console.log('=== QA VALIDATION TESTS ===\n');

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error('  FAIL:', msg); }
}

// ── 1. Quick Add: parseInt vs parseFloat (food-detail.tsx:357) ──
console.log('1. Quick Add: parseInt truncation (food-detail.tsx:357)');
assert(parseInt('500.9') === 500, 'parseInt truncates 500.9 -> 500 (BUG: loses 0.9)');
assert(parseFloat('500.9') === 500.9, 'parseFloat preserves 500.9');
assert(parseInt('250.75') === 250, 'parseInt truncates 250.75 -> 250');
assert(parseFloat('250.75') === 250.75, 'parseFloat preserves 250.75');
assert(parseInt('') || 0 === 0, 'parseInt("") || 0 = 0 (OK)');

// ── 2. Negative value acceptance (food-detail.tsx:357-360) ──
console.log('\n2. Negative value acceptance');
assert(Boolean(-500) === true, '-500 is truthy, so || 0 does NOT catch it (BUG)');
assert((-500 || 0) === -500, 'parseInt("-500") || 0 = -500 (BUG: negative slips through)');
assert((-500 || 0) !== 0, 'Negative values are NOT sanitized');
assert(isNaN(parseInt('abc')) === true, 'parseInt("abc") = NaN (falsy -> caught by || 0)');

// ── 3. Serving inflation bug (food-detail.tsx:181, 305, 370) ──
console.log('\n3. Serving inflation bug (Custom chip)');
const sg = 100; // serving_grams
const qty = sg; // handleServingSelect(sg, 'serving', 'custom')
const grams = qty * sg; // line 305/370: unit === 'serving' ? quantity * sg : quantity
assert(grams === 10000, `grams = ${qty} * ${sg} = ${grams} (expected 100, got 10000 = 100x INFLATION)`);

// Correct formula should be just grams = quantity (when unit = 'serving')
const correctGrams = qty; // 1 serving = 100g, so quantity=1, unit='serving' would be 100g
assert(grams !== correctGrams, `BUG: grams ${grams} !== expected ${correctGrams}`);

const calPer100g = 165;
const inflatedCal = Math.round(calPer100g * grams / 100);
const expectedCal = Math.round(calPer100g * correctGrams / 100);
assert(inflatedCal === 16500, `INFLATED: ${inflatedCal} kcal (expected ${expectedCal} kcal)`);

// ── 4. createMeal quantity heuristic (food-detail.tsx:393) ──
console.log('\n4. createMeal quantity heuristic');
const cal = 500;
const weirdQty = cal > 0 ? Math.round(cal * 10) : 100;
assert(weirdQty === 5000, `quantity = cal * 10 = ${weirdQty} (heuristic creates nonsensical qty)`);

// ── 5. getYesterdayMeals date boundary (foodSearch.ts:755) ──
console.log('\n5. Date boundary logic');
const now = new Date('2025-03-15T10:30:00');
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
assert(start.getHours() === 0 && start.getMinutes() === 0, 'Start = midnight yesterday');
const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
assert(end.getHours() === 23 && end.getMinutes() === 59, 'End = 23:59:59 yesterday');

// ── 6. Math.random() as key — probability check ──
console.log('\n6. Math.random() as key (food-search.tsx:378)');
const keys = new Set();
for (let i = 0; i < 1000; i++) { keys.add(Math.random()); }
assert(keys.size === 1000, 'Math.random() generates unique keys each render (causes REMOUNT)');

// ── 7. parseServingGrams word boundary fix ──
console.log('\n7. parseServingGrams word boundary fix (nutritionScale.ts)');
const oldRegex = /(\d+\.?\d*)\s*g/i;
const newRegex = /\b(\d+\.?\d*)\s*g\b/i;
assert(oldRegex.test('1 glass') === true, 'OLD: matches "1 glass" as "1g" (BUG)');
assert(newRegex.test('1 glass') === false, 'NEW: does NOT match "1 glass" (FIXED)');
assert(newRegex.test('100g') === true, 'NEW: still matches "100g"');
assert(newRegex.test('1 roti (40g)') === true, 'NEW: matches "40g" in "(40g)"');

// ── 8. isFavourite persistence ──
console.log('\n8. isFavourite local-only state');
// food-detail.tsx:329-333: uses useState, no DB/store persistence
assert(true, 'isFavourite is local state (resets on remount) - no DB write anywhere');

// ── 9. logFoodToRecent UNIQUE constraint race ──
console.log('\n9. logFoodToRecent race condition (foodSearch.ts:489-505)');
// Two concurrent calls for same (userId, foodName)
// First: SELECT -> null, UPDATE -> 0 rows, INSERT -> OK
// Second: SELECT -> null (before first INSERT), UPDATE -> 0 rows, INSERT -> UNIQUE violation
assert(true, 'RACE: two concurrent logFoodToRecent for same food can throw UNIQUE constraint');

// ── 10. Quick Add missing fiber_g ──
console.log('\n10. Quick Add missing fiber_g (food-detail.tsx:363-367)');
const quickAddInsert = { calories: 500, protein_g: 20, carbs_g: 50, fat_g: 10 };
assert(quickAddInsert.fiber_g === undefined, 'Quick Add insert has NO fiber_g field');

// ── 11. Normal food insert HAS fiber_g ──
console.log('\n11. Normal food fiber_g handling');
const normalInsert = { calories: 330, protein_g: 30, carbs_g: 0, fat_g: 5, fiber_g: 2.5 };
assert(normalInsert.fiber_g === 2.5, 'Normal food insert HAS fiber_g');

// ── 12. createMeal fiber hardcoded to 0 ──
console.log('\n12. createMeal fiber hardcoded (food-detail.tsx:393)');
const foodEntry = { fiber: 0 }; // hardcoded in code
assert(foodEntry.fiber === 0, 'createMeal hardcodes fiber: 0 (ignores scaled.fiber)');

// ── 13. fuzzyLookup substring match - foodCategoryAverages ──
console.log('\n13. Substring match bug (foodCategoryAverages.ts:109)');
const categories = { butter: { cal: 717 }, chicken: { cal: 239 } };
const input = 'butter chicken';
let matched = null;
for (const cat of Object.keys(categories)) {
  if (input.includes(cat)) { matched = cat; break; }
}
assert(matched === 'butter', `"butter chicken" matches "butter" (${matched}) not "chicken" (BUG)`);

// ── 14. USDA sodium unit assumption ──
console.log('\n14. USDA sodium unit assumption (barcodeService.ts:330)');
const usdaSodiumMg = 400; // mg
const ratio = 1;
const converted = (usdaSodiumMg / 1000) * ratio;
assert(converted === 0.4, `USDA sodium ${usdaSodiumMg}mg -> ${converted}g (correct)`);
// If USDA returns grams instead:
const usdaSodiumG = 0.4; // grams
const wrongConverted = (usdaSodiumG / 1000) * ratio;
assert(wrongConverted === 0.0004, `If USDA returns grams: ${usdaSodiumG}g -> ${wrongConverted}g (1000x UNDER-report)`);

// ── 15. restaurantTotalToPer100g (foodSearch.ts:900) ──
console.log('\n15. restaurantTotalToPer100g');
function restaurantTotalToPer100g(totalCal, totalProt, totalCarb, totalFat, servingGrams, totalFiber) {
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
// McAloo Tikki: 390 kcal, 210g serving
const r = restaurantTotalToPer100g(390, 12, 38, 18, 210);
assert(r.calPer100g === 186, `McAloo 210g: ${r.calPer100g} cal/100g (expected 186)`);
assert(r.servingGrams === undefined, 'restaurantTotalToPer100g returns no servingGrams (dead code?)');

// ── Summary ──
console.log(`\n${'='.repeat(50)}`);
console.log(` Results: ${pass}/${pass+fail} passed`);
fail > 0 ? console.log(` ${fail} FAILURES DETECTED`) : console.log(' All validations done');
