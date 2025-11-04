# CODEX.md

This file provides guidance to the Codex CLI when working with code in this repository.

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

Codex is expected to run inside the container with the repository mounted at `/workspaces/accountability-app`.

## Codex CLI Setup

- Authenticate by setting `CODEX_API_KEY` in your `.env` file (the devcontainer passes this through automatically).
- Persistent Codex configuration lives in `/home/node/.codex` inside the container; the devcontainer maps this to a named volume so it survives rebuilds.
- Use this `CODEX.md` file as the default context when launching Codex so it has project guidance that mirrors `CLAUDE.md`.

### VS Code Panel

- The devcontainer installs the `OpenAI.openai` VS Code extension to provide a Codex sidebar alongside Claude.
- Set both `CODEX_API_KEY` and `OPENAI_API_KEY` in `.env` (they can share the same value) before rebuilding or reopening the devcontainer.
- After the container rebuilds, open VS Code's Activity Bar → OpenAI/Codex icon to launch the chat panel without signing in manually.

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

**Quick Start:**
1. `npx supabase start` → Get credentials with `npx supabase status -o env` → Configure `.env`
2. Make schema changes in Studio (`http://127.0.0.1:54323`)
3. Generate migration: `npx supabase db diff -f feature_name`
4. Test: `npx supabase db reset` → `npm start`
5. Create PR with migration files

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

Uses Expo Router with route groups. Common patterns:
- `router.push('/(auth)/login')` - Navigate
- `router.replace('/(app)/home')` - No back button
- `<Link href="/(auth)/signup">Sign Up</Link>` - Component

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
# Local: Use computer's network IP (NOT 127.0.0.1)
EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321  # Your computer's IP
EXPO_PUBLIC_SUPABASE_ANON_KEY=<from 'npx supabase status -o env'>
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.42

# Production
EXPO_PUBLIC_SUPABASE_URL=https://moqzugvlwzdotgnjmndd.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
```

**Key Points:**
- Use computer's network IP (e.g., `192.168.1.42`) - phone cannot access `127.0.0.1`
- Studio UI: `http://127.0.0.1:54323` (browser on computer)
- Get credentials: `npx supabase status -o env`

**Database Schema**:
- `profiles` table stores user data (full_name, avatar_url)
- Row Level Security (RLS) enabled for data protection
- Automatic profile creation on signup via trigger

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

### Deployment (CI/CD)

1. Create PR with migration files → GitHub Actions validates → Team reviews
2. Merge to main → Production deployment requires **manual approval** in GitHub UI
3. **NEVER run `npx supabase db push` manually** - only via CI/CD

**Protection:** Local testing, code review, preview branch, approval gate, full audit trail

**See:** [SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md) for detailed team workflow and [DEBUGGING.md](./DEBUGGING.md) for debugging local Supabase issues.
