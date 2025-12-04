# Solo Speak

AI-Powered Multilingual Learning Platform

## 🌟 Overview

Solo Speak is a comprehensive web application that leverages AI technology to support foreign language learning. When users input phrases they want to say, AI translates them in three styles (general, polite, casual) with audio support. Additionally, it provides a systematic and enjoyable language learning experience through quiz features, speaking practice, and ranking systems.

## ✨ Key Features

### 🤖 AI Phrase Generation

- High-quality translation using ChatGPT API
- Translation suggestions in 3 styles (general, polite, casual)
- Natural translations considering context and situations
- 7-level learning system (Lv1-Lv7)

### 🎙️ Speaking Practice

- **Voice Input**: Real-time speech recognition
- **AI Correction System**: Automatic pronunciation and grammar correction via ChatGPT API
- **Speaking Plan**: Step-by-step learning plan presentation
- **Practice History**: Review and revisit past practice records
- **Status Management**: 4-level proficiency evaluation (A: Fluent, B: Partially referenced, C: Reference needed, D: Not reviewed)

### 📚 Multilingual Support

- Supports **9 languages** (English, Japanese, Korean, Chinese, Spanish, French, Portuguese, German, Thai)
- User native language and learning language settings
- Full multilingual UI support
- Complete i18n support (97.8% translation key usage rate)

### 🎯 Personalized Learning

- **Phrase Management**: User-specific phrase collection
- **Quiz Mode**: 4-choice quiz system for review
- **Learning Progress Tracking**: Practice count, accuracy rate, streak records
- **Daily Reset**: Daily speaking count limit
- Individual learning experience and customization

### 🏆 Ranking System

- **Quiz Ranking**: Competition by accuracy rate and streak
- **Speaking Ranking**: Ranking by practice volume
- **Phrase Streak Ranking**: Consecutive learning days record
- Real-time updated global rankings

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management
- **React Hot Toast** - Notification system

### Backend

- **Next.js API Routes** - Server-side API
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Supabase** - Authentication, database hosting, and storage

### AI & APIs

- **OpenAI GPT-4o-mini** - Phrase generation and correction system
- **Google Cloud Text-to-Speech** - Speech synthesis (9 languages supported)
- **Web Speech API** - Speech recognition
- **Stripe** - Subscription management and payment processing

### Development Tools

- **ESLint** - Code quality
- **PostCSS** - CSS processing
- **tsx** - TypeScript runner

## 🚀 Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/kohei240155/solo-speak.git
cd solo-speak
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

### 3. Configure Environment Variables

Create a `.env.local` file and set the following environment variables:

```env
# Database
DATABASE_URL="your_postgresql_url"
DIRECT_URL="your_postgresql_direct_url"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# OpenAI
OPENAI_API_KEY="your_openai_api_key"

# Google Cloud (Optional)
GOOGLE_CLOUD_PROJECT_ID="your_project_id"
GOOGLE_CLOUD_PRIVATE_KEY="your_private_key"
GOOGLE_CLOUD_CLIENT_EMAIL="your_client_email"

# Stripe (Optional)
STRIPE_SECRET_KEY="your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run generate

# Run database migrations
npm run db:migrate:local

# Seed database (includes languages, phrase levels, and speech statuses)
npm run db:seed:local
```

### 5. Start Development Server

```bash
npm run dev:local
```

The application will start at `http://localhost:3000`.

## 🎮 How to Use Main Features

### Phrase Generation

1. Go to `/phrase/add`
2. Select a situation
3. Enter a phrase
4. Choose from 3 styles

### Quiz Mode

1. Go to `/phrase/quiz`
2. Set level and filters
3. Challenge 4-choice quizzes
4. Track accuracy rate and streak

### Speaking Practice

1. Go to `/phrase/speak`
2. Practice phrases with voice
3. Be mindful of daily reset

### Speech Practice

1. Go to `/speech/add`
2. Enter a topic
3. Receive AI correction
4. Review at `/speech/review`

The application will be available at `http://localhost:3000`.

## 📂 Project Structure

