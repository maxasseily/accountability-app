# Supabase Local Development Setup

This guide covers how to set up and use Supabase for local development with Docker-in-Docker.

## 🏗️ Architecture Overview

The project uses **Supabase CLI** for local development:
- **Local Database**: Runs in Docker containers via `npx supabase start`
- **Remote Database**: Production database on Supabase Cloud
- **Migrations**: Version-controlled schema changes in `supabase/migrations/`
- **CI/CD**: Automated deployments via GitHub Actions with approval gates

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
Created `.env` file with:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

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

When `npx supabase start` is running:
- **API URL**: `http://127.0.0.1:54321`
- **Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Studio UI**: `http://127.0.0.1:54323`
- **Email Testing (Mailpit)**: `http://127.0.0.1:54324`

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

```bash
# Apply all migrations from scratch (recommended for testing)
npx supabase db reset

# Or apply only new migrations
npx supabase migration up
```

### Syncing with Remote

```bash
# Pull latest schema from production (creates new migration file)
npx supabase db pull

# Note: DO NOT use `npx supabase db push` directly
# Use the GitHub Actions workflow instead (see SUPABASE_WORKFLOW.md)
```

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
