# FitAI / Pulse AI — Release Notes

## Version 1.0.0 — Initial Production Release

**Release Date:** May 2026

### Overview
First production release of FitAI / Pulse AI — an AI-powered fitness and nutrition companion.

### New Features
- **Pulse AI Chat** — Real-time AI coaching powered by Groq (Llama 3.3 70B)
- **AI Nutrition Analysis** — Intelligent meal log analysis with health-condition awareness
- **Weekly Split Builder** — Design custom training splits with drag-and-drop exercises
- **Active Workout Tracking** — Real-time set/rep tracking with rest timer
- **Health-Aware Coaching** — AI adapts to CKD, Lupus, Diabetes, Hypertension, PCOS, and Thyroid conditions
- **Nutrition Tracking** — Log meals with calorie and macro breakdown
- **Consistency Heatmap** — Visual workout streak tracking
- **Dashboard** — Daily overview of nutrition, workouts, and goals

### Technical Highlights
- Built with Expo SDK 54 + React Native 0.81
- TypeScript throughout with strict mode
- Zustand state management
- Supabase backend with RLS
- Sentry crash reporting
- PostHog analytics
- AI rate limiting and safety validation
- Reanimated 4 animations

### Known Limitations
- See docs/KNOWN_ISSUES.md

### Setup Requirements
1. Supabase project with applied migrations
2. Groq API key for AI features
3. (Optional) Sentry DSN for crash reporting
4. (Optional) PostHog key for analytics
