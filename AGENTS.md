# Pulse AI — Session Summary

## Goal
- Fix navigation, key, and food-recognition errors; expand food database to 1000+ items; rebuild the nutrition scaling engine to properly handle serving sizes, units, and proportional macro calculation across camera, barcode, and text food logging.

## Constraints & Preferences
- Use exact Indian dish names in AI prompts (not generic descriptions)
- Database must cover Indian regional cuisines + all major world cuisines
- No duplicate keys in rendered lists
- Groq vision model: `meta-llama/llama-4-scout-17b-16e-instruct`
- Groq text model: `llama-3.3-70b-versatile`
- Nutrition model must use `scaleFactor = selectedAmount / baseServingAmount` (not gram-conversion fallbacks that cause exponential inflation)
- Unit selector must be dynamic based on food type (liquids → ml/cans/bottles; solids → g/cups/bowls/pieces)

## Progress
### Done
- **GO_BACK navigation error**: `FloatingTabBar.tsx:58` changed `goBack()` → `navigate('index')`; `coach.tsx:409` changed `router.back()` → `router.navigate('/(ai-trainer)')`
- **Duplicate key error**: `BarcodeResultScreen.tsx` changed `key={q.value}` → `key={q.label}`
- **Food database expanded to 1001 items**: Batch 2 (+241), Batch 3 (+107), Batch 4 (+46), Batch 5 (+16), manual (+3) — all scripts in `scripts/`
- **`lib/nutritionAI.ts` prompts rewritten for Indian cuisine**: `identifyFoodFromImage`, `calculateNutritionFromDescription`, DB cross-reference after vision, Layer 5 fallback with Indian-cuisine-aware values
- **Camera → 1 Groq call (merged)**: Replaced 2-call pipeline (`identifyFoodFromImage` → `calculateNutritionFromDescription`) with single `analyzeImageSingleCall` returning structured JSON (per-100g values + detected portion size)
- **Multi-food DB matching**: Each AI-detected item matched against `food_cache` via `lookupRawPer100g()`; cached per-100g values replace AI estimates
- **Reference card/coin overlay**: Added credit card + coin outlines in `camera-capture.tsx` camera view as portion scale reference
- **Image caching**: Added `food_scans` table in `db.ts`; `saveScanToCache()`/`getRecentScans()` in `nutritionAI.ts` persist scan URIs + food name + calories to SQLite
- **On-device classifier removed from camera path**: Broken TF.js MobileNet model (`tf.loadGraphModel` fails with `"Cannot read property 'producer' of undefined"`) removed from camera analysis path — kept only for text fallback
- **Nutrition scaling engine fix**: `lib/nutritionScale.ts`, `screens/FoodConfirmScreen.tsx` — complete overhaul to fix 455 kcal / 115.5g carbs bug (system now uses scaleFactor = selectedAmount / baseServingAmount, no double-inflation)
- **Metro cache cleared**: `npx expo start --clear` resolved `lightningcss-darwin-x64` watch error

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- `router.back()` / `navigation.goBack()` replaced with explicit `navigate('/index')` or `navigate('/(ai-trainer)')` because tab navigators have no history to pop
- Food database expansion uses Python scripts that check `existing_names` set to avoid duplicates
- AI prompts explicitly enumerate Indian dishes rather than relying on model's inherent knowledge
- On-device TF.js classifier removed from camera path (broken model URL, poor ImageNet-only coverage, no Indian food support; Groq vision is superior)
- Nutrition scaling uses direct ratio formula `scaleFactor = selectedAmount / baseServingAmount` instead of gram-conversion-with-fallbacks to prevent exponential macro inflation
- `UNIT_META.gramsPerUnit` added for all count-based units (can: 330g, bottle: 500g, piece: 100g, etc.) so cross-category conversions (e.g., `can → ml`) work via gram bridge
- `scaleNutrition()` uses category-aware logic: same-unit → direct ratio; target count-based → ratio=quantity (1 count = 1 base serving); else → gram conversion via gramsPerUnit
- `detectServingUnit()` prioritizes container words (can, bottle, bowl, cup) over bare ml/g numeric patterns
- `getAvailableUnits()` always includes baseUnit in the returned list

## Nutrition Scaling Architecture

### Core Formula
```
scaleFactor = selectedAmount / baseServingAmount
scaledCalories = baseCalories × scaleFactor
```

### Category Rules (`scaleNutrition()`)
1. **Same unit** (e.g., 'can' → 'can'): `ratio = quantity / baseServingValue`
2. **Target is count-based** (e.g., base='ml' → target='serving'): `ratio = quantity`
   - 1 count unit = 1 base serving = `baseServingValue` of base unit
   - Example: 330ml base, 1 serving = 330ml → ratio = 1
3. **Base is count-based** (e.g., base='can' → target='ml'): convert both to grams
   - 1 can = 330g (from gramsPerUnit), 500ml = 500g → ratio = 500/330
4. **Both weight/volume** (e.g., 'g' → 'cup'): convert both to grams

### Data Flow
```
Camera/Gallery → Groq vision → {calories: total, servingGrams, serving: "1 can (330ml)"}
                                     ↓
Barcode → Open Food Facts/USDA → per-100g values + serving_size
                                     ↓
FoodConfirmScreen → parseServingString("1 can (330ml)") → {value:1, unit:'can'}
                         ↓
               BaseNutrition {baseServingValue:1, baseServingUnit:'can', calories:140}
                         ↓
               ServingSizeEditor → scaleNutrition(base, quantity, unit) → ScaledNutrition
                         ↓
               Log to meal_logs (scaled.calories, scaled.protein_g, etc.)
```

### Edge Cases Handled
- AI returns `{calories: 140, serving: "1 can (330ml)", servingGrams: 330}` → unit='can', value=1, calories=140
- AI returns `{calories: 140, serving: "Coca-Cola (330g)", servingGrams: 330}` → unit='g', value=330, calories=140
- Barcode returns `per100g={cal:42}, serving: "330ml"` → unit='ml', value=330, ratio=3.3 → 140 cal
- User switches 330ml → 500ml → ratio=500/330 → 212 cal
- User switches 1 can → 2 cans → ratio=2 → 280 cal
- User switches 1 can → 1/2 can → ratio=0.5 → 70 cal

## Relevant Files
- `lib/nutritionScale.ts` — Core scaling engine: `scaleNutrition()`, `estimateBaseNutrition()`, `parseServingString()`, `detectServingUnit()`, `getAvailableUnits()`, `getServingPresets()`, `UNIT_META`
- `screens/FoodConfirmScreen.tsx` — Camera/gallery/voice food confirmation with unit detection
- `screens/BarcodeResultScreen.tsx` — Barcode scan result with per-100g → serving scaling
- `lib/barcodeService.ts` — Open Food Facts + USDA lookup, `parseServingGrams()`
- `lib/nutritionAI.ts` — AI pipeline: Groq vision, DB matching, image caching
- `components/ui/ServingSizeEditor.tsx` — Interactive serving size UI with presets, unit selector, live macro preview
- `components/ui/FloatingTabBar.tsx:58` — `goBack()` → `navigate('index')` fix
- `app/(ai-trainer)/coach.tsx:409` — `router.back()` → `router.navigate('/(ai-trainer)')` fix
- `app/modals/camera-capture.tsx` — Camera view with reference card/coin overlay
- `lib/db.ts` — SQLite schema: `food_cache`, `food_scans` tables

## Pre-existing TS Errors (unchanged)
- `constants/exercises.ts(121-128)`: 8 errors — `"Cardio"` not assignable to `"Compound" | "Isolation"`
