# FitAI / Pulse AI — Production Deployment Checklist

## Pre-Deployment

### Infrastructure
- [ ] Supabase project is on a paid plan (enough quota for user base)
- [ ] Groq API key is set to production key (not development)
- [ ] Sentry DSN is configured and verified
- [ ] PostHog project is set up and API key configured
- [ ] Cloudinary account is configured for image uploads
- [ ] EAS project ID is set in app.json

### Environment
- [ ] `.env.production` has all required variables
- [ ] `EXPO_PUBLIC_APP_ENV=production` is set
- [ ] All API keys are production keys with appropriate rate limits
- [ ] Supabase RLS policies are applied (see supabase/rls-policies.sql)

### Build
- [ ] App version is bumped (`app.json` → `version` + `android.versionCode` + `ios.buildNumber`)
- [ ] Latest code is merged to main/release branch
- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero errors
- [ ] EAS Build production profile runs successfully
- [ ] APK/AAB is generated and tested on a physical device

### Testing (Manual)
- [ ] Full onboarding flow works end-to-end
- [ ] Sign up, sign in, sign out work correctly
- [ ] AI chat sends and receives messages
- [ ] Nutrition tracking logs and displays correctly
- [ ] Workout split builder loads and saves
- [ ] Active workout tracking works
- [ ] Profile editing saves correctly
- [ ] Health conditions toggle persists
- [ ] Data persists across app restarts
- [ ] No crashes on app launch

### Security
- [ ] Supabase RLS policies are active on all tables
- [ ] No anon key leaks in client-side code
- [ ] AI rate limiting is active (see lib/aiRateLimiter.ts)
- [ ] Sentry error tracking is capturing exceptions
- [ ] No API keys in source code (all in .env)

## Post-Deployment

### Monitoring
- [ ] Sentry dashboard shows no critical errors
- [ ] PostHog events are being captured correctly
- [ ] Supabase dashboard shows normal query patterns
- [ ] Groq API usage is within budget

### Rollback Plan
- EAS Build: `eas build:rollback` or deploy previous build version
- Supabase: Database backups are enabled (point-in-time recovery)
- Environment: Previous `.env.production` is backed up

## Release Notes
- See RELEASE_NOTES.md for current version changes
- See KNOWN_ISSUES.md for known limitations
