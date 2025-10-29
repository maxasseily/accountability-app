# Supabase Database Migration Workflow

This document outlines the team workflow for managing database schema changes with Supabase.

## 🔄 Workflow Overview

```
Local Dev → PR with Preview Branch → PR Review → Merge to Main → Manual Approval → Production Deploy
```

**With Supabase GitHub Integration:**
- Each PR automatically gets a **preview database** (Supabase Preview Branch)
- Test migrations in cloud environment before production
- Team can review changes with real preview URLs

## ✨ Benefits of Preview Branches

### Before (Local Only)
- ❌ Only tested locally, different from production
- ❌ Reviewers can't easily test changes
- ❌ Hidden issues with production data/scale
- ❌ Manual environment setup required

### After (With Preview Branches)
- ✅ Test in real cloud environment (same as production)
- ✅ Reviewers get instant access via URL
- ✅ Catch production-specific issues early
- ✅ Zero setup - automatic for every PR
- ✅ Safe isolation - no risk to production
- ✅ Automatic cleanup - no manual maintenance

## 👥 Team Workflow

### 1. **Local Development** (Primary Workflow)

The project uses **local-first development** - all development happens against a local Supabase instance running in Docker.

#### Initial Setup

```bash
# Start local Supabase (first time or after container restart)
npx supabase start

# Get local credentials for your .env file
npx supabase status -o env
```

**Configure your `.env` for local development:**
```bash
# Get anon key from `npx supabase status -o env`
# IMPORTANT: Use your computer's IP address for both URLs (not 127.0.0.1)
EXPO_PUBLIC_SUPABASE_URL=http://192.168.1.42:54321  # Your computer's IP
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.42  # Same IP as above
```

**Understanding the URLs:**
- **`EXPO_PUBLIC_SUPABASE_URL`**: Use your computer's IP (e.g., `http://192.168.1.42:54321`)
  - Your phone cannot access `127.0.0.1` - that's localhost on the phone
  - Port forwarding makes Supabase accessible at your computer's IP
- **`REACT_NATIVE_PACKAGER_HOSTNAME`**: Use the same computer IP so your phone can connect to Metro
- **Use the same IP address for both settings**

#### Development Workflow

```bash
# 1. Start local Supabase
npx supabase start

# 2. Create a new migration
npx supabase migration new add_your_feature

# 3. Edit the migration file in supabase/migrations/
# OR use Studio UI at http://127.0.0.1:54323

# 4. Generate diff of changes made in Studio
npx supabase db diff -f add_your_feature

# 5. Test locally (applies all migrations from scratch)
npx supabase db reset

# 6. Verify in local Studio (open in browser on your computer)
open http://127.0.0.1:54323

# 7. Test in your Expo app on phone
npm start  # App on phone connects to http://192.168.1.42:54321 (your computer's IP)
```

**Key Commands:**

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `npx supabase start` | Starts local Supabase stack | Start of dev session |
| `npx supabase status` | Shows running services & URLs | Check if Supabase is running |
| `npx supabase status -o env` | Outputs env variables | Get local credentials |
| `npx supabase db reset` | Resets DB, applies all migrations | Test migrations, fix bad state |
| `npx supabase db diff -f name` | Creates migration from Studio changes | After making UI changes |
| `npx supabase stop` | Stops local Supabase | End of dev session |

**⚠️ NEVER run `npx supabase db push` manually** - it pushes directly to production!

**⚠️ Storage Buckets Required for Testing:**

If your feature uses Supabase Storage (e.g., photo uploads), you must manually create storage buckets in local Studio:

1. Open Studio: `http://127.0.0.1:54323`
2. Navigate to **Storage** → **New bucket**
3. Create buckets matching production (e.g., `daily-photos`)
4. Configure:
   - **Public bucket**: Enable if using `getPublicUrl()`
   - **File size limit**: Match production settings
   - **Allowed MIME types**: Restrict to expected types (e.g., `image/*`)

**Note:** Storage buckets are NOT created by migrations and must be set up manually in each environment (local, staging, production). Consider documenting required buckets in your README or creating a setup script.

### 2. **Create Pull Request**

