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

### Supabase Local Development (Primary Workflow)

**Essential Commands:**
- `npx supabase start` - Start local Supabase stack (Postgres, Auth, Storage, Studio)
- `npx supabase stop` - Stop local Supabase
- `npx supabase status` - Check running services and URLs
- `npx supabase status -o env` - Output environment variables for `.env` file
- `npx supabase db reset` - **SAFE**: Reset local DB and re-apply all migrations (use frequently!)
- `npx supabase migration new <name>` - Create new migration file
- `npx supabase db diff -f <name>` - Generate migration from Studio UI changes
- `npx supabase db pull` - Pull latest schema from remote (creates migration)
- `npx supabase db push` - **DANGEROUS**: Push to production (NEVER run manually, use CI/CD!)

**Command Safety Guide:**

| Command | Safety | Description | When to Use |
|---------|--------|-------------|-------------|
| `npx supabase db reset` | ✅ Safe | Drops local DB, re-applies migrations | Before PRs, after pulling code, daily |
| `npx supabase db push` | ❌ Dangerous | Pushes to production | NEVER manually - only via GitHub Actions |

**Local Development Workflow:**
```bash
# 1. Start local Supabase
npx supabase start

# 2. Get credentials for .env
npx supabase status -o env

# 3. Configure .env with your computer's IP
# EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321 (YOUR computer's IP)

# 4. Make schema changes in Studio
# Open http://127.0.0.1:54323 in browser on your computer

# 5. Generate migration
npx supabase db diff -f my_feature

# 6. Test migration from clean state
npx supabase db reset

# 7. Test in Expo app
npm start
# Phone connects to http://192.168.1.42:54321 (your computer's IP)

# 8. Create PR with migration files
```

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

**Local-First Development:**
The project uses local Supabase as the primary development environment. Developers connect to `http://127.0.0.1:54321` instead of production.

**Environment Variables** (`.env`):
```bash
# For local development (default)
# IMPORTANT: Use your computer's IP address (not 127.0.0.1)
EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321  # Your computer's IP
EXPO_PUBLIC_SUPABASE_ANON_KEY=<get from 'npx supabase status -o env'>
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.42  # Same IP as above

# For preview branches (testing PR changes)
EXPO_PUBLIC_SUPABASE_URL=https://xxx-preview-xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<preview-anon-key>

# For production (rarely used by developers)
EXPO_PUBLIC_SUPABASE_URL=https://moqzugvlwzdotgnjmndd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
```

**Getting Local Credentials:**
```bash
npx supabase start
npx supabase status -o env
# Copy SUPABASE_ANON_KEY
# For SUPABASE_API_URL: Use your computer's IP (e.g., http://192.168.1.42:54321)
# NOT http://127.0.0.1:54321 - your phone can't access that
# Add EXPO_PUBLIC_ prefix in .env file
```

**Port Forwarding (Automatic):**
Devcontainer forwards these ports from container to host machine's network interface:
- `8081` - Metro Bundler (Expo)
- `54321` - Supabase API (accessible at computer's IP: `192.168.1.42:54321`)
- `54322` - PostgreSQL (direct DB access)
- `54323` - Supabase Studio UI (open in browser: `http://127.0.0.1:54323`)
- `54324` - Mailpit (email testing)

**How Port Forwarding Works:**
- Supabase runs inside devcontainer at `127.0.0.1:54321`
- Devcontainer forwards to host machine's `0.0.0.0:54321` (accessible from network)
- Your phone accesses Supabase at your computer's IP: `http://192.168.1.42:54321`
- Your browser can use `http://127.0.0.1:54323` for Studio UI (localhost on computer)

**IP Address Usage:**
- **Supabase URL (for phone)**: Use computer's network IP `http://192.168.1.42:54321` (NOT `127.0.0.1`)
- **Metro Bundler (for phone)**: Use same computer IP in `REACT_NATIVE_PACKAGER_HOSTNAME` (e.g., `192.168.1.42`)
- **Studio UI (for browser on computer)**: Can use `http://127.0.0.1:54323` (localhost works in browser)
- **Key point**: Your phone cannot access `127.0.0.1` - that's localhost on the phone itself

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

**Development**: Email confirmation disabled in local Supabase
**Production**: Enable email confirmation and configure SMTP

## Database Migration Workflow

The project uses **local-first development with CI/CD pipeline and approval gates**:

### Local Development (Primary Workflow)
1. **Start local Supabase**: `npx supabase start`
2. **Get credentials**: `npx supabase status -o env` → Add to `.env` with `EXPO_PUBLIC_` prefix
3. **Make schema changes** in Studio UI (`http://127.0.0.1:54323`)
4. **Generate migration**: `npx supabase db diff -f feature_name`
5. **Test locally**: `npx supabase db reset` (resets DB and re-applies ALL migrations)
6. **Verify in app**: `npm start` → Test features with local Supabase

### Understanding Key Commands

#### `npx supabase db reset` (Safe - Use Daily!)
- **What**: Drops local DB, re-applies all migrations from scratch
- **Scope**: Local only (cannot affect production)
- **When**: Before PRs, after pulling code, when testing migrations, when DB is in bad state
- **Why**: Ensures migrations work from clean state, catches missing migrations

#### `npx supabase db push` (Dangerous - Never Manual!)
- **What**: Pushes migrations to remote (production) database
- **Scope**: Affects all users immediately
- **When**: ONLY via GitHub Actions with approval
- **Why dangerous**: Bypasses review, no rollback, breaks production instantly

### Deployment Process (GitHub Actions)

1. **Create PR** with migration files in `supabase/migrations/`
2. **GitHub Actions validates** migration syntax (`.github/workflows/deploy-db-dev.yml`)
3. **Supabase creates preview branch** automatically for cloud testing
4. **Team reviews** PR with migration checklist
5. **Merge to main** triggers production deployment workflow
6. **GitHub Actions pauses** and waits for manual approval (`.github/workflows/deploy-db-production.yml`)
7. **Tech lead approves** in GitHub UI
8. **`npx supabase db push` runs** automatically via GitHub Actions
9. **Full audit trail** logged in GitHub Actions

### Protection Layers
1. **Local testing**: `npx supabase db reset` validates migrations
2. **Code review**: PR approval required
3. **Preview branch**: Test in cloud before production
4. **GitHub Actions validation**: Syntax checking
5. **Manual approval gate**: Tech lead approval required
6. **Audit trail**: All deployments logged

### Key Points
- **Always use local Supabase** for development (`http://127.0.0.1:54321`)
- **Run `npx supabase db reset` frequently** to test migrations
- **NEVER run `npx supabase db push` manually** - use CI/CD workflow
- All migrations are version controlled in `supabase/migrations/`
- Production requires approval from tech lead/senior dev
- Full audit trail via GitHub Actions

**See:** [SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md) for detailed team workflow

## Editor Configuration

- Format on save is enabled
- TypeScript strict mode enabled
- VS Code extensions: React Native, ESLint, TypeScript, Spell Checker, Claude Code, Graphite
