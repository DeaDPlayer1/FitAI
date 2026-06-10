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
  - **Wired into app**: "Search" button in log-food tool row (replaces "Recent"), search shortcut card on food tab

### Done (cont.)
- **Phase 9: Global food database expansion (2043 foods, 17 cuisines)**:
  - **Data pipeline**: `scripts/global_food_data.js` — 50 cuisine category arrays covering Indian (284), Southeast Asian (261), Eastern European (154), African (149), American (130), French (110), Latin American (109), Mexican (101), Middle Eastern (100), Italian (91), Vietnamese (90), Thai (85), Japanese (84), Chinese (82), Caribbean (81), Mediterranean (71), Korean (61)
  - **Compact format**: `assets/global_food_database.json` — 236KB, 2043 entries as compact arrays `[canonical, display, cat, cuisine, cals_100, p_100, c_100, f_100, fiber_100, sugar_100, sodium_100, serving_desc, serving_grams, aliases?]`
  - **SQL seed**: `scripts/global_food_seed.sql` — 1.75MB, 2043 foods + 5948 serving variations
  - **Generators**: `scripts/generator.js` (SQL output) + `scripts/generateGlobalJson.js` (JSON output)
  - **v6 migration** (`lib/db.ts`): Added `display_name`, `base_serving_amount`, `base_serving_unit`, `base_serving_description` to foods table; `is_default`, `serving_description`, `amount_in_grams` to food_servings; rebuilt FTS5 index with `display_name` column
  - **Seed updated** (`lib/foodSearch.ts`): `ensureFoodDatabaseSeeded()` now seeds from both `food_database.json` (legacy) and `global_food_database.json` (new)
  - **Search improved**: LIKE fallback now also searches `display_name`, `category`, `cuisine`; FTS5 includes `display_name`
  - **UI updated** (`food-detail.tsx`, `food-search.tsx`): Display `display_name` when available with fallback to `canonical_name`; cuisine/category badges shown on food detail
  - **No new TS errors**: Only pre-existing `exercises.ts` Cardio errors remain

### Done (cont.)
- **Phase 10: Complete restaurant + fast-food nutrition ecosystem**:
  - **Restaurant food database** (`assets/restaurant_food_database.json`): 31 chains, 558 menu items with verified nutrition (expanded from 188 items across 23 chains). Added 370 new items + 8 new chains: Wendy's, Popeyes, Chick-fil-A, Papa John's, Five Guys, Sagar Ratna, Jumboking, Goli Vada Pav.
  - **Database schema** (`lib/db.ts` v8): `restaurant_brands`, `restaurant_foods`, `restaurant_foods_fts` (FTS5), `user_restaurant_favorites` tables. Auto-seeded from JSON.
  - **Canonicalization engine** (`lib/restaurantCanonicalizer.ts`): Brand-aware food matching, alias resolution, typo correction. Maps "mcallo tikki" → McDonald's McAloo Tikki Burger, "zinger" → KFC Zinger Burger, "whopper" → Burger King Whopper. 200+ static alias mappings + fuzzy brand detection.
  - **Restaurant search** (`lib/restaurantSearch.ts`): Brand-aware FTS5 search, menu browsing by category, brand detection from query text, full menu retrieval with category counts.
  - **AI text analyzer fix** (`lib/nutritionAI.ts`): Updated entity extraction prompt to recognize restaurant foods ("mcallo tikki", "zinger", "whopper", etc.). Added restaurant DB lookup in `processEntity()` with brand-prefixed result naming.
  - **Food search integration** (`lib/foodSearch.ts`): `searchFoods()` now returns `restaurantItems`, `detectedBrand`, `brandEmoji`. Restaurant results shown alongside regular food results with "Chain" badge.
  - **Chain Menu UI** (`app/modals/chain-menu.tsx`): Full brand hero with emoji + cuisine/country badges, category tab bar, menu item cards with calories/macros, quick-log to food-detail. Animated with Reanimated.
  - **Food search screen update** (`app/modals/food-search.tsx`): Added "Chains" tab showing all restaurant brands as cards. Restaurant results display in search with brand header. Brand detection header ("View full menu" link).
  - **Food search redesign**: Replaced 5 tabs (Recent/Favorites/High Protein/Meals/Chains) with 4 quick action cards (Barcode/Quick Add/Meals/Camera) in food-search initial view. Simplified to search + quick actions.
  - **Food tab shortcut** (`app/(tabs)/food.tsx`): Added "Restaurant Chains" shortcut card linking to chain browser.
  - **Nutrition AI entity extraction**: Updated Groq system prompt to handle restaurant food names with quantity parsing.
  - **Architecture**: All nutrition from verified DB — AI only extracts food names/quantities. Brand detection → canonical name → DB lookup → per-100g scaling → result.

