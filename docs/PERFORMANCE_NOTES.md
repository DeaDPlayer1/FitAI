# FitAI / Pulse AI — Performance Notes

## Build Size
- APK size (production): ~40-50MB (estimated)
- AAB size (production): ~30-40MB (estimated)

## Startup Time
- Cold start: ~2-3 seconds on mid-range Android
- Warm start: ~1 second
- Font loading is the main bottleneck (5 font families)
- Future optimization: subset fonts

## Rendering Performance

### Dashboard
- `CompactHeader`, `SectionLabel` — React.memo'd
- Scroll handler uses Reanimated worklets (no JS thread blocking)
- Parallel data fetching with `Promise.all`

### Nutrition Tab
- `MacroPill` extracted to module scope (not recreated on render)
- Meal list memoized with `useMemo`
- AnimatedProgress uses interval with proper cancellation

### AI Chat
- Chat history truncated to last 15 messages for API calls
- `stripJson` processed eagerly with `useMemo`
- Messages rendered with FadeInView animation (limited to first 20)
- Typewriter text only on last assistant message

### Split Builder
- State persisted to AsyncStorage with 500ms debounce
- Save uses crash-safe rollback

## Memory Management
- Chat history kept in memory (~last 100 messages)
- No image caching strategy yet (future: expo-image + blurhash)
- Exercise list uses FlatList-compatible mapping

## Network
- Groq API has 30-second timeout
- Retry logic with exponential backoff (2 retries)
- Offline detection via AppState listener
- Fallback to cached data when offline

## Render Optimization Checklist
- [x] React.memo on list components
- [x] useMemo on expensive computations
- [x] useCallback on event handlers passed to children
- [x] Animated libraries use native drivers where possible
- [x] Avoid inline object/function creation in render
- [x] Large lists use appropriate virtualization
- [x] Images sized appropriately for display
