# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Maintenance

**IMPORTANT: When making large changes to the codebase, you MUST update both README.md and CLAUDE.md to reflect those changes.**

This includes:
- Adding new features or major functionality (e.g., new screens, systems, or workflows)
- Changing project architecture or technology stack
- Adding/removing dependencies or tools
- Modifying database schema in significant ways
- Changing development workflows or commands
- Adding new route groups or navigation patterns
- Updating the project structure (new directories, major refactoring)

**How to update:**
1. **README.md** - Focus on user-facing features and getting started guides
2. **CLAUDE.md** - Focus on technical architecture, conventions, and developer guidance
3. Keep both files in sync with the current state of the codebase
4. Update the "Project Structure" section when files/folders change
5. Update the "Current Routes" section when adding new screens

**When in doubt, update the docs!** Well-maintained documentation prevents confusion and helps onboard new developers.

## Project Overview

This is a React Native accountability app built with Expo and TypeScript. The app features a gamified system for goal tracking with credibility scores, mojo currency, group challenges, and competitive quests. The project uses a devcontainer-based development environment with Node.js 20.

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
│   ├── _layout.tsx           # Root layout with AuthProvider and GoalProvider
│   ├── index.tsx             # Entry point (redirects based on auth state)
│   ├── (auth)/               # Auth route group (login, signup, reset)
│   │   ├── _layout.tsx       # Auth layout (no header)
│   │   ├── login.tsx         # Login screen
│   │   ├── signup.tsx        # Signup screen with password strength
│   │   └── reset-password.tsx # Password reset flow
│   ├── (onboarding)/         # First-time user onboarding flow
│   │   ├── credibility-mojo-intro.tsx    # Explain credibility & mojo system
│   │   ├── quest-types-intro.tsx         # Explain quest types (Alliance, Battle, etc.)
│   │   ├── goal-selection.tsx            # Choose goal type (running)
│   │   ├── frequency-selection.tsx       # Choose frequency (3x/week)
│   │   └── goal-confirmation.tsx         # Confirm goal setup
│   └── (app)/                # Protected app route group (tab-based navigation)
│       ├── _layout.tsx       # Tab navigator with 4 tabs
│       ├── home.tsx          # Home screen with photo upload & goal progress
│       ├── feed.tsx          # Feed screen showing group & friend posts
│       ├── statistics.tsx    # Personal stats & group leaderboard
│       ├── friends/          # Friends management screens
│       │   ├── _layout.tsx   # Friends route layout
│       │   └── index.tsx     # Friends list & add friends (tab-based)
│       └── groups/           # Group management screens
│           ├── index.tsx     # Groups overview with members & arena quests
│           ├── create.tsx    # Create new group
│           ├── join.tsx      # Join existing group
│           └── chat.tsx      # Group chat screen
├── src/
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx    # Gradient button with variants
│   │   │   ├── Input.tsx     # Glassmorphic input with validation
│   │   │   └── GradientBackground.tsx # Animated gradient bg
│   │   ├── auth/
│   │   │   └── AuthCard.tsx  # Glassmorphic auth card container
│   │   ├── groups/           # Group-specific components
│   │   │   ├── GroupHeader.tsx
│   │   │   ├── MemberList.tsx
│   │   │   └── NoGroupState.tsx
│   │   ├── chat/             # Chat components
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── MessageList.tsx
│   │   ├── friends/          # Friends components
│   │   │   ├── UserProfileCard.tsx    # Reusable profile card
│   │   │   ├── AddFriendsTab.tsx      # Search & send requests
│   │   │   └── FriendsListTab.tsx     # Friends list & pending requests
│   │   ├── arena/            # Arena/quest components
│   │   │   ├── ArenaMemberList.tsx
│   │   │   ├── QuestsSection.tsx
│   │   │   └── RequestsSection.tsx
│   │   └── navigation/
│   │       └── SwipeablePages.tsx
│   ├── context/
│   │   ├── AuthContext.tsx   # Supabase auth state management
│   │   ├── GroupContext.tsx  # Group state management
│   │   └── GoalContext.tsx   # Goal state & weekly progress tracking
│   ├── lib/
│   │   ├── supabase.ts       # Database connection
│   │   ├── goals.ts          # Goal database operations
│   │   ├── groups.ts         # Group database operations
│   │   └── statistics.ts     # Statistics queries
│   ├── types/
│   │   ├── groups.ts         # TypeScript types for groups
│   │   ├── goals.ts          # TypeScript types for goals
│   │   ├── statistics.ts     # TypeScript types for statistics
│   │   ├── friends.ts        # TypeScript types for friends
│   │   └── arena.ts          # TypeScript types for quests
│   └── utils/
│       ├── colors.ts         # Futuristic theme colors
│       ├── spacing.ts        # Spacing constants
│       ├── validation.ts     # Form validation helpers
│       ├── dailyPhoto.ts     # Photo upload/fetch logic
│       ├── feed.ts           # Feed posts (group & friends) + week logic
│       ├── friends.ts        # Friend operations (search, add, accept, remove)
│       ├── groups.ts         # Group creation/join logic
│       └── arenaQuests.ts    # Quest logic
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
- **Supabase** for authentication, database, storage, and real-time features
- **expo-linear-gradient** for gradient backgrounds
- **expo-blur** for glassmorphism effects
- **expo-image-picker** for camera and photo library access
- **React Native SVG** for charts and visualizations

