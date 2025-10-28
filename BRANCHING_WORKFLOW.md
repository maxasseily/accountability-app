# DIY Supabase Branching (Without Paid Subscription)

This document explains how we replicate Supabase's paid GitHub branching feature using **schema-based isolation** and **GitHub Actions** - completely free!

## What You Get

Instead of paying for Supabase's branching feature, you get:
- ✅ Automatic preview database per PR
- ✅ Isolated schemas (no data collision between PRs)
- ✅ Auto-migration application on PR updates
- ✅ PR comments with connection details
- ✅ Automatic cleanup when PR closes
- ✅ Seed data for testing

## Architecture

### Paid Supabase Branching
- Creates a full Supabase instance per PR
- Costs $10-$25/month per project
- Includes separate API, Auth, Storage, etc.

### Our Free Alternative
- **One shared dev/staging Supabase project** (free tier)
- **PostgreSQL schemas** isolate each PR's data (`pr_123`, `pr_456`, etc.)
- **GitHub Actions** automate everything
- **Zero cost** (uses free tier)

## Setup Instructions

### 1. Create a Dev/Staging Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project called `accountability-app-dev` (free tier)
3. Note the connection details:
   - Project URL
   - Anon/Public key
   - Database password

### 2. Add GitHub Secrets

Go to your repo **Settings → Secrets and variables → Actions** and add:

```
SUPABASE_DEV_URL=https://xxxxx.supabase.co
SUPABASE_DEV_ANON_KEY=eyJhbGc...
SUPABASE_DEV_DB_HOST=db.xxxxx.supabase.co
SUPABASE_DEV_DB_PORT=5432
SUPABASE_DEV_DB_PASSWORD=your_db_password
```

### 3. Enable Workflows

The workflows are already in `.github/workflows/`:
- `pr-preview-database.yml` - Creates/updates preview DB
- `pr-preview-cleanup.yml` - Deletes preview DB on PR close

These will run automatically on PRs that touch `supabase/migrations/` or `supabase/seed.sql`.

## How It Works

### When You Open a PR

1. **GitHub Action triggers** when PR opens/updates
2. **Schema created**: `pr_123` (based on PR number)
3. **Migrations applied** from `supabase/migrations/` to that schema
4. **Seed data loaded** (if `supabase/seed.sql` exists)
5. **PR comment posted** with connection details and instructions

### Testing Your Changes

The PR comment will include credentials. You have two options:

**Option 1: Test locally with preview DB**
```bash
# Create .env.local
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_SUPABASE_SCHEMA=pr_123

# Run app
npm start
```

**Option 2: Direct SQL access**
```bash
psql "postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres?options=-c%20search_path%3Dpr_123"
```

### When You Push New Commits

- **Workflow re-runs** automatically
- **Schema recreated** (DROP CASCADE + CREATE)
- **Fresh migrations applied**
- **PR comment updated** with latest status

### When PR Closes/Merges

- **Cleanup workflow triggers**
- **Schema deleted** (`DROP SCHEMA pr_123 CASCADE`)
- **Comment added** confirming cleanup

## Seed Data

Create `supabase/seed.sql` for test data:

```sql
-- This runs in the pr_XXX schema automatically

-- Example: Create test users
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test@example.com');

INSERT INTO profiles (id, full_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Test User');

-- Add more test data as needed
```

## Advantages Over Paid Branching

| Feature | Paid Supabase | Our Solution |
|---------|---------------|--------------|
| Cost | $10-25/month | **Free** |
| Preview per PR | ✅ Full instance | ✅ Isolated schema |
| Auto migrations | ✅ | ✅ |
| PR comments | ✅ | ✅ |
| Cleanup | ✅ | ✅ |
| Seed data | ✅ | ✅ |
| Separate Auth/Storage | ✅ | ❌ (shared) |
| Production data copy | ✅ | ❌ (security feature!) |

## Limitations

### What's Shared Across PRs
- Auth users (use test accounts)
- Storage buckets (use prefixed folders)
- Edge functions (not schema-isolated)
- Realtime subscriptions (filter by schema)

### Workarounds

**Schema-aware Supabase client:**
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const schema = process.env.EXPO_PUBLIC_SUPABASE_SCHEMA || 'public';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema }
  }
);
```

**Auth isolation:**
- Use dedicated test accounts per PR
- Or use email prefixes: `pr123+test@example.com`

**Storage isolation:**
- Prefix paths: `${schema}/avatars/user.jpg`

## Advanced: Multiple Dev Instances

If you need more isolation, create multiple free-tier dev projects:

```yaml
# Matrix strategy in workflow
strategy:
  matrix:
    env:
      - name: dev-1
        url: https://proj1.supabase.co
      - name: dev-2
        url: https://proj2.supabase.co
```

Round-robin assign PRs to instances.

## Debugging

### Check Schema Exists
```bash
psql -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'pr_%';"
```

### List Tables in Schema
```bash
psql -c "SET search_path TO pr_123; \\dt"
```

### View Workflow Logs
Go to PR → **Checks** tab → Click workflow name

## Comparison to Local Supabase

| Approach | Use Case |
|----------|----------|
| **Local Supabase** | Individual dev on their machine |
| **Shared dev + schemas** | Team preview DBs for PRs |
| **Paid branching** | Enterprise teams with budget |

Our solution bridges the gap between local-only and expensive cloud branching!

## Migration to Paid (If Needed Later)

If you eventually want paid branching:

1. Remove these workflows
2. Enable Supabase GitHub integration
3. Turn on automatic branching
4. Remove schema-related code

All your migrations and workflow stay the same!

## Questions?

- **"Why not use separate projects?"** → Free tier limits (2 projects max)
- **"Is schema isolation secure?"** → Yes, PostgreSQL schemas are fully isolated
- **"Can PRs interfere?"** → No, each has its own schema
- **"What about RLS policies?"** → They apply per-schema
- **"Performance impact?"** → Minimal, schemas are lightweight

---

**Cost savings:** $120-300/year per project! 🎉
