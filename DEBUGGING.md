# Debugging Supabase Local Development

When encountering issues with local Supabase, use these debugging techniques to identify the root cause.

## Docker Containers

Local Supabase runs multiple Docker containers:

```bash
# List all Supabase containers
docker ps | grep supabase

# Common containers:
# - supabase_db_accountability-app          (PostgreSQL database)
# - supabase_auth_accountability-app        (GoTrue auth service)
# - supabase_rest_accountability-app        (PostgREST API)
# - supabase_storage_accountability-app     (Storage service)
# - supabase_studio_accountability-app      (Studio UI)
# - supabase_kong_accountability-app        (API gateway)
```

## Viewing Logs

**Authentication Issues** (login failures, token errors):
```bash
# View GoTrue auth service logs (most important for auth debugging)
docker logs supabase_auth_accountability-app 2>&1 | tail -50

# Follow auth logs in real-time
docker logs -f supabase_auth_accountability-app

# Common auth errors to look for:
# - "error finding user: sql: Scan error" → Missing/NULL fields in auth.users
# - "Invalid login credentials" → Wrong password or user doesn't exist
# - "Invalid Refresh Token" → Session expired or token mismatch
```

**Database Issues** (migration failures, seed errors):
```bash
# View PostgreSQL logs
docker logs supabase_db_accountability-app 2>&1 | tail -50

# Common DB errors to look for:
# - Constraint violations
# - Missing columns
# - Foreign key errors
# - Seed file syntax errors
```

**API Issues** (REST endpoint errors):
```bash
# View PostgREST logs
docker logs supabase_rest_accountability-app 2>&1 | tail -50

# Common API errors:
# - RLS policy violations
# - Permission denied errors
# - Missing tables/functions
```

**All Services**:
```bash
# View all Supabase logs together
docker logs supabase_db_accountability-app 2>&1 | tail -20
docker logs supabase_auth_accountability-app 2>&1 | tail -20
docker logs supabase_rest_accountability-app 2>&1 | tail -20
```

## Debugging Authentication Issues

**Symptom**: "Database error querying schema" during login

**Steps**:
1. Check GoTrue auth logs:
   ```bash
   docker logs supabase_auth_accountability-app 2>&1 | tail -30
   ```

2. Look for SQL scan errors indicating missing/NULL fields in `auth.users`

3. Verify seed data integrity:
   ```bash
   docker exec supabase_db_accountability-app psql -U postgres -d postgres -c \
     "SELECT email, email_confirmed_at IS NOT NULL as confirmed FROM auth.users LIMIT 5;"
   ```

4. Check `auth.identities` table:
   ```bash
   docker exec supabase_db_accountability-app psql -U postgres -d postgres -c \
     "SELECT user_id, provider, provider_id FROM auth.identities LIMIT 5;"
   ```

**Common Auth Errors**:
- **NULL string fields**: GoTrue requires empty strings ('') not NULL for fields like `email_change`, `recovery_token`, `confirmation_token`
- **Missing identities**: Every `auth.users` record needs a corresponding `auth.identities` record
- **Wrong provider_id**: For email auth, `provider_id` should be the user's UUID

## Debugging Database Issues

**Direct database access**:
```bash
# Execute SQL queries directly
docker exec supabase_db_accountability-app psql -U postgres -d postgres -c "SELECT * FROM public.profiles LIMIT 3;"

# Check auth.users structure
docker exec supabase_db_accountability-app psql -U postgres -d postgres -c "\d auth.users"

# Check migration status
npx supabase migration list
```

**Inspect seed data**:
```bash
# View seeded users
docker exec supabase_db_accountability-app psql -U postgres -d postgres -c \
  "SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email LIKE '%@example.com';"

# Check password hashes
docker exec supabase_db_accountability-app psql -U postgres -d postgres -c \
  "SELECT email, LEFT(encrypted_password, 20) as pwd_prefix, LENGTH(encrypted_password) as pwd_len FROM auth.users WHERE email = 'alice@example.com';"
```

## Using Supabase Studio

Studio UI provides a visual interface for debugging:

**Access**: `http://127.0.0.1:54323`

**Useful features**:
- **Table Editor**: View/edit data in `auth.users`, `public.profiles`, etc.
- **SQL Editor**: Run custom queries to inspect data
- **Auth → Users**: See all authenticated users
- **Database → Roles**: Check RLS policies

**Pro tip**: When debugging auth issues, compare a working user (created via signup) with a seeded user to spot differences.

## Common Issues & Solutions

| Error | Location | Solution |
|-------|----------|----------|
| "Database error querying schema" | Auth logs | Check for NULL fields in `auth.users` that should be empty strings |
| "Invalid login credentials" | Auth logs | Verify password hash format and `auth.identities` exists |
| "Refresh Token Not Found" | Auth logs | Session expired, user needs to re-login |
| Seed file errors | DB logs | Check SQL syntax, ensure migrations ran first |
| RLS policy violations | REST logs | Check Row Level Security policies in migrations |

## Debugging Workflow

1. **Reproduce the error** in the app
2. **Check relevant logs** (auth for login issues, db for data issues)
3. **Inspect database** directly using `docker exec` commands
4. **Compare with Studio UI** to verify data integrity
5. **Test fix** with `npx supabase db reset` and re-test

**See:** [SUPABASE_WORKFLOW.md](./SUPABASE_WORKFLOW.md) for detailed team workflow