## Design System

The app uses a futuristic dark theme with:
- **Colors**: Deep blue/purple gradients, cyan accents, frosted glass
- **Components**: Glassmorphic cards, gradient buttons, animated inputs
- **Typography**: Bold headings with glow effects, clean body text
- All theme constants defined in `src/utils/colors.ts`

## Routing Convention

This project uses **Expo Router** for file-based routing with **route groups**.

### Current Routes

**Authentication:**
- `/` - Entry point, redirects to login or onboarding/home based on auth state
- `/(auth)/login` - Login screen
- `/(auth)/signup` - Signup screen with password strength indicator
- `/(auth)/reset-password` - Password reset flow

**Onboarding (first-time users):**
- `/(onboarding)/credibility-mojo-intro` - Explain credibility and mojo concepts
- `/(onboarding)/quest-types-intro` - Explain quest types (Alliance, Battle, Prophecy, Curse)
- `/(onboarding)/goal-selection` - Choose goal type (currently only running)
- `/(onboarding)/frequency-selection` - Choose frequency (currently only 3x/week)
- `/(onboarding)/goal-confirmation` - Confirm and finalize goal setup

**Protected App (tab-based navigation with 4 tabs):**
- `/(app)/home` - Home screen with daily photo upload and goal progress tracking
- `/(app)/feed` - Feed screen showing group members' and friends' posts for the current week (Monday-based)
- `/(app)/friends/` - Friends management screens
  - `index` - Friends list and add friends (tab-based: Friends List / Add Friends)
- `/(app)/groups/` - Group management screens with arena quest functionality
  - `index` - View group members, their photos, and arena quests (alliance, battle, prophecy, curse, speculation)
  - `create` - Create new group with 6-digit join code
  - `join` - Join existing group
  - `chat` - Group chat with real-time messaging
- `/(app)/statistics` - Personal stats dashboard and group leaderboard (includes friend count)

### Route Groups

Route groups use parentheses `(name)` to organize routes without affecting URL structure:
- `(auth)` - Authentication screens (headerless)
- `(onboarding)` - First-time user onboarding flow (headerless)
- `(app)` - Protected app screens with tab navigation (requires authentication)

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

**User Data:**
- `profiles` - User profile information (username, email, avatar_url, displayed_badge_id)
- `user_statistics` - Credibility score (0-100), mojo (currency), lifetime goals logged, user_rank
- `user_goals` - Weekly running goals with progress tracking (current_progress, week_start_date, completion_dates)
- `daily_photos` - Daily photo uploads (user_id, date, photo_url, uploaded_at)

**Social Features:**
- `friendships` - Bidirectional friend relationships using LEAST/GREATEST pattern
  - Status: pending, accepted, blocked
  - Includes requester_id to track who sent request
  - RLS policies allow both users to view relationship
  - Friends can view each other's profiles, statistics, and daily photos
- `groups` - Group metadata (name, join_code, created_by)
- `group_members` - User-group membership relationships
- `group_chat_messages` - Real-time group chat messages

**Gamification:**
- `arena_quests` - Quest interactions between group members (Alliance, Battle, Prophecy, Curse, Speculation)
  - Constraints prevent duplicate pending quests of same type between users
- `badges` - Achievement badges users can earn and display

**Key Features:**
- Row Level Security (RLS) enabled on all tables for data protection
- Automatic profile creation on signup via database trigger
- Database function `log_goal_completion()` atomically updates goals and statistics
- Unique constraints prevent duplicate daily photos and quest requests

**Storage Buckets:**
- `daily-photos` - Public bucket for daily photo uploads (5MB limit, JPEG/PNG/WebP MIME types)
- Created via migration: `20251028234147_add_daily_photos_storage_bucket.sql`
- Uses `INSERT INTO storage.buckets` with conflict handling

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
