# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solo Speak is an AI-powered multilingual learning platform that helps users learn foreign languages through AI-generated phrase translations (3 styles: general, polite, casual), speaking practice with voice recognition, quiz mode, and speech correction. Supports 9 languages with TTS audio playback and comprehensive ranking systems.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth & Storage**: Supabase (authentication, database hosting, file storage)
- **AI Services**: OpenAI GPT-4o-mini (phrase generation, speech correction), Google Cloud TTS (9 languages)
- **Payment**: Stripe (subscription management)
- **Audio**: FFmpeg (audio conversion for Safari compatibility), Web Speech API (speech recognition)

## Development Commands

### Environment Setup
```bash
# Install dependencies (IMPORTANT: use --legacy-peer-deps)
npm install --legacy-peer-deps

# Generate Prisma client (runs automatically after install)
npm run generate
```

### Development
```bash
# Local development (copies .env.local → .env)
npm run dev:local

# Production environment settings
npm run dev:production

# External access (e.g., from smartphone on same network)
npx next dev --hostname 0.0.0.0
```

### Build & Lint
```bash
npm run build:local           # Local build
npm run build:production      # Production build
npm run lint                  # ESLint check
```

### Database Management
```bash
# Migrations
npm run db:migrate:local      # Run migrations (local)
npm run db:migrate:production # Run migrations (production)
npm run db:push:local         # Push schema without migrations

# Prisma Studio (GUI database browser)
npm run db:studio:local
npm run db:studio:production

# Seeding (includes languages, phrase levels, speech statuses)
npm run db:seed:local
npm run db:seed:production
```

### Data Management Scripts
```bash
# Phrase levels (Lv1-Lv7 system)
npm run setup:phrase-levels:local
npm run update:phrase-levels:local
npm run cleanup:phrase-levels:local

# Speech statuses (A/B/C/D proficiency levels)
npm run seed:speech-statuses:local
npm run seed:speech-statuses:production

# Database diagnostics
npm run diagnose:db
```

## Architecture Overview

### Prisma Client Generation
- Prisma client is generated to `src/generated/prisma` (not default `node_modules/.prisma`)
- Import with: `import { prisma } from "@/utils/prisma"`
- Custom output location defined in `prisma/schema.prisma`

### API Route Pattern
All API routes follow this pattern:
1. **Locale extraction**: `getLocaleFromRequest(request)` for i18n error messages
2. **Authentication**: `authenticateRequest(request)` validates Supabase JWT token from `Authorization` header
3. **Request validation**: Zod schema validation
4. **Business logic**: Database operations via Prisma
5. **Response**: JSON with localized error messages via `getTranslation(locale, key)`

Example:
```typescript
const locale = getLocaleFromRequest(request);
const authResult = await authenticateRequest(request);
if ("error" in authResult) return authResult.error;
const body = await request.json();
const validatedData = schema.parse(body);
// ... business logic
```

### AI Integration Points

#### Phrase Generation (`src/app/api/phrase/generate/route.ts`)
- Uses **OpenAI Structured Outputs** with Zod schema (`phraseVariationsSchema`)
- Model: `gpt-4o-mini` (formerly `gpt-4.1-mini`)
- Prompt: `getPhraseGenerationPrompt()` from `src/prompts/phraseGeneration.ts`
- Returns 3 variations with explanations
- Decrements `user.remainingPhraseGenerations` on success

#### Speech Correction (`src/app/api/speech/correct/route.ts`)
- Prompt: `getSpeechCorrectionPrompt()` from `src/prompts/speechCorrection.ts`
- Provides grammar/pronunciation feedback and speaking plan
- Structured output for feedback and plan steps

### Database Models (Key Relationships)

```
User
├── phrases (Phrase[])
├── speeches (Speech[])
├── situations (Situation[])
├── nativeLanguage (Language)
└── defaultLearningLanguage (Language)

Phrase
├── user (User)
├── language (Language)
├── phraseLevel (PhraseLevel)  // Lv1-Lv7
├── quizResults (QuizResult[])
├── speakLogs (SpeakLog[])
└── speech (Speech?)           // Optional link to speech practice

Speech
├── user (User)
├── learningLanguage (Language)
├── nativeLanguage (Language)
├── feedback (SpeechFeedback?)
├── plan (SpeechPlan?)
├── phrases (Phrase[])         // Generated from speech
└── practices (SpeechPractice[])
```

### Daily Reset Logic
- **Phrase Generation**: `remainingPhraseGenerations` resets daily (tracked via `lastPhraseGenerationDate`)
- **Speech Practice**: `remainingSpeechCount` resets daily (tracked via `lastSpeechCountResetDate`)
- **Speaking Practice**: `dailySpeakCount` resets per phrase (tracked via `lastDailySpeakCountResetDate`)
- Reset logic handled by API endpoints before operations

### Speech Status System
Four proficiency levels for speech practice:
- **A**: Can speak fluently without script
- **B**: Can speak with partial script reference
- **C**: Can speak with full script reference
- **D**: Not reviewed yet

Stored in `SpeechStatus` table, seeded via scripts.

### i18n (Internationalization)
- Translation files: `public/locales/{lang}/common.json` (ja, en, etc.)
- Client-side: `useTranslation()` hook from `src/hooks/ui/useTranslation.ts`
- Server-side: `getTranslation(locale, key)` from `src/utils/api-i18n.ts`
- 97.8% key usage rate (see `i18n_final_report.md`)
- Management scripts: `check_i18n_usage.py`, `remove_unused_i18n_keys.py`

