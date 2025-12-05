# Seeding Scripts

This directory contains scripts for seeding local Supabase with test data.

## Photo Seeding

The `seed-photos.ts` script creates simple colored PNG images for each test user's daily photos.

### Usage

```bash
npm run seed-photos
```

### What it does

Creates solid-color PNG images (400x400) for each of the 7 test users:
- Alice (red background)
- Bob (cyan background)
- Charlie (mint background)
- Diana (pink background)
- Evan (purple background)
- Fiona (light pink background)
- Grace (yellow background)

Each user gets photos for their respective dates as defined in `supabase/seed.sql`.

### Prerequisites

- Local Supabase running (`npx supabase start`)
- Canvas library installed (automatically installed as dev dependency)
- Service role key configured (uses local Supabase default key)

### When to run

Run this script **once** after starting local Supabase for the first time:

```bash
npx supabase start
npm run seed-photos
```

The photos persist in the `daily-photos` storage bucket even after `npx supabase db reset`, so you don't need to re-run this script unless you completely tear down Supabase.

You can view the uploaded photos through Supabase Studio at `http://127.0.0.1:54323` under Storage > daily-photos.
