# FitAI / Pulse AI — Security Checklist

## Data Protection

### In Transit
- [ ] All API calls use HTTPS (Supabase, Groq, Cloudinary)
- [ ] Supabase anon key is publishable-safe (RLS enforces access)
- [ ] Auth tokens are never logged

### At Rest
- [ ] Supabase RLS policies on ALL tables (see supabase/rls-policies.sql)
- [ ] Health conditions data is isolated per user
- [ ] AI chat history is stored locally only (AsyncStorage)
- [ ] No sensitive data in source code

### Authentication
- [ ] Email/password auth via Supabase
- [ ] OAuth providers configured in Supabase dashboard
- [ ] Session management via Supabase auth
- [ ] 15-second session check timeout prevents hanging

## AI Safety
- [ ] AI rate limiting (10 req/min, 100 req/day per user)
- [ ] Response validation for contraindicated advice
- [ ] Medical disclaimer enforced for health conditions
- [ ] 30-second API timeout prevents hanging requests
- [ ] No medical advice — always includes disclaimer

## API Key Management
- [ ] No keys hardcoded in source code
- [ ] All keys loaded via environment variables
- [ ] Separate dev/prod API keys
- [ ] Groq API key is server-side only (not exposed to clients directly)

## Privacy
- [ ] Health data never shared between users
- [ ] Analytics events are anonymized
- [ ] Privacy policy available (see app-store/privacy-policy.md)

## Monitoring
- [ ] Sentry captures exceptions with context
- [ ] Error logs don't include PII
- [ ] Rate limit violations are logged
