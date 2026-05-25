# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (latest) | ✅ Supported |

## Reporting a Vulnerability

If you discover a security vulnerability in FitAI, please report it privately:

- **Email:** (open an issue on GitHub for now)
- **Do not** disclose the vulnerability publicly until it has been addressed.

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

---

## Security Practices

### 1. API Keys & Secrets

- **All secrets** are stored in `.env` files — never hardcoded in source code.
- `.env*` files are excluded from version control via `.gitignore`.
- The template `.env.example` contains placeholder values only.
- Production builds use a separate `.env.production` with restricted keys.

### 2. AI Safety

- AI responses are validated by a safety validator (`lib/aiRateLimiter.ts`) that detects:
  - Contraindicated exercises (e.g., exercising on injured body parts)
  - Hateful, harmful, or sexually explicit content
  - Medical advice requests (redirects to professional consultation)
- Rate limiting: 10 requests/minute, 100 requests/day per device.

### 3. Authentication & Authorization

- **Supabase Row Level Security (RLS)** is enforced on all database tables.
- See `supabase/rls-policies.sql` for the full policy definitions.
- Row-level access ensures users can only access their own data.

### 4. Network Security

- All API calls use HTTPS.
- Offline-aware fetch wrapper (`lib/network.ts`) with retry logic.
- Network status monitoring via `@react-native-community/netinfo`.

### 5. Crash Reporting

- Sentry is configured for production environments only.
- Development environments suppress all external crash reporting calls.

### 6. Analytics

- PostHog is configured for production environments only.
- No analytics tracking occurs in development mode.

### 7. Build Security

- Obfuscation enabled in production EAS builds (`hermes` with compiler optimizations).
- Sentry source maps are uploaded during builds for crash debugging.
- Environment-specific build profiles in `eas.json`.

---

## Dependency Management

- Dependencies are audited regularly with `npm audit`.
- Minimum version requirements are enforced in `package.json`.
- Known moderate vulnerabilities are reviewed before each release.

---

## Compliance Notes

- This application does **not** collect HIPAA-protected health information.
- User data is stored in Supabase (SOC 2 compliant).
- AI features use Groq API — review Groq's data processing agreement for compliance.
- Cloudinary is used for image uploads — ensure upload presets are configured as "signed".
