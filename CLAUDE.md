# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native accountability app built with Expo and TypeScript. The project uses a devcontainer-based development environment with Node.js 18.

## Development Environment

The project is configured to run in a devcontainer with:
- Node.js 20 (Debian Bookworm base)
- Watchman for file watching
- Metro Bundler on port 8081
- Docker-in-Docker for local Supabase
- Supabase CLI with local development stack
- Graphite CLI for stacked PRs
- SSH key mounting for git operations

## Commands

### App Development
- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device (requires macOS)
- `npm run web` - Run in web browser

### Supabase Local Development
- `npx supabase start` - Start local Supabase stack (Postgres, Auth, Storage, Studio)
- `npx supabase stop` - Stop local Supabase
- `npx supabase status` - Check running services and URLs
- `npx supabase migration new <name>` - Create new migration file
- `npx supabase db reset` - Reset local DB and apply all migrations
- `npx supabase db diff -f <name>` - Generate migration from Studio UI changes
- `npx supabase db pull` - Pull latest schema from remote (creates migration)

## Project Structure

```
accountability-app/
├── app/                      # File-based routing (Expo Router)
│   ├── _layout.tsx           # Root layout with AuthProvider
│   ├── index.tsx             # Entry point (redirects based on auth state)
│   ├── (auth)/               # Auth route group (login, signup, reset)
│   │   ├── _layout.tsx       # Auth layout (no header)
│   │   ├── login.tsx         # Login screen
│   │   ├── signup.tsx        # Signup screen with password strength
│   │   └── reset-password.tsx # Password reset flow
│   └── (app)/                # Protected app route group
│       ├── _layout.tsx       # App layout
│       └── home.tsx          # Main home screen
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx    # Gradient button with variants
│   │   │   ├── Input.tsx     # Glassmorphic input with validation
│   │   │   └── GradientBackground.tsx # Animated gradient bg
│   │   └── auth/
│   │       └── AuthCard.tsx  # Glassmorphic auth card container
│   ├── context/
│   │   └── AuthContext.tsx   # Mock auth state management
│   └── utils/
│       ├── colors.ts         # Futuristic theme colors
│       └── validation.ts     # Form validation helpers
├── assets/                   # App icons, splash screens, fonts, images
├── supabase/                 # Supabase local development
│   ├── migrations/           # Database schema migrations (version controlled)
│   ├── config.toml           # Local Supabase configuration
│   └── seed.sql              # Test data for local development
├── .github/
│   └── workflows/            # CI/CD pipelines
│       ├── deploy-db-production.yml  # Production DB deployment (requires approval)
│       └── deploy-db-dev.yml         # PR validation for migrations
├── app.json                  # Expo configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Architecture

- **Expo SDK ~54.0** with new architecture enabled
- **Expo Router v6** for file-based navigation with route groups
- **React 19.1** with React Native 0.81
- **TypeScript 5.9** with strict mode enabled
- **expo-linear-gradient** for gradient backgrounds
- **expo-blur** for glassmorphism effects
- Mock authentication (no backend integration yet)

## Design System

The app uses a futuristic dark theme with:
- **Colors**: Deep blue/purple gradients, cyan accents, frosted glass
- **Components**: Glassmorphic cards, gradient buttons, animated inputs
- **Typography**: Bold headings with glow effects, clean body text
- All theme constants defined in `src/utils/colors.ts`

## Routing Convention

This project uses **Expo Router** for file-based routing with **route groups**.

### Current Routes

- `/` - Entry point, redirects to login or home based on auth state
- `/(auth)/login` - Login screen
- `/(auth)/signup` - Signup screen with password strength indicator
- `/(auth)/reset-password` - Password reset flow
- `/(app)/home` - Protected home screen (requires authentication)

### Route Groups

Route groups use parentheses `(name)` to organize routes without affecting URL structure:
- `(auth)` - Authentication screens (headerless)
- `(app)` - Protected app screens (with header)

### Navigation

```tsx
import { Link, router } from 'expo-router';

// Navigate to login
router.push('/(auth)/login');

// Replace navigation (no back)
router.replace('/(app)/home');

// Go back
router.back();

// Using Link component
<Link href="/(auth)/signup">Sign Up</Link>
```

## Authentication Flow

The app uses **Supabase** for real backend authentication:

1. **AuthContext** (`src/context/AuthContext.tsx`) manages auth state with Supabase
2. **Supabase client** (`src/lib/supabase.ts`) configured with secure token storage
3. **Entry point** (`app/index.tsx`) redirects based on `user` state
4. **Protected routes** in `(app)` group require authentication
5. **Form validation** uses utilities in `src/utils/validation.ts`

### Supabase Setup

**Environment Variables** (`.env`):
```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Database Schema**:
- `profiles` table stores user data (full_name, avatar_url)
- Row Level Security (RLS) enabled for data protection
- Automatic profile creation on signup via trigger

**Features**:
- Email/password authentication
- Secure session storage with `expo-secure-store`
- Auto profile creation on signup
- Password reset via email
- Session persistence across app restarts

**Development**: Email confirmation disabled in Supabase Auth settings
**Production**: Enable email confirmation and configure SMTP

## Database Migration Workflow

The project uses a **CI/CD pipeline with approval gates** for database changes:

### Local Development
1. Start local Supabase: `npx supabase start`
2. Make schema changes in Studio UI (`http://127.0.0.1:54323`)
3. Generate migration: `npx supabase db diff -f feature_name`
4. Test locally: `npx supabase db reset`

### Deployment Process
1. **Create PR** with migration files in `supabase/migrations/`
2. **Auto-validation** runs via GitHub Actions
3. **Team reviews** PR with migration checklist
4. **Merge to main** triggers deployment workflow
5. **Manual approval required** from designated approver
6. **Auto-deploys** to production after approval

### Key Points
- **Never run `npx supabase db push` directly** - use CI/CD workflow
- All migrations are version controlled in `supabase/migrations/`
- Migrations tested locally before PR
- Production requires approval from tech lead/senior dev
- Full audit trail via GitHub Actions

**See:** [SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md) for detailed team workflow

## Editor Configuration

- Format on save is enabled
- TypeScript strict mode enabled
- VS Code extensions: React Native, ESLint, TypeScript, Spell Checker, Claude Code, Graphite
