# FitAI — Pulse AI Coach

**Your intelligent fitness companion.** FitAI is a React Native (Expo) application that provides AI-powered workout planning, nutrition tracking, and fitness coaching with a premium purple-white interface.

## Features

- **AI Workout Coach** — Generate personalized workout plans using Groq-powered AI with safety guardrails and rate limiting.
- **Smart Nutrition Logger** — Log meals via text, voice transcription, or image recognition.
- **Split Builder** — Design custom training splits with drag-and-drop simplicity.
- **Progress Tracking** — Visual progress charts, streak tracking, and body measurement logging.
- **Crash Reporting** — Production-grade error tracking with Sentry.
- **Analytics** — Privacy-conscious product analytics via PostHog.
- **Authentication** — Email/password and OAuth (Google, Apple) via Supabase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand stores |
| Backend | Supabase (auth, DB, storage) |
| AI | Groq API (LLM inference) |
| Crash Reporting | Sentry |
| Analytics | PostHog |
| File Upload | Cloudinary |
| Animation | React Native Reanimated |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
git clone https://github.com/DeaDPlayer1/FitAI.git
cd FitAI
npm install
```

### Environment Setup

```bash
cp .env.example .env.development
```

Edit `.env.development` with your API keys:

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_GROQ_API_KEY` | Yes | Groq API key for AI features |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Optional | Cloudinary upload preset |

### Running

```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

## Project Structure

```
FitAI/
├── app/                  # Expo Router pages (file-based routing)
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main tab navigation
│   └── modals/           # Modal screens
├── components/           # Reusable React Native components
│   └── ui/               # UI primitives (Button, Toast, etc.)
├── constants/            # Theme, colors, configuration
├── hooks/                # Custom React hooks
├── lib/                  # Core libraries (Sentry, analytics, AI, network)
├── store/                # Zustand state stores
├── supabase/             # Database schema and RLS policies
├── utils/                # Error boundary, helpers
├── app.json              # Expo configuration
├── eas.json              # EAS Build profiles
└── docs/                 # Production readiness documentation
```

## Scripts

| Script | Description |
|--------|-------------|
| `npx expo start` | Start development server |
| `npm run lint` | Run ESLint |
| `npx eas build --profile production` | Production build |
| `npx eas submit -p android` | Submit to Google Play |
| `npx eas submit -p ios` | Submit to App Store |

## Production

Before deploying to production, review:

- [Production Checklist](docs/PRODUCTION_CHECKLIST.md)
- [Security Checklist](docs/SECURITY_CHECKLIST.md)
- [Known Issues](docs/KNOWN_ISSUES.md)

## Security

- All secrets are managed via `.env` files — never hardcoded in source.
- AI responses are validated for safety (contraindicated exercises, harmful content).
- Rate limiting protects the AI endpoint from abuse.
- RLS policies secure all Supabase tables.

See [SECURITY.md](SECURITY.md) for full details.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
