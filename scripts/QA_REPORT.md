# MASTER QA REPORT — NUTRITION LOGGING SYSTEM

**Date:** 2026-06-10  
**Tester:** Automated QA Agent  
**Scope:** Full nutrition logging ecosystem  
**Build:** FitnessApp (React Native / Expo)

---

## 1. EXECUTIVE SUMMARY

The nutrition logging system is **functionally sound** but has **several production-critical bugs** that could cause incorrect calorie/macro logging, data corruption, and silent failures. The core scaling engine (nutritionScale.ts) is correct after recent fixes. The most dangerous bug is a **100x serving inflation** triggered by tapping the "Custom" serving button. The second-most-critical is **50+ silent catch blocks** across the AI pipeline that hide all failures from the user.

**Production Readiness: 6/10** — Fix the critical and high bugs before shipping.

---

## 2. TOTAL BUGS FOUND: 34

| Severity | Count |
|----------|-------|
| **Critical** | 4 |
| **High** | 9 |
| **Medium** | 12 |
| **Low** | 9 |

---

## 3. CRITICAL BUGS (4)

### C1. Serving Inflation Bug — Custom Chip
- **Location:** `app/modals/food-detail.tsx:181,305,370`
- **Reproduction:** Open any food → tap "Custom" in serving chips → tap "Log"
- **Expected:** Logs 1 serving (e.g., 100g of 165 kcal/100g chicken = 165 kcal)
- **Actual:** `quantity = 100, unit = 'serving'` → `grams = quantity * sg = 100 * 100 = 10000g` → logs **16,500 kcal**
- **Why:** `ServingChips` line 181 calls `onSelect(sg, 'serving', 'custom')` → `handleServingSelect` sets `quantity = sg` (100) and `unit = 'serving'`. Both `useMemo` (line 305) and `handleLog` (line 370) compute `grams = quantity * sg = 100 * 100 = 10000`.
- **Fix:** The "Custom" serving should set `quantity = 1` (not `sg`) when switching to serving mode. Change line 181: `onSelect(1, 'serving', 'custom')`.  
  Also fix lines 305 and 370 to handle this consistently.
- **Confidence:** 100% — Confirmed by test.

### C2. Math.random() as FlatList Key
- **Location:** `app/modals/food-search.tsx:378`
- **Reproduction:** Search for any food → results render → observe React devtools component tree
- **Expected:** Stable keys for list reconciliation
- **Actual:** `keyExtractor={(item) => String(item.id || Math.random())}` — every render generates new random keys → **every item unmounts and remounts** on every state change
- **Why:** `Math.random()` returns a new value each call. React uses keys to identify items across renders — changing keys destroys all animation/mount state.
- **Fix:** Use a deterministic fallback: `String(item.id || item.canonical_name || index)`
- **Confidence:** 100%

### C3. 50+ Silent Catch Blocks
- **Location:** `lib/nutritionAI.ts` (15+ occurrences), `lib/foodSearch.ts`, `lib/db.ts`, `lib/barcodeService.ts`
- **Reproduction:** Turn off network → search for food or scan barcode or use AI analysis
- **Expected:** User-friendly error message
- **Actual:** All failures silently caught with empty `catch {}` blocks. User sees no error, just empty results or stale data.
- **Why:** Pervasive pattern `catch {}` (no logging, no user feedback) across the entire AI pipeline.
- **Fix:** Every `catch {}` should at minimum `console.warn` the error. Critical paths should show user-facing toasts.
- **Confidence:** 100%

### C4. Safety Engine ReDoS Vulnerability
- **Location:** `lib/safetyEngine.ts:52-68`
- **Reproduction:** Submit input like `"ignore all previous instructions and " + "a".repeat(100000)` to AI text analysis
- **Expected:** Fast regex processing
- **Actual:** `\s+` in injection patterns causes catastrophic backtracking on crafted input → app freezes
- **Why:** Multiple unanchored regexes with `\s+` quantifiers can cause O(2^n) backtracking.
- **Fix:** Use `\s` (single space) instead of `\s+`, or add ReDoS-safe guards. Limit input length to 1000 chars before safety check.
- **Confidence:** 90%

---

## 4. HIGH PRIORITY BUGS (9)

### H1. Infinite Skeleton on Fetch Error
- **Location:** `app/modals/food-detail.tsx:267-274`
- **Reproduction:** Navigate to food detail while offline or when DB is corrupted
- **Expected:** Error message or retry UI
- **Actual:** `setLoading(false)` is inside a `try` block that wasn't there — if `getFoodById` throws, `setLoading` is never called → **infinite spinner**
- **Fix:** Wrap the async IIFE in try/catch, call `setLoading(false)` in `finally`

### H2. Negative Calories Can Be Logged
- **Location:** `app/modals/food-detail.tsx:357-360`
- **Reproduction:** Quick Add → enter `-500` in calories → tap Log
- **Expected:** Negative values rejected or sanitized to 0
- **Actual:** `parseInt("-500") = -500`, then `-500 || 0` = `-500` (because `-500` is truthy) → logs negative calories
- **Fix:** Wrap with `Math.max(0, ...)`: `const cal = Math.max(0, parseInt(quickCal) || 0)`

