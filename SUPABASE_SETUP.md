# Supabase Local Development Setup

This guide covers how to set up and use Supabase for local development with Docker-in-Docker and Expo.

## 🏗️ Architecture Overview

The project uses **local-first development** with Supabase CLI:
- **Local Database**: Primary development environment, runs in Docker containers via `npx supabase start`
- **Remote Database**: Production database on Supabase Cloud (deployed via CI/CD)
- **Migrations**: Version-controlled schema changes in `supabase/migrations/`
- **CI/CD**: Automated deployments via GitHub Actions with approval gates
- **Expo Integration**: Seamless connection between React Native app and local Supabase

### Why Local-First?
- ✅ **Fast iteration**: No network latency, instant feedback
- ✅ **Offline development**: Work without internet connection
- ✅ **Safe experimentation**: Changes don't affect production
- ✅ **Cost-effective**: No API usage charges during development
- ✅ **Consistent environment**: Same setup across all developers

## ✅ Initial Setup (One-Time)

### 1. Database Schema (Already Configured)

The database schema is managed via migration files in `supabase/migrations/`. Current schema includes:

```sql
-- Enable Row Level Security
alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 2. Environment Configuration

For local development with Expo, configure your `.env` file to use **local Supabase**:

**Get your local credentials:**
```bash
# Start local Supabase first
npx supabase start

# Get local environment variables
npx supabase status -o env
```

This outputs environment variables you need:
```bash
SUPABASE_API_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Configure your `.env` file:**
```bash
# For Expo (EXPO_PUBLIC_ prefix required)
# IMPORTANT: Use your computer's IP address for BOTH variables
EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321  # Replace with YOUR computer's IP
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Your local computer's IP (for phone testing with Metro)
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.42  # Same IP as above
```

