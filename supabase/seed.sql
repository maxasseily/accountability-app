-- Seed file for local development
-- This creates test data for the accountability app

-- First, create the auth users
-- These need to exist before we can create profiles due to foreign key constraints

-- User 1: alice@example.com
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'alice@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Alice Johnson"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- User 2: bob@example.com
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'bob@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Bob Smith"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- User 3: charlie@example.com
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
)
values (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'charlie@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Charlie Davis"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- User 4: diana@example.com
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
)
values (
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'diana@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Diana Martinez"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- User 5: evan@example.com
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
)
values (
  '00000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'evan@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Evan Wilson"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- User 6: fiona@example.com
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
)
values (
  '00000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'fiona@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Fiona Lee"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- Now insert the profiles (these will be auto-created by the trigger, but we'll update them with our custom data)
-- User 1: alice@example.com
insert into public.profiles (id, email, full_name, avatar_url, rank)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'alice@example.com',
  'Alice Johnson',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
  'Champion'
) on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  rank = excluded.rank;

-- User 2: bob@example.com
insert into public.profiles (id, email, full_name, avatar_url, rank)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'bob@example.com',
  'Bob Smith',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
  'Rising Star'
) on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  rank = excluded.rank;

-- User 3: charlie@example.com
insert into public.profiles (id, email, full_name, avatar_url, rank)
values (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'charlie@example.com',
  'Charlie Davis',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  'Veteran'
) on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  rank = excluded.rank;

-- User 4: diana@example.com
insert into public.profiles (id, email, full_name, avatar_url, rank)
values (
  '00000000-0000-0000-0000-000000000004'::uuid,
  'diana@example.com',
  'Diana Martinez',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
  'Elite'
) on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  rank = excluded.rank;

-- User 5: evan@example.com
insert into public.profiles (id, email, full_name, avatar_url, rank)
values (
  '00000000-0000-0000-0000-000000000005'::uuid,
  'evan@example.com',
  'Evan Wilson',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Evan',
  'Noob'
) on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  rank = excluded.rank;

-- User 6: fiona@example.com
insert into public.profiles (id, email, full_name, avatar_url, rank)
values (
  '00000000-0000-0000-0000-000000000006'::uuid,
  'fiona@example.com',
  'Fiona Lee',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Fiona',
  'Pro'
) on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url,
  rank = excluded.rank;

-- Create a sample group
insert into public.groups (id, name, access_code, created_by)
values (
  '10000000-0000-0000-0000-000000000001'::uuid,
  'Morning Warriors',
  'WARRIOR1',
  '00000000-0000-0000-0000-000000000001'::uuid
) on conflict (id) do update set
  name = excluded.name,
  access_code = excluded.access_code;

-- Add only 3 users to the group (leaving room for others to join)
insert into public.group_members (user_id, group_id)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, '10000000-0000-0000-0000-000000000001'::uuid),
  ('00000000-0000-0000-0000-000000000002'::uuid, '10000000-0000-0000-0000-000000000001'::uuid),
  ('00000000-0000-0000-0000-000000000003'::uuid, '10000000-0000-0000-0000-000000000001'::uuid)
on conflict (user_id, group_id) do nothing;

-- Add daily photos for the past 7 days for each user
-- Using placeholder URLs (in production these would be actual storage URLs)

-- Alice's photos
insert into public.daily_photos (user_id, photo_url, date)
values
  ('00000000-0000-0000-0000-000000000001'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000001/2025-10-22.jpg', '2025-10-22'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000001/2025-10-23.jpg', '2025-10-23'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000001/2025-10-24.jpg', '2025-10-24'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000001/2025-10-25.jpg', '2025-10-25'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000001/2025-10-26.jpg', '2025-10-26'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000001/2025-10-27.jpg', '2025-10-27'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000001/2025-10-28.jpg', '2025-10-28')
on conflict (user_id, date) do nothing;

-- Bob's photos (missed one day)
insert into public.daily_photos (user_id, photo_url, date)
values
  ('00000000-0000-0000-0000-000000000002'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000002/2025-10-22.jpg', '2025-10-22'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000002/2025-10-23.jpg', '2025-10-23'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000002/2025-10-25.jpg', '2025-10-25'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000002/2025-10-26.jpg', '2025-10-26'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000002/2025-10-27.jpg', '2025-10-27'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000002/2025-10-28.jpg', '2025-10-28')
on conflict (user_id, date) do nothing;

-- Charlie's photos
insert into public.daily_photos (user_id, photo_url, date)
values
  ('00000000-0000-0000-0000-000000000003'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000003/2025-10-22.jpg', '2025-10-22'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000003/2025-10-23.jpg', '2025-10-23'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000003/2025-10-24.jpg', '2025-10-24'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000003/2025-10-25.jpg', '2025-10-25'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000003/2025-10-26.jpg', '2025-10-26'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000003/2025-10-27.jpg', '2025-10-27'),
  ('00000000-0000-0000-0000-000000000003'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000003/2025-10-28.jpg', '2025-10-28')
on conflict (user_id, date) do nothing;

-- Diana's photos (new user, only last 3 days)
insert into public.daily_photos (user_id, photo_url, date)
values
  ('00000000-0000-0000-0000-000000000004'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000004/2025-10-26.jpg', '2025-10-26'),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000004/2025-10-27.jpg', '2025-10-27'),
  ('00000000-0000-0000-0000-000000000004'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000004/2025-10-28.jpg', '2025-10-28')
on conflict (user_id, date) do nothing;

-- Evan's photos (missed two days)
insert into public.daily_photos (user_id, photo_url, date)
values
  ('00000000-0000-0000-0000-000000000005'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000005/2025-10-22.jpg', '2025-10-22'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000005/2025-10-24.jpg', '2025-10-24'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000005/2025-10-26.jpg', '2025-10-26'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000005/2025-10-27.jpg', '2025-10-27'),
  ('00000000-0000-0000-0000-000000000005'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000005/2025-10-28.jpg', '2025-10-28')
on conflict (user_id, date) do nothing;

-- Fiona's photos (perfect streak)
insert into public.daily_photos (user_id, photo_url, date)
values
  ('00000000-0000-0000-0000-000000000006'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000006/2025-10-22.jpg', '2025-10-22'),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000006/2025-10-23.jpg', '2025-10-23'),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000006/2025-10-24.jpg', '2025-10-24'),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000006/2025-10-25.jpg', '2025-10-25'),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000006/2025-10-26.jpg', '2025-10-26'),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000006/2025-10-27.jpg', '2025-10-27'),
  ('00000000-0000-0000-0000-000000000006'::uuid, 'daily-photos/00000000-0000-0000-0000-000000000006/2025-10-28.jpg', '2025-10-28')
on conflict (user_id, date) do nothing;
