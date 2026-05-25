# FitAI / Pulse AI — Known Issues

## Current Version (1.0.0)

### High Priority
1. **Offline mode is limited** — App requires internet connection for AI features and syncing. Basic cached data may be available.
2. **Social OAuth requires Supabase configuration** — Google/Apple/Facebook login buttons require OAuth providers to be configured in Supabase dashboard.
3. **Splash screen logo needs replacement** — Assets/images should be replaced with production FitAI branding assets.

### Medium Priority
1. **No push notifications** — Reminder notifications for meals and workouts are not implemented.
2. **Activity log integration** — Apple Health / Google Fit integration is stubbed but not fully implemented.
3. **Export data** — Profile export functionality shows "Coming Soon".
4. **Chat history persistence** — AsyncStorage write failures on low-storage devices could lose chat history.

### Low Priority
1. **Weight unit conversion** — Height unit conversion (ft to cm) may have rounding edge cases.
2. **Active workout timer** — Rest timer continues when app is backgrounded.
3. **Macro display** — Nutrition macros show "Goal: Xg" even when goal is 0 (division by zero prevented).

### Fixed in 1.0.0
- All issues from the production QA report (see QA report for details):
  - C1: saveSplit crash-safe rollback
  - C2: Forgot password sends actual email
  - C3: Social OAuth buttons work
  - C4: Nutrition-specific AI prompt (was 346 lines)
  - H1-H6: High priority bugs resolved
  - M1-M7: Medium priority bugs resolved
  - Plus performance, persistence, AI safety, and polish fixes