**Port Forwarding (Automatic):**
The devcontainer automatically forwards these ports from the container to your host machine:
- `8081` - Metro Bundler (Expo dev server)
- `54321` - Supabase API URL (forwarded to computer's network interface)
- `54322` - PostgreSQL Database (direct DB access)
- `54323` - Supabase Studio (web UI)
- `54324` - Mailpit (email testing)

**How Port Forwarding Works:**
- Inside the devcontainer, Supabase runs on `127.0.0.1:54321` (localhost inside container)
- The devcontainer forwards this to `0.0.0.0:54321` on your host machine (accessible from network)
- Your phone can reach Supabase at your computer's IP: `http://192.168.1.42:54321`
- Your phone connects to Metro Bundler at: `http://192.168.1.42:8081`

> **Important:**
> - **Both URLs need your computer's IP address**: `192.168.1.42` (not `127.0.0.1`)
> - Your phone cannot access `127.0.0.1` - that's localhost on the phone itself
> - Port forwarding makes `54321` accessible on your computer's network interface
> - Use the **same IP address** for both `EXPO_PUBLIC_SUPABASE_URL` and `REACT_NATIVE_PACKAGER_HOSTNAME`

### 3. Auth Settings
In Supabase Dashboard → Authentication → Settings:
- **Confirm email**: Disabled (for development)
- **Enable email confirmations**: OFF

## 🧪 Testing Authentication

### Test Signup
1. Run `npm start` (or `npx expo start --tunnel` for phone)
2. Open app, click "Sign Up"
3. Enter:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
4. Should redirect to home screen

### Test Login
1. Logout from home screen
2. Enter same credentials
3. Should redirect to home screen

### Test Password Reset
1. Click "Forgot Password?" on login
2. Enter email address
3. Check Supabase dashboard → Authentication → Users for reset email

## 🔍 Verify in Supabase

After signup, check:
1. **Authentication → Users**: New user should appear
2. **Table Editor → profiles**: Profile row should be created automatically

## 🚀 Local Development Workflow

### Starting Local Supabase

```bash
# Start all Supabase services (Postgres, Auth, Storage, Studio, etc.)
npx supabase start

# Check status
npx supabase status

# Access local Studio UI
open http://127.0.0.1:54323

# Stop when done
npx supabase stop
```

### Local Database URLs

**For your browser on your computer (localhost works here):**
- **API URL**: `http://127.0.0.1:54321` (browser access only)
- **Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio UI**: `http://127.0.0.1:54323` (open in browser on your computer)
- **Email Testing (Mailpit)**: `http://127.0.0.1:54324`

**For your phone (Expo app running on physical device):**
- **API URL**: `http://192.168.1.42:54321` (use your computer's IP in `.env`)
- **Metro Bundler**: `http://192.168.1.42:8081`

**Why you need different URLs:**
- **On your computer**: `127.0.0.1` (localhost) works for browser and development tools
- **On your phone**: `127.0.0.1` refers to the phone itself, not your computer
- **Port forwarding**: Makes `54321` accessible on your computer's network interface (`0.0.0.0:54321`)
- **Your phone**: Must use your computer's IP address to reach the forwarded ports

## 🔄 Working with Migrations

### Creating New Migrations

```bash
# Option 1: Create empty migration file
npx supabase migration new add_feature_name

# Option 2: Make changes in Studio UI, then generate diff
# 1. Open Studio: http://127.0.0.1:54323
# 2. Make your schema changes
# 3. Generate migration:
npx supabase db diff -f add_feature_name
```

### Testing Migrations Locally

#### `npx supabase db reset` (Safe - Use Frequently!)

**What it does:**
- Drops entire local database
- Re-applies ALL migrations from scratch
- Re-runs seed data (if configured)
- Gives you a clean, consistent state

**When to use:**
- ✅ Before creating a PR (verify migrations work from clean state)
- ✅ After pulling new migrations from `main`
- ✅ When switching between feature branches
- ✅ When your local DB gets into a weird state
- ✅ To test that migrations are idempotent and complete

```bash
# Reset local DB and apply all migrations
npx supabase db reset

# Watch the output for any migration errors
# Each migration file should apply successfully
```

**Example workflow:**
```bash
# 1. Pull latest changes
git pull origin main

# 2. Reset local DB to match latest migrations
npx supabase db reset

# 3. Start developing
# Make changes in Studio UI...

# 4. Generate migration
npx supabase db diff -f my_new_feature

# 5. Test migration from clean state
npx supabase db reset

# 6. If reset succeeds, your migration is good!
# Create PR with your migration file
```

### Syncing with Remote

```bash
# Pull latest schema from production (creates new migration file)
npx supabase db pull
```

### ⚠️ NEVER Run `npx supabase db push` Manually

#### `npx supabase db push` (Dangerous - Only via CI/CD!)

**What it does:**
- Pushes local migrations directly to remote database
- Bypasses all review and approval processes
- Can break production immediately
- No audit trail or rollback mechanism

**When GitHub Actions uses it:**
- ✅ Only after PR is merged to `main`
- ✅ Only after manual approval from tech lead
- ✅ With full audit trail in GitHub Actions logs
- ✅ With automatic notifications and monitoring

**Why you should NEVER run it manually:**
- ❌ Bypasses code review
- ❌ No approval gate
- ❌ Could break production instantly
- ❌ Hard to rollback
- ❌ No visibility to team

**If you accidentally run it:**
1. Immediately notify team in Slack/Discord
2. Check production database for issues
3. Prepare rollback migration if needed
4. Document what happened

**The right way:** Use the GitHub Actions workflow (see [SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md))

## 🐳 Docker-in-Docker Configuration

The devcontainer is configured with:
- **Docker-in-Docker feature**: Allows running Docker commands inside the container
- **Volume mounts**:
  - `supabase-config-${devcontainerId}` → Persists Supabase CLI configuration
  - Docker socket access for container management
- **Ports forwarded**: 54321 (API), 54322 (DB), 54323 (Studio), 54324 (Email)

### Troubleshooting Docker

```bash
# Check Docker is running
docker ps

# Rebuild devcontainer if issues
# Cmd/Ctrl + Shift + P → "Dev Containers: Rebuild Container"
```

## 📁 File Structure

```
supabase/
├── .gitignore              # Ignores .branches, .temp, env files
├── config.toml             # Local Supabase configuration
├── migrations/             # Version-controlled schema changes
│   ├── 20251011180516_remote_commit.sql
│   └── 20251011183113_remote_schema.sql
└── seed.sql               # Test data for local development
```

### What's Committed to Git

✅ **Committed:**
- `supabase/config.toml`
- `supabase/migrations/*.sql`
- `supabase/seed.sql`
- `supabase/.gitignore`

❌ **Ignored:**
- `supabase/.branches/` (Git branch tracking)
- `supabase/.temp/` (Temporary files)
- `.env` (Contains secrets)

## 🔐 Authentication & Tokens

### Environment Variables

```bash
# In .env file (never commit this!)
SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# Used by Supabase CLI for:
# - npx supabase db pull
# - npx supabase link
# - Other remote operations
```

### Getting Your Access Token

1. Visit: https://supabase.com/dashboard/account/tokens
2. Create new token or copy existing
3. Add to `.env` file
4. Token persists across container rebuilds (stored in Docker volume)

## 🚀 Production Checklist

Before deploying:
- [ ] All migrations tested locally with `npx supabase db reset`
- [ ] RLS policies verified
- [ ] Indexes added for performance
- [ ] No destructive operations without data migration path
- [ ] PR reviewed and approved
- [ ] Production environment approver notified

## 📚 Related Documentation

- **[SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md)** - Team workflow and CI/CD pipeline
- **[README.md](./README.md)** - Simple explanation for non-technical users
- **[CLAUDE.md](./CLAUDE.md)** - Complete technical architecture

## 🆘 Common Issues

### "Access token not provided"
**Solution:** Add `SUPABASE_ACCESS_TOKEN` to your `.env` file

### "Migration history doesn't match"
**Solution:**
```bash
npx supabase migration repair --status applied <migration_id>
```

### "Docker not available"
**Solution:** Rebuild the devcontainer (Cmd/Ctrl + Shift + P → "Rebuild Container")

### Services won't start
**Solution:**
```bash
npx supabase stop
npx supabase start
```