```bash
# Commit your migration
git add supabase/migrations/
git commit -m "feat: add comments table with RLS policies"

# Push to your branch
git push origin feature/add-comments

# Create PR on GitHub
```

**What happens automatically:**
- ✅ **GitHub Actions validates migration syntax** (`.github/workflows/deploy-db-dev.yml`)
  - Checks migration files are valid SQL
  - Ensures no syntax errors
  - Verifies migrations can be parsed
- ✅ Bot comments on PR with review checklist
- ✅ Shows migration diff for review
- 🌿 **Supabase creates a preview branch** automatically (via GitHub integration)
- 🔗 Preview database URL posted in PR comments
- 📊 Migrations auto-applied to preview branch

**GitHub Actions Validation Workflow:**
```yaml
# Runs on: Pull request creation/update
# Purpose: Validate migration files before review
# Actions:
1. Checks out code
2. Sets up Supabase CLI
3. Validates migration syntax
4. Reports errors in PR if validation fails
```

**Preview Branch Benefits:**
- Test your changes in a real cloud environment
- Share preview URLs with reviewers
- Verify migrations work before production
- Automatic cleanup when PR is closed

### 3. **PR Review Checklist**

Reviewers should verify:

- [ ] **Backwards Compatible**: Won't break existing app versions
- [ ] **No Data Loss**: No `DROP TABLE` or `DROP COLUMN` without migration path
- [ ] **RLS Policies**: Row Level Security configured correctly
- [ ] **Indexes Added**: For columns used in WHERE/JOIN clauses
- [ ] **Tested Locally**: Author ran `npx supabase db reset` successfully
- [ ] **Tested in Preview Branch**: Verified changes work in Supabase preview environment
- [ ] **Migration File Name**: Descriptive and follows convention

**Testing with Preview Branch:**
1. Find the preview URL in PR comments (Supabase bot posts it)
2. Update your local `.env` temporarily to point to preview:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=<preview-url>
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<preview-anon-key>
   ```
3. Test app functionality with preview database
4. Restore `.env` to local/production settings after testing

### 4. **Merge to Main**

After PR approval:
```bash
# Merge PR (via GitHub UI or command line)
git checkout main
git merge feature/add-comments
git push origin main
```

**What happens automatically:**
- 🌿 Preview branch is **automatically deleted** by Supabase
- 🚀 **GitHub Actions production deployment workflow triggered** (`.github/workflows/deploy-db-production.yml`)
- ⏸️ **Workflow pauses and waits for manual approval** (see step 5)

**GitHub Actions Production Workflow:**
```yaml
# Runs on: Push to main branch (after PR merge)
# Triggers when: supabase/migrations/ directory has changes
# Steps:
1. Checks out code
2. Sets up Supabase CLI with production credentials
3. PAUSES for manual approval (requires 'production' environment approval)
4. After approval: Runs `npx supabase db push`
5. Reports success/failure
6. Sends notifications (if configured)
```

### 5. **Production Deployment (Requires Approval)**

**GitHub will pause and require manual approval.**

**Approvers must:**
1. Go to GitHub Actions → "Deploy Database to Production" workflow
2. Review the migration changes
3. Click **"Review deployments"**
4. Select **"production"** environment
5. Click **"Approve and deploy"**

**What happens after approval:**
- 📤 **`npx supabase db push` runs automatically via GitHub Actions**
  - Authenticates with production using `SUPABASE_ACCESS_TOKEN` secret
  - Applies pending migrations to production database
  - Each migration runs in order (by timestamp)
  - If any migration fails, the workflow fails and production is unchanged
- ✅ Migrations applied to production database
- 🔗 Changes live at `https://moqzugvlwzdotgnjmndd.supabase.co`
- 📝 Full audit trail in GitHub Actions logs
- 👥 Team notified of deployment

**This is the ONLY safe way to run `npx supabase db push` - never run it manually!**

## 🛠️ Setup Required (One-time)

### 1. Configure Supabase GitHub Integration