### H3. parseInt Truncates Quick Add Calories
- **Location:** `app/modals/food-detail.tsx:357`
- **Reproduction:** Quick Add → enter `500.9` calories
- **Expected:** 500.9 kcal logged
- **Actual:** 500 kcal logged (lost 0.9 kcal)
- **Fix:** Change `parseInt(quickCal)` to `parseFloat(quickCal)`

### H4. No Error Handling in Search
- **Location:** `app/modals/food-search.tsx:237-243`
- **Reproduction:** Search while offline → `searchFoods()` throws
- **Expected:** Error message shown to user
- **Actual:** `finally { setSearching(false) }` — error is silently swallowed, user sees empty results with no explanation
- **Fix:** Add `catch` block with user-facing toast

### H5. Stale Search Results Race Condition
- **Location:** `app/modals/food-search.tsx:236-243`
- **Reproduction:** Type "a" → immediately type "ab" before 150ms debounce resolves "a"
- **Expected:** Only "ab" results shown
- **Actual:** "a" results flash briefly, then "ab" results appear
- **Why:** No `AbortController` — in-flight `searchFoods("a")` resolves and overwrites results
- **Fix:** Track latest query string and ignore stale responses

### H6. `router.back()` With No History
- **Location:** `app/modals/food-detail.tsx:400`
- **Reproduction:** Navigate directly to food-detail (e.g., from push notification or deep link) → log food
- **Expected:** Navigate back to food tab
- **Actual:** `router.back()` does nothing when there's no history → user is stuck
- **Fix:** Check `router.canGoBack()` and fallback to `router.navigate('/(tabs)/food')`

### H7. syncUserData Failure Fails the Whole Log
- **Location:** `app/modals/food-detail.tsx:385`
- **Reproduction:** Log food → Supabase insert succeeds → `syncUserData` throws (network blip)
- **Expected:** Food is logged (data in DB), user sees success
- **Actual:** `syncUserData` throws → catch block shows "Error" alert → user thinks log failed (but the insert succeeded)
- **Fix:** Wrap sync in a separate try/catch after the success alert

### H8. Duplicate Keys in Recent + Frequent
- **Location:** `app/modals/food-search.tsx:317`
- **Reproduction:** Log "Chicken" 3 times → open food search
- **Expected:** "Chicken" appears once in Frequent (or Recent)
- **Actual:** "Chicken" appears in BOTH Recent AND Frequent sections (duplicate)
- **Fix:** Deduplicate across sections before rendering

### H9. No Loading Indicator on Initial Data Load
- **Location:** `app/modals/food-search.tsx:204-211`
- **Reproduction:** Launch app fresh → open food search immediately
- **Expected:** Loading spinner while DB seeds
- **Actual:** Blank screen below quick action chips for 1-3 seconds
- **Fix:** Add `isInitialLoading` state and render spinner

---

## 5. MEDIUM BUGS (12)

| # | Issue | Location | Line(s) | Fix |
|---|-------|----------|---------|-----|
| M1 | Tooltip setTimeout not cleaned up | food-search.tsx | 215-218 | Store timer ref, clear in cleanup |
| M2 | No `onSubmitEditing` for search keyboard | food-search.tsx | 337 | Add handler to trigger search immediately |
| M3 | Array index as key in recent/frequent lists | food-search.tsx | 474, 488 | Use `item.food_name` as key |
| M4 | Quick Add missing fiber_g in supabase insert | food-detail.tsx | 363-367 | Hard to fix without DB column — doc as known limitation |
| M5 | createMeal fiber hardcoded to 0 | food-detail.tsx | 393 | Pass `scaled?.fiber || 0` instead |
| M6 | `gramText`/`quantity` desync on invalid input | food-detail.tsx | 739 | Reset gramText on invalid parse |
| M7 | `isFavourite` not persisted | food-detail.tsx | 329-333 | Save to recent_foods or user_favorites table |
| M8 | `parseServingGrams` returns 1 for "1 glass" (FIXED) | nutritionScale.ts | 272 | Fixed with word boundary |
| M9 | `estimateBaseNutrition` doesn't extract ml (FIXED) | nutritionScale.ts | 175-186 | Fixed with parseServingMl + extractCountAmount |
| M10 | logFoodToRecent UNIQUE constraint race | foodSearch.ts | 489-505 | Use `INSERT OR REPLACE` instead of SELECT-then-UPDATE/INSERT |
| M11 | Barcode quick action omits mealType/returnTo | food-search.tsx | 301 | Pass through params |
| M12 | Restaurant FTS contentless table not searchable | db.ts | 652 | Change to content=restaurant_foods FTS5 |

---

## 6. UX IMPROVEMENTS (8)

