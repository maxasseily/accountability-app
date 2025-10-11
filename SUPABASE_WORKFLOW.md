# Supabase Database Migration Workflow

This document outlines the team workflow for managing database schema changes with Supabase.

## 🔄 Workflow Overview

```
Local Dev → PR Review → Merge to Main → Manual Approval → Production Deploy
```

## 👥 Team Workflow

### 1. **Local Development**

```bash
# Start local Supabase
npx supabase start

# Create a new migration
npx supabase migration new add_your_feature

# Edit the migration file in supabase/migrations/
# OR use Studio UI at http://127.0.0.1:54323

# Generate diff of changes made in Studio
npx supabase db diff -f add_your_feature

# Test locally (applies all migrations from scratch)
npx supabase db reset

# Verify in local Studio
open http://127.0.0.1:54323
```

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
- ✅ GitHub Actions validates migration syntax
- ✅ Bot comments on PR with review checklist
- ✅ Shows migration diff for review

### 3. **PR Review Checklist**

Reviewers should verify:

- [ ] **Backwards Compatible**: Won't break existing app versions
- [ ] **No Data Loss**: No `DROP TABLE` or `DROP COLUMN` without migration path
- [ ] **RLS Policies**: Row Level Security configured correctly
- [ ] **Indexes Added**: For columns used in WHERE/JOIN clauses
- [ ] **Tested Locally**: Author ran `npx supabase db reset` successfully
- [ ] **Migration File Name**: Descriptive and follows convention

### 4. **Merge to Main**

After PR approval:
```bash
# Merge PR (via GitHub UI or command line)
git checkout main
git merge feature/add-comments
git push origin main
```

**What happens automatically:**
- 🚀 GitHub Actions workflow triggered
- ⏸️ **Waits for manual approval** (see step 5)

### 5. **Production Deployment (Requires Approval)**

**GitHub will pause and require manual approval.**

**Approvers must:**
1. Go to GitHub Actions → "Deploy Database to Production" workflow
2. Review the migration changes
3. Click **"Review deployments"**
4. Select **"production"** environment
5. Click **"Approve and deploy"**

**What happens after approval:**
- 📤 `npx supabase db push` runs automatically
- ✅ Migrations applied to production database
- 🔗 Changes live at `https://moqzugvlwzdotgnjmndd.supabase.co`

## 🛠️ Setup Required (One-time)

### 1. Configure GitHub Secrets

Add to repository secrets (Settings → Secrets and variables → Actions):

```
SUPABASE_ACCESS_TOKEN = sbp_1e75730a0c5154a58e8ee1ce471b250dfb41eaf3
```

### 2. Configure Production Environment

**In GitHub repository settings:**
1. Go to **Settings → Environments**
2. Create environment named **`production`**
3. Enable **"Required reviewers"**
4. Add team members who can approve (e.g., tech lead, senior devs)
5. Optional: Add wait timer (e.g., 5 minutes minimum wait)

### 3. Configure Branch Protection

**Protect the `main` branch:**
1. Settings → Branches → Add rule for `main`
2. Enable:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass (select "Validate Migration Files")
   - ✅ Require branches to be up to date

## 📋 Common Commands

### Local Development
```bash
# Start Supabase
npx supabase start

# Stop Supabase
npx supabase stop

# Check status
npx supabase status

# Reset database (re-applies all migrations)
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
# Pull latest schema from production
npx supabase db pull

# Push local migrations to production (⚠️ USE CI/CD INSTEAD)
npx supabase db push
```

## ⚠️ Important Notes

### DO NOT Run Directly on Production:
```bash
# ❌ DON'T DO THIS - Use GitHub Actions instead
npx supabase db push
```

**Why?** No audit trail, no review, no rollback capability.

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