### Done (cont.)
- **Brand badges + verified chain info**: FoodDetail screen now shows polished LinearGradient brand badges with emoji, cuisine tag, chevron CTA to chain menu, and verified check badge. Non-brand food shows cuisine/category badges with LinearGradient styling and icons.
- **Restaurant DB re-seeding**: `restaurantSearch.ts:ensureSeeded()` now checks `_meta.restaurant_db_version` key to detect outdated DB and re-seeds from JSON without manual migration.

### Done (cont.)
- **QA overhaul — 34 bugs found, 34 fixed**:
  - **Critical (4)**: Serving inflation bug (100x), Math.random() keys, 16 silent catch blocks, ReDoS attack surface
  - **High (9)**: Infinite spinner, negative kcal, search error handling, stale search race, router.back() fails, sync hides success, duplicate recent-frequent foods, no loading skeleton, keyboard search key
  - **Medium (8)**: Tooltip timer leak, array keys, createMeal fiber=0, gramText/quantity desync, barcode/camera params missing, restaurant FTS rebuild broken, logFoodToRecent race condition, parseServingGrams word boundary
  - **Low (9)**: parseInt truncation, hardcoded fiber, Quick Add missing fiber, substring match priority, USDA sodium unit, restaurantTotalToPer100g, isFavourite unpersisted, createMeal quantity heuristic, date boundary
  - **Fixes in**: `nutritionScale.ts`, `food-detail.tsx`, `food-search.tsx`, `foodSearch.ts`, `nutritionAI.ts`, `safetyEngine.ts`, `db.ts`, `nutritionStore.ts`
- **Cardio TS errors fixed** (`constants/exercises.ts:6`): Added `| 'Cardio'` to `Exercise.type` union
- **Test framework configured**: `npm test` (Jest), `npm run test:nutrition` (81 standalone tests), `npm run test:qa` (30 QA tests), `npm run test:all` (all 3 suites)

### In Progress
- (none)

### Blocked
- (none)

## Food Search Architecture

### Search Priority Ranking
1. Exact prefix match
2. FTS5 full-text match (display_name, aliases, search_terms, category, cuisine)
3. LIKE fallback on canonical_name, display_name, aliases, search_terms, category, cuisine
4. Suggestions derived from top results or alias matches

### Search Flow
```
User types → 150ms debounce → searchFoods(text, userId, mealType)
  → Check in-memory cache (5s TTL)
  → FTS5 query (canonical_name* alias* search_terms* display_name*)
  → Fallback: LIKE %query% (searches canonical_name, display_name, aliases, search_terms, category, cuisine)
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
- Global database (2043 entries) seeded from `global_food_database.json` alongside legacy seed
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
- `scripts/expand_restaurant_db.js` — Restaurant DB expansion script (188 → 558 items)
- `scripts/global_food_data.js` — 2043 foods across 50 cuisine categories (17 cuisine groups)
- `scripts/generator.js` — SQL seed generator (reads cuisine data → `global_food_seed.sql`)
- `scripts/generateGlobalJson.js` — Compact JSON generator (reads cuisine data → `global_food_database.json`)
- `assets/global_food_database.json` — 236KB, 2043 entries, compact array format
- `assets/food_database.json` — Legacy 1016 Indian food entries

## Pre-existing TS Errors (unchanged)
- `constants/exercises.ts(121-128)`: 8 errors — `"Cardio"` not assignable to `"Compound" | "Isolation"`