```
solo-speak/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── dashboard/    # Dashboard API
│   │   │   ├── languages/    # Language master API
│   │   │   ├── phrase/       # Phrase generation & management
│   │   │   ├── ranking/      # Ranking system
│   │   │   ├── speech/       # Speech practice
│   │   │   ├── stripe/       # Subscription
│   │   │   ├── tts/          # Text-to-speech
│   │   │   └── user/         # User settings
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard
│   │   ├── phrase/           # Phrase features
│   │   │   ├── add/         # Phrase generation
│   │   │   ├── list/        # Phrase list
│   │   │   ├── quiz/        # Quiz mode
│   │   │   └── speak/       # Speaking practice
│   │   ├── ranking/          # Rankings
│   │   ├── settings/         # Settings
│   │   ├── speech/           # Speech practice
│   │   │   ├── add/         # New speech
│   │   │   ├── list/        # Speech list
│   │   │   └── review/      # Speech review
│   │   └── ...
│   ├── components/           # React components
│   │   ├── auth/            # Authentication related
│   │   ├── common/          # Common components
│   │   ├── navigation/      # Navigation
│   │   ├── phrase/          # Phrase related
│   │   ├── ranking/         # Rankings
│   │   ├── speech/          # Speech related
│   │   └── ...
│   ├── hooks/               # Custom Hooks
│   │   ├── phrase/         # Phrase-related Hooks
│   │   ├── speech/         # Speech-related Hooks
│   │   └── ...
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── constants/          # Constant definitions
│   ├── contexts/           # React contexts
│   ├── data/               # Master data
│   ├── prompts/            # AI prompts
│   └── generated/          # Generated files
├── prisma/                 # Database schema
│   ├── schema.prisma      # Prisma schema
│   ├── seed.ts            # Seed script
│   └── migrations/        # Migrations
├── public/                # Static files
│   ├── locales/          # Internationalization files (ja/en)
│   │   ├── ja/common.json
│   │   └── en/common.json
│   ├── images/           # Image files
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service Worker
├── docs/                 # Documentation
│   ├── api/             # API documentation
│   └── ...
└── scripts/             # Utility scripts
```

## 📚 Usage

### 1. Create Account / Login

- Secure authentication using Supabase Auth
- Register and login with email address
- Google account integration

### 2. Language Settings

- Set native language and learning language
- Choose from 9 languages
- Can be changed anytime from profile screen

### 3. Phrase Generation

1. Select "AI Phrase Generation" from dashboard
2. Choose a situation (conversation with friends, cafe, business, etc.)
3. Enter the phrase you want to say
4. AI suggests translations in 3 styles (general, polite, casual)
5. Select and save your preferred phrase
6. Check audio with Google Text-to-Speech

### 4. Review with Quiz

1. Select "Quiz Mode"
2. 4-choice questions from learned phrases
3. Track accuracy rate and streak
4. Compete with other users on rankings

### 5. Speaking Practice

1. Select "Speech Practice"
2. Enter a topic you want to practice
3. AI provides correction results and speaking plan
4. Practice speaking using voice input
5. Check practice history for review
6. Manage proficiency with status (A-D)

### 6. Check Rankings

- Quiz Ranking: Compete by accuracy rate and streak
- Speaking Ranking: Compete by practice volume
- Phrase Streak Ranking: Record consecutive learning days

## 🛠️ Development Commands

### Basic Commands

```bash
# Start development server
npm run dev:local              # Local environment
npm run dev:production         # Production environment settings

# Build
npm run build:local            # Local environment
npm run build:production       # Production environment

# Lint
npm run lint
```

### Database Management

```bash
# Migrations
npm run db:migrate:local       # Local environment
npm run db:migrate:production  # Production environment

# Prisma Studio
npm run db:studio:local        # Local environment
npm run db:studio:production   # Production environment

# Run seeds
npm run db:seed:local          # Local environment
npm run db:seed:production     # Production environment
```

### Scripts

```bash
# Setup phrase levels
npm run setup:phrase-levels:local

# Update phrase levels
npm run update:phrase-levels:local

# Cleanup phrase levels
npm run cleanup:phrase-levels:local

# Setup speech statuses
npm run seed:speech-statuses:local      # Local environment
npm run seed:speech-statuses:production # Production environment

# Database diagnostics
npm run diagnose:db

# Recreate production tables
npm run recreate:tables:production

# Seed production environment
npm run seed:production:production
```