### Storage (Supabase)
- Audio files stored in Supabase Storage buckets
- Helper functions in `src/utils/storage.ts` and `src/utils/storage-helpers.ts`
- FFmpeg conversion for Safari compatibility (`src/utils/audio-converter.ts`)

### Stripe Integration
- Subscription management via webhooks (`src/app/api/stripe/webhook/route.ts`)
- Checkout session creation (`src/app/api/stripe/checkout/route.ts`)
- Customer portal for cancellation (`src/app/api/stripe/cancel/route.ts`)
- See `docs/stripe-webhook-setup.md`

## Important Conventions

### TypeScript Paths
- Use `@/` alias for `src/` directory (configured in `tsconfig.json`)
- Import examples: `@/utils/prisma`, `@/components/common/Button`, `@/hooks/phrase/usePhraseList`

### Component Organization
- `src/components/common/`: Shared UI components
- `src/components/auth/`: Authentication components
- `src/components/phrase/`: Phrase-related components
- `src/components/speech/`: Speech-related components
- `src/components/ranking/`: Ranking components
- `src/components/navigation/`: Navigation components

### Custom Hooks
- `src/hooks/api/`: API integration hooks (`useApi`, `useReactQueryApi`)
- `src/hooks/phrase/`: Phrase management hooks
- `src/hooks/speech/`: Speech management hooks
- `src/hooks/ui/`: UI-related hooks (modals, animations, TTS)
- `src/hooks/data/`: Data fetching hooks

### Error Handling
- Always use localized error messages via `getTranslation(locale, key)`
- Return proper HTTP status codes (401 for auth, 403 for limits, 404 for not found, 500 for errors)
- Validation errors return 400 with Zod error details

## Common Tasks

### Adding a New API Endpoint
1. Create route file in `src/app/api/{feature}/route.ts`
2. Import authentication: `import { authenticateRequest } from "@/utils/api-helpers"`
3. Import i18n: `import { getTranslation, getLocaleFromRequest } from "@/utils/api-i18n"`
4. Define Zod validation schema
5. Follow the API route pattern (see Architecture Overview)
6. Add error messages to translation files if needed

### Adding a New Database Model
1. Update `prisma/schema.prisma`
2. Run `npm run db:migrate:local` to create migration
3. Prisma client auto-regenerates in `src/generated/prisma`
4. Update seed scripts if needed (`prisma/seed.ts`)

### Working with OpenAI API
- Use **Structured Outputs** with Zod schemas for reliable parsing
- Import: `import { zodResponseFormat } from "openai/helpers/zod"`
- Define schema with `.describe()` for better AI understanding
- Model: `gpt-4o-mini` for cost-effective generation
- Temperature: 0.7 for balanced creativity

### Testing Locally
1. Set up `.env.local` with required environment variables (see README.md)
2. Run database migrations: `npm run db:migrate:local`
3. Seed database: `npm run db:seed:local`
4. Start dev server: `npm run dev:local`
5. Access at `http://localhost:3000`

### Testing on Mobile Device
1. Get Mac IP: `ipconfig getifaddr en0`
2. Start with external access: `npx next dev --hostname 0.0.0.0`
3. Access from phone: `http://<MAC_IP>:3000`
4. Ensure Mac and phone on same Wi-Fi

## Critical Notes

### DO NOT
- **Never skip `--legacy-peer-deps`** when running `npm install` (peer dependency conflicts exist)
- **Never commit `.env` files** - use `.env.local` for local development
- **Never modify Prisma client directly** - always edit `schema.prisma` and regenerate
- **Never hardcode API keys** - always use environment variables
- **Never skip Zod validation** in API routes (prevents invalid data)
- **Never use generic error messages** - always use localized translations

### ALWAYS
- **Use Prisma transactions** for multi-step database operations
- **Decrement usage counts** (phrase generations, speech count) after successful operations
- **Validate JWT tokens** via `authenticateRequest()` in all protected API routes
- **Return localized errors** using `getTranslation(locale, key)`
- **Follow the phrase level system** (Lv1-Lv7) when creating phrases
- **Use FFmpeg conversion** for audio files to ensure Safari compatibility

### Environment Variables
Required for local development:
- `DATABASE_URL`, `DIRECT_URL` (PostgreSQL)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase)
- `OPENAI_API_KEY` (OpenAI)
- `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_PRIVATE_KEY`, `GOOGLE_CLOUD_CLIENT_EMAIL` (TTS)
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (optional)

See README.md for full list and setup instructions.

## Documentation

Detailed docs in `docs/` directory:
- `docs/phrase-generation-README.md` - Phrase generation feature
- `docs/subscription-system-documentation.md` - Stripe integration
- `docs/daily-reset-logic.md` - Daily limit reset logic
- `docs/supported-languages.md` - Language support details
- `docs/api/` - API endpoint documentation
- `docs/supabase-storage-setup.md` - Storage configuration
- `docs/safari-audio-fix-ffmpeg.md` - Audio compatibility

## Reference Links

- Production: https://solo-speak.vercel.app
- GitHub: https://github.com/kohei240155/solo-speak
- Prisma schema: `prisma/schema.prisma`
- i18n reports: `i18n_final_report.md`, `i18n_analysis_report.md`
