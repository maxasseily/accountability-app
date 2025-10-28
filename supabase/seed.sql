-- Seed data for local development and preview databases
-- This runs automatically in preview DBs created by PR workflow

-- Create test users in auth.users table
-- Note: In production, these are created via Supabase Auth signup
-- For testing, we insert them directly with known UUIDs

-- Test User 1
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'test1@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User One"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Test User 2
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'test2@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User Two"}',
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Profiles will be created automatically by the handle_new_user() trigger
-- But we can add extra data to them

UPDATE profiles
SET
  full_name = 'Test User One',
  rank = 'Beginner'
WHERE id = '11111111-1111-1111-1111-111111111111';

UPDATE profiles
SET
  full_name = 'Test User Two',
  rank = 'Advanced'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Add some sample daily photos
INSERT INTO daily_photos (id, user_id, photo_url, date, uploaded_at)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'https://placehold.co/600x400/png?text=Day+1',
    CURRENT_DATE - INTERVAL '2 days',
    now() - INTERVAL '2 days'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'https://placehold.co/600x400/png?text=Day+2',
    CURRENT_DATE - INTERVAL '1 day',
    now() - INTERVAL '1 day'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'https://placehold.co/600x400/png?text=Day+3',
    CURRENT_DATE,
    now()
  )
ON CONFLICT (user_id, date) DO NOTHING;