## 💾 i18n Management Tools

Python scripts are provided to check and manage translation key usage:

```bash
# Check translation key usage
python check_i18n_usage.py

# Remove unused keys
python remove_unused_i18n_keys.py
```

For details, refer to the following reports:

- `i18n_final_report.md` - i18n cleanup completion report
- `i18n_analysis_report.md` - Analysis report
- `i18n_cleanup_guide.md` - Cleanup guide

### About Speech Status Seed Values

This project defines SpeechStatus representing speech proficiency:

| Status | Description                                         |
| ------ | --------------------------------------------------- |
| A      | Can speak fluently without looking at script        |
| B      | Can speak fluently with partial reference to script |
| C      | Can speak fluently with script reference            |
| D      | Not reviewed yet                                    |

These statuses can be seeded with the following commands:

```bash
# Development environment
npm run seed:speech-statuses:local

# Production environment
npm run seed:speech-statuses:production

# All seed data (including languages, phrase levels, speech statuses)
npm run db:seed:local          # Local environment
npm run db:seed:production     # Production environment
```

### Database Models

Main database models:

- **User**: User information and authentication
- **Language**: Supported language master (9 languages)
- **PhraseLevel**: Phrase levels (Lv1-Lv7)
- **Phrase**: User phrases
- **QuizResult**: Quiz results and streaks
- **SpeakLog**: Speaking practice logs
- **Speech**: Speech practice data
- **SpeechFeedback**: AI correction feedback
- **SpeechPlan**: Speaking plans
- **SpeechStatus**: Proficiency status
- **Situation**: Situation master

For details, refer to `prisma/schema.prisma`.

## 📱 How to Access Next.js Local Environment from Smartphone on Mac

### ✅ Prerequisites

- Mac and smartphone are connected to **the same Wi-Fi network**
- Next.js development server is running

---

### 🪜 Steps

#### ① Check Mac's Local IP Address

Run the following in Terminal:

```bash
ipconfig getifaddr en0
```

> 💡 `en0` is the Wi-Fi connection interface.
> If using wired LAN, it might be `en1`.

Example output:

```
192.168.1.23
```

Note this IP address.

---

#### ② Start Next.js with External Access

Normally `npm run dev` only allows "localhost" access.
To access from smartphone, use this command:

```bash
npx next dev --hostname 0.0.0.0
```

> 💡 Specifying `--hostname 0.0.0.0` enables access
> from other devices (like smartphones) on the same network.

---

#### ③ Access from Smartphone Browser

In your smartphone browser (Safari, Chrome, etc.), enter the following URL:

```
http://<Mac IP Address>:3000
```

Example:

```
http://192.168.1.23:3000
```

Now you can view the Next.js local app from your smartphone 🎉

---

#### ④ (If needed) Check Firewall

If connection fails, open **System Settings → Network → Firewall** on Mac
and temporarily allow Next.js to communicate on port 3000.

---

### 🔍 Summary

| Step | Content                                             |
| ---- | --------------------------------------------------- |
| ①    | Check Mac IP with `ipconfig getifaddr en0`          |
| ②    | Start server with `npx next dev --hostname 0.0.0.0` |
| ③    | Access `http://<IP>:3000` from smartphone browser   |
| ④    | Allow firewall if needed                            |

---

## 🌍 Multilingual Support

Currently supported languages (9 languages):

### Major International Languages

- 🇺🇸 English
- 🇨🇳 Chinese
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇵🇹 Portuguese

### Asian Languages

- 🇯🇵 Japanese
- 🇰🇷 Korean
- 🇹🇭 Thai

### European Languages

- 🇩🇪 German

### Feature Support

- **Text-to-Speech**: All 9 languages supported by Google Cloud TTS
- **Situations**: Basic situations supported for all languages
- **UI Language**: Complete i18n support (all 9 languages)

## 📖 Documentation

Detailed documentation is included in the `docs/` directory:

### Feature Documentation