| # | Issue | Location | Recommendation |
|---|-------|----------|---------------|
| UX1 | No upper bound on gram input | food-detail.tsx:739 | Cap at 5000g or show warning |
| UX2 | Adjust buttons show "g" even in serving mode | food-detail.tsx:751-762 | Dynamic labels based on current unit |
| UX3 | No KeyboardAvoidingView on search | food-search.tsx | Add to prevent keyboard overlap on iOS |
| UX4 | Favorites not functional (heart icon) (FIXED) | food-detail.tsx:590 | Changed to Ionicons heart/heart-outline |
| UX5 | Spinner replaces results on search (no keep-existing) | food-search.tsx:384 | Show spinner IN results, not replacing them |
| UX6 | `showMealSheet` dead state | food-detail.tsx:220 | Remove unused state |
| UX7 | `servings` loaded but never used | food-detail.tsx:272, 726 | Remove or actually display alternate servings |
| UX8 | No `ListEmptyComponent` for initial view | food-search.tsx:454-506 | Show "No recent foods — scan a barcode or search above" |

---

## 7. PERFORMANCE ISSUES (5)

| # | Issue | Cause | Impact |
|---|-------|-------|--------|
| P1 | All restaurant items rendered at once | food-search.tsx:420-444 `.map()` in header | Slow with 50+ restaurant results |
| P2 | Math.random() keys destroy reconciliation | food-search.tsx:378 | Full list remount on every render |
| P3 | No virtualization for recent/frequent | food-search.tsx:474-494 | OK for small lists (max 10) but not scalable |
| P4 | Circuit breaker race condition | groq.ts:55-77 | Module-level globals with `await` gaps |
| P5 | Rate limiter not per-endpoint | groq.ts:18-31 | Image quality checks can block text extraction |

---

## 8. SUGGESTED ARCHITECTURE FIXES

### Fix Order (Priority)

1. **Fix C1 (Serving inflation)** — One line change, highest user impact
2. **Fix C2 (Math.random keys)** — One line change, visible to every search
3. **Fix C3 (Silent catches)** — Systematic: add logging wrapper or middleware
4. **Fix H1 (Infinite skeleton)** — Wrap async effect in try/catch/finally
5. **Fix H2+H3 (Negative + truncated calories)** — Math.max(0, parseFloat(...))
6. **Fix H6 (Router back safety)** — canGoBack() fallback
7. **Fix H7 (Sync failure masking success)** — Separate sync into its own try/catch
8. **Fix H4+H5 (Search error handling + race)** — Add catch + AbortController pattern
9. **Fix M10 (logFoodToRecent race)** — UPSERT instead of SELECT-check
10. **Fix M8+M9 (parseServingGrams + ml extraction)** — Already done in this session

### Architectural Recommendations

- **Add a logging utility** with severity levels instead of `catch {}`
- **Add AbortController pattern** to all async search/analysis functions  
- **Create a `safeInsert` wrapper** for Supabase that validates data shape before insert
- **Add input validation middleware** for all route params (Zod or io-ts)
- **Consolidate version tracking** (stop using both `_meta` and `PRAGMA user_version`)

---

## 9. MOST DANGEROUS PRODUCTION RISKS

| Rank | Risk | Impact | Likelihood |
|------|------|--------|------------|
| 1 | **C1 — Serving inflation** | User logs 16,500 kcal instead of 165 kcal | **High** (Custom chip is visible, users will tap it) |
| 2 | **C3 — Silent failures everywhere** | AI/barcode/search fails silently → user gets wrong/no data | **Very High** (50+ locations) |
| 3 | **C2 — Math.random keys** | All lists flash/remount → terrible UX → users churn | **High** (affects every search) |
| 4 | **C4 — ReDoS vulnerability** | App freezes on crafted input | **Low** (requires malicious input) |
| 5 | **H1 — Infinite spinner** | User stuck on loading screen | **Medium** (occurs on connectivity issues) |
| 6 | **H2 — Negative calories** | User can log -500 kcal → corrupts daily totals | **Medium** (manual Quick Add abuse) |
| 7 | **M12 — Restaurant FTS broken** | Restaurant search returns nothing → feature is invisible | **High** (all restaurant users affected) |
| 8 | **M10 — Unique constraint race** | logFoodToRecent throws → silent catch → recent food lost | **Medium** (concurrent log spam) |

---

## 10. PRODUCTION READINESS SCORE: 6/10

| Area | Score | Notes |
|------|-------|-------|
| Core scaling engine | 9/10 | Correct after fixes, 81 tests pass |
| Food search | 5/10 | Math.random keys, no error handling, stale race |
| AI pipeline | 3/10 | 50+ silent catches, no JSON validation, ReDoS |
| Barcode | 6/10 | Basic works, USDA unit assumption fragile |
| Restaurant | 5/10 | FTS broken, brand detection over-matches |
| Food detail/log | 5/10 | **Serving inflation bug**, router.back safety, negative cals |
| Database | 7/10 | Schema good, migration ordering fragile |
| State management | 6/10 | Sync race, servingScale lost on sync |
| UX | 5/10 | No loading states, dead UI elements, keyboard issues |
| Error handling | 2/10 | Silent catches everywhere, unhelpful error messages |

**FIX THE 4 CRITICAL BUGS BEFORE SHIPPING TO PRODUCTION.**

---

*Report generated by automated QA testing — scripts/test_nutrition_scale.js (81 tests) + scripts/qa_validation_tests.js (30 tests)*