**Enable Preview Branches:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Navigate to **Settings → Integrations**
3. Find **GitHub** integration and click **Configure**
4. Connect your GitHub repository
5. Enable **"Branching & Preview Databases"**
6. Configure:
   - ✅ **Auto-create preview branches** for PRs
   - ✅ **Auto-delete preview branches** when PRs close/merge
   - ✅ **Apply migrations automatically** to preview branches

**What you get:**
- Automatic preview database for each PR
- Isolated testing environment per feature branch
- Preview URLs posted as PR comments
- Zero manual setup for reviewers

### 2. Configure GitHub Secrets

Add to repository secrets (Settings → Secrets and variables → Actions):

```
SUPABASE_ACCESS_TOKEN = sbp_1e75730a0c5154a58e8ee1ce471b250dfb41eaf3
```

**Note:** This token is used for production deployments via GitHub Actions. Preview branches use the GitHub integration and don't require this token.

### 3. Configure Production Environment

**In GitHub repository settings:**
1. Go to **Settings → Environments**
2. Create environment named **`production`**
3. Enable **"Required reviewers"**
4. Add team members who can approve (e.g., tech lead, senior devs)
5. Optional: Add wait timer (e.g., 5 minutes minimum wait)

### 4. Configure Branch Protection

**Protect the `main` branch:**
1. Settings → Branches → Add rule for `main`
2. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass (select "Validate Migration Files")
   - ✅ Require branches to be up to date

## 🌿 Working with Preview Branches

### Automatic Preview Creation

When you create a PR, Supabase automatically:
1. Creates a new preview database (copy of production)
2. Applies your migration files to the preview database
3. Posts preview credentials in PR comments

### Using Preview Branch in Your App

**Quick test with preview database:**
```bash
# 1. Copy preview URL and anon key from PR comments

# 2. Create temporary .env.preview file
cat > .env.preview << EOF
EXPO_PUBLIC_SUPABASE_URL=https://xxxx-preview-xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-preview-anon-key
EOF

# 3. Load preview env and test
cp .env .env.backup
cp .env.preview .env
npm start

# 4. Restore original .env when done
cp .env.backup .env
rm .env.backup .env.preview
```

### Preview Branch Lifecycle

| Event | What Happens |
|-------|-------------|
| PR created | Preview branch created, migrations applied |
| New commit pushed | Migrations re-applied automatically |
| PR closed/merged | Preview branch deleted (within 24 hours) |
| PR reopened | New preview branch created |

### Viewing Preview Database

Access Supabase Studio for preview branch:
1. Find preview URL in PR comments
2. Go to `https://supabase.com/dashboard`
3. Select your preview branch from project dropdown
4. Browse tables, run SQL, check RLS policies

**Note:** Preview branches have same data as production at creation time. Any changes you make are isolated to the preview.

## 📋 Common Commands

### Local Development
```bash
# Start Supabase
npx supabase start

# Check status and get URLs
npx supabase status

# Get environment variables for .env file
npx supabase status -o env

# Stop Supabase
npx supabase stop

# Reset database (re-applies all migrations) - USE OFTEN!
npx supabase db reset

# Create new migration
npx supabase migration new <name>

# Generate diff from Studio changes
npx supabase db diff -f <migration_name>

# Access local Studio
open http://127.0.0.1:54323
```

### Sync with Remote
```bash
# Pull latest schema from production (creates migration file)
npx supabase db pull
```

### ⚠️ Command to NEVER Run Manually
```bash
# Push local migrations to production (⚠️ ONLY VIA GITHUB ACTIONS!)
npx supabase db push

# Why you should NEVER run this:
# - Bypasses code review
# - No approval gate
# - Could break production
# - No audit trail
# - Team has no visibility

# The right way:
# 1. Create PR with migrations
# 2. Get approval
# 3. Merge to main
# 4. GitHub Actions runs it with approval gate
```

## ⚠️ Important Notes

### Understanding the Two Key Commands

#### `npx supabase db reset` (Safe - Local Only)
**What it does:**
- Drops your LOCAL database completely
- Re-applies ALL migrations from scratch
- Re-runs seed data
- Only affects your computer

**When to use:**
- ✅ Before every PR (verify migrations work)
- ✅ After pulling new code from main
- ✅ When switching branches
- ✅ When local DB is in a bad state
- ✅ Multiple times per day during development

