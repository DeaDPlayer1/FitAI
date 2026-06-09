# Pulse AI — Session Summary

## Goal
- Fix navigation, key, and food-recognition errors; expand food database to 1000+ items; rebuild the nutrition scaling engine; build complete MyFitnessPal-style manual food logging system.

## Constraints & Preferences
- Use exact Indian dish names in AI prompts (not generic descriptions)
- Database must cover Indian regional cuisines + all major world cuisines
- No duplicate keys in rendered lists
- Groq vision model: `meta-llama/llama-4-scout-17b-16e-instruct`
- Groq text model: `llama-3.3-70b-versatile`
- Nutrition model must use `scaleFactor = selectedAmount / baseServingAmount` (not gram-conversion fallbacks that cause exponential inflation)
- Unit selector must be dynamic based on food type (liquids → ml/cans/bottles; solids → g/cups/bowls/pieces)
- Nutrition values must come from verified databases, never AI hallucinations

## Progress
### Done
- **GO_BACK navigation error**: `FloatingTabBar.tsx:58` changed `goBack()` → `navigate('index')`; `coach.tsx:409` changed `router.back()` → `router.navigate('/(ai-trainer)')`
- **Duplicate key error**: `BarcodeResultScreen.tsx` changed `key={q.value}` → `key={q.label}`
- **Food database expanded to 1001 items**: Batch 2 (+241), Batch 3 (+107), Batch 4 (+46), Batch 5 (+16), manual (+3) — all scripts in `scripts/`
- **`lib/nutritionAI.ts` rewritten**: Quality analysis, confidence system, 200+ canonical map, 100+ category averages, deterministic fallback (no AI macros)
- **Camera → 1 Groq call (merged)**: Replaced 2-call pipeline with single `analyzeImageSingleCall`
- **Nutrition scaling engine fix**: `lib/nutritionScale.ts` overhaul — fixed 455 kcal / 115.5g carbs bug
- **Phase 6: Premium camera UX**: Animated pulsing frame, flash toggle, grid overlay, gallery picker, haptics, shutter animation
- **Phase 7: Confidence badges**: Colored High/Medium/Low badges on FoodConfirmScreen, low-confidence warning banner
- **Phase 8: Meal insights**: Daily goal progress bar, smart meal composition insight, meal emoji header
- **Auth loading fix**: Eager `syncUserData()` on login (5s timeout), skip redundant profile fetch in `handleAuthChange`, removed boot artificial 1.8s delay
- **Complete manual food logging system**:
  - **Food database schema**: `foods`, `food_servings`, `user_custom_foods`, `saved_meals`, `saved_meal_foods`, `recent_foods` tables with FTS5 full-text search
  - **Search engine**: `lib/foodSearch.ts` — FTS5 with LIKE fallback, autocomplete suggestions, recent/frequent ranking, serving size memory
  - **Food Search screen**: `app/modals/food-search.tsx` — premium MFP-style search with auto-focus, debounced search (150ms), recent/frequent/saved meals sections, verified badges, barcode shortcut, Quick Add shortcut
  - **Food Detail screen**: `app/modals/food-detail.tsx` — nutrition facts, serving selector (grams + presets), quantity editor, Quick Add mode (calories + macros), meal type selector, per-100g display
  - **Quick Add**: Enter calories + optional macros for restaurant/unknown foods
  - **Saved Meals**: Save/load/quick-log meal combos with totals
  - **Recent/Frequent tracking**: Auto-tracked per user per meal type, meal-time-aware suggestions
  - **Wired into app**: Search button in log-food tool row, search shortcut card on food tab

### In Progress
- (none)

### Blocked
- (none)

## Food Search Architecture

### Search Priority Ranking
1. Exact prefix match
2. FTS5 full-text match (aliases, search_terms, category)
3. LIKE fallback on canonical_name, aliases, search_terms
4. Suggestions derived from top results or alias matches

### Search Flow
```
User types → 150ms debounce → searchFoods(text, userId, mealType)
  → Check in-memory cache (5s TTL)
  → FTS5 query (canonical_name* alias* search_terms*)
  → Fallback: LIKE %query%
  → Sort: exact prefix first, then rest
  → Merge with recent foods (if query < 2 chars)
  → Return { foods, recent, suggestions }
```

### Data Flow (Manual Log)
```
Food Search → Select food → Food Detail (serving size, quantity, meal type) → Log to meal_logs
  → logFoodToRecent() updates recent_foods table
  → syncUserData() refreshes nutrition store
  → Navigate back
```

### Serving Size Memory
- Each food log stores: `last_quantity`, `last_unit`, `last_meal_type`
- Pre-filled when user taps a recent food from search

## Key Decisions
- `router.back()` / `navigation.goBack()` replaced with explicit navigation where tab navigators have no history
- SQLite with FTS5 for food search (not a remote API) — works offline, fast, no rate limits
- `foods` table seeded from existing `food_database.json` (1016 entries) on first access, auto-migrated one-time
- FTS5 fallback to LIKE search when virtual table unavailable
- `ensureFoodDatabaseSeeded()` auto-runs on first `searchFoods()` call
- Nutrition always from DB, never AI — even Quick Add requires user-entered numbers
- Saved meals store pre-calculated totals + per-food breakdown
- Recent foods auto-tracked on every log via `logFoodToRecent()`

## Relevant Files
- `lib/foodSearch.ts` — Search engine: FTS5 queries, seed, recent/frequent, saved meals CRUD, calculateMacros
- `lib/db.ts` — Expanded schema v4: foods, food_servings, user_custom_foods, saved_meals, saved_meal_foods, recent_foods, FTS5 virtual table
- `app/modals/food-search.tsx` — Premium search screen with recent/frequent/saved meals/verified/Quick Add
- `app/modals/food-detail.tsx` — Food detail with serving selector, Quick Add mode, nutrition facts
- `app/modals/log-food.tsx` — Added "Search" button to tool row
- `app/(tabs)/food.tsx` — Added "Search Food Database" shortcut card
- `lib/nutritionScale.ts` — Core scaling engine
- `screens/FoodConfirmScreen.tsx` — AI food confirmation with confidence badges + meal insights
- `app/modals/camera-capture.tsx` — Premium camera UX
- `lib/nutritionAI.ts` — AI pipeline with confidence, quality analysis, deterministic fallback

## Pre-existing TS Errors (unchanged)
- `constants/exercises.ts(121-128)`: 8 errors — `"Cardio"` not assignable to `"Compound" | "Isolation"`