- [Phrase Generation Feature](docs/phrase-generation-README.md)
- [Subscription System](docs/subscription-system-documentation.md)
- [Technical Specifications](docs/phrase-generation-technical-spec.md)
- [Supported Languages](docs/supported-languages.md)
- [Daily Reset Logic](docs/daily-reset-logic.md)

### Component Documentation

- [Dropdown Menu](docs/dropdown-menu-component.md)
- [Mode Modal](docs/mode-modal-component.md)

### API Documentation

Refer to the `docs/api/` directory for details on each API endpoint:

- [Dashboard API](docs/api/dashboard.md)
- [Languages API](docs/api/languages.md)
- [Phrase APIs](docs/api/phrase.md)
- [Quiz APIs](docs/api/phrase-quiz.md)
- [Speaking APIs](docs/api/phrase-speak.md)
- [Speech APIs](docs/api/speech-save.md)
- [Ranking APIs](docs/api/ranking-speak.md)
- [Stripe APIs](docs/api/stripe-checkout.md)
- [User APIs](docs/api/user-settings.md)

### Setup Guides

- [Supabase Storage Setup](docs/supabase-storage-setup.md)
- [Stripe Webhook Setup](docs/stripe-webhook-setup.md)
- [API Client Guide](docs/api-client-guide.md)
- [Safari Audio Fix (FFmpeg)](docs/safari-audio-fix-ffmpeg.md)

## 🤝 Contributing

Contributions to the project are welcome!

### Development Flow

1. Fork and create a branch

```bash
git checkout -b feature/new-feature
```

2. Commit changes

```bash
git commit -am 'Add new feature'
```

3. Push to branch

```bash
git push origin feature/new-feature
```

4. Create a pull request

### Coding Standards

- Emphasize TypeScript type safety
- Follow ESLint rules
- Properly divide components
- Implement API clients with type safety

### Testing

- Test appropriately when adding features
- Create migrations when changing database
- Verify operation before production deployment

## 🚀 Deployment

### Vercel (Recommended)

1. Import project to Vercel
2. Configure environment variables
3. Automatic deployment

### Database

- Supabase (Recommended)
- PostgreSQL-compatible database

### Storage

- Supabase Storage (for audio file storage)

## 📊 Feature Details

### Subscription System

- Payment processing with Stripe
- Plan management and cancellation
- Automatic updates via webhooks

Details: [docs/subscription-system-documentation.md](docs/subscription-system-documentation.md)

### Daily Reset

- Daily speaking count limit
- Automatic reset function

Details: [docs/daily-reset-logic.md](docs/daily-reset-logic.md)

### Ranking System

- Real-time updates
- Multiple ranking types
- Streak records

## 🔒 Security

- Authentication with Supabase Auth
- Row Level Security (RLS)
- Sensitive information management with environment variables
- Stripe Webhook signature verification

## 📄 License

This project is released under the MIT License.

## 🔗 Links

- [Production Site](https://solo-speak.vercel.app)
- [GitHub](https://github.com/kohei240155/solo-speak)
- [Documentation](docs/)

## 📞 Support

If you have questions or need support, please create a GitHub Issue.

## 📝 Changelog

### Recent Feature Additions

- ✅ Speaking practice feature (speech recognition, AI correction)
- ✅ Quiz mode (4-choice questions, streak records)
- ✅ Ranking system (3 types of rankings)
- ✅ Speech practice feature (proficiency management)
- ✅ 9 language support
- ✅ Complete i18n support (Japanese and English UI)
- ✅ Daily reset feature
- ✅ Subscription system (Stripe integration)
- ✅ Google authentication integration
- ✅ PWA support

### Future Plans

- 🔄 More detailed pronunciation evaluation
- 🔄 Learning statistics dashboard
- 🔄 Social features
- 🔄 Enhanced offline support
- 🔄 Additional language support

## 🙏 Acknowledgments

This project is made possible by the following amazing technologies:

- Next.js / React - Frontend framework
- OpenAI - AI features
- Google Cloud - Text-to-speech
- Supabase - Authentication, database, and storage
- Stripe - Payment processing
- Vercel - Hosting

---

**Solo Speak** - A new language learning experience powered by AI 🚀