**Cannot hurt production** - only affects local development environment

#### `npx supabase db push` (Dangerous - Production)
**What it does:**
- Pushes migrations to REMOTE (production) database
- Affects all users immediately
- Bypasses review process if run manually
- Hard to rollback

**When GitHub Actions runs it (SAFE):**
- ✅ After PR merged to main
- ✅ After manual approval from tech lead
- ✅ With full audit trail
- ✅ With team visibility

**When you run it manually (DANGEROUS):**
- ❌ Bypasses code review
- ❌ No approval gate
- ❌ Could break production
- ❌ No audit trail
- ❌ Team has no visibility

**Rule:** NEVER run `npx supabase db push` manually. Always use GitHub Actions.

### How GitHub Actions Protects Production

**The workflow file:** `.github/workflows/deploy-db-production.yml`

```yaml
# 1. Triggers only on push to main
on:
  push:
    branches: [main]
    paths: ['supabase/migrations/**']

# 2. Requires manual approval
environment:
  name: production
  # Configured in GitHub Settings > Environments
  # Requires approval from designated reviewers

# 3. Runs db push with proper auth
- run: npx supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

# 4. Full audit trail in GitHub Actions logs
```

**Protection layers:**
1. **Code review**: PR must be approved before merge
2. **Branch protection**: Main branch requires passing checks
3. **Environment approval**: Production environment requires manual approval
4. **Audit trail**: Every deployment logged in GitHub Actions
5. **Notifications**: Team sees when deployments happen

### Destructive Operations:
```sql
-- ⚠️ These require extra caution:
DROP TABLE users;
DROP COLUMN email;
ALTER COLUMN name TYPE integer;  -- Data type changes
```

**Best practice:** Create new columns/tables, migrate data, then drop old ones in separate migrations.

### Rolling Back:
If a migration causes issues:

1. **Quick fix:** Create a new migration that reverts changes
2. **Nuclear option:** Restore from Supabase backup (Settings → Database → Backups)

## 🏗️ Migration Best Practices

### Good Migration Names:
```
20251011183113_add_comments_table.sql
20251012101520_add_user_preferences_jsonb.sql
20251015143022_add_index_on_user_email.sql
```

### Migration Structure:
```sql
-- Create tables
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read their own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## 🔐 Security

- **Never commit** `.env` with real tokens
- **Token rotation**: Regenerate `SUPABASE_ACCESS_TOKEN` periodically
- **RLS always**: Every table should have Row Level Security enabled
- **Test policies**: Verify RLS in local Studio before pushing

## 📚 Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/cli/local-development)
- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/managing-environments)
- [Supabase Branching & Preview Databases](https://supabase.com/docs/guides/platform/branching)
- [Supabase GitHub Integration](https://supabase.com/docs/guides/platform/github-integration)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

## 🆘 Troubleshooting

### "Migration history doesn't match"
```bash
npx supabase migration repair --status applied <migration_id>
```

### "Docker not available"
```bash
# Rebuild devcontainer
Cmd/Ctrl + Shift + P → "Dev Containers: Rebuild Container"
```

### "Access token not provided"
Check that `SUPABASE_ACCESS_TOKEN` is in your `.env` file and GitHub secrets.

### "Preview branch not created for my PR"

**Check:**
1. Is GitHub integration configured in Supabase Dashboard?
2. Is the repository connected correctly?
3. Does the PR contain migration files in `supabase/migrations/`?
4. Check PR comments for error messages from Supabase bot

**Manual trigger:**
- Close and reopen the PR to trigger preview creation
- Or push a new commit to the PR branch

### "Preview branch showing old data"

Preview branches are created from production snapshot at creation time. If you need fresh data:
1. Close the PR (deletes preview branch)
2. Reopen the PR (creates new preview with latest production data)

### "Can't access preview database from app"

**Verify:**
- Preview URL copied correctly from PR comments
- Preview anon key copied correctly
- `.env` file saved after changes
- App restarted after `.env` update

**Test connection:**
```bash
# Check if preview URL is accessible
curl https://your-preview-url.supabase.co/rest/v1/
```
