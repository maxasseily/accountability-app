-- Seed file for local development
-- This creates test data for the accountability app

-- First, create the auth users
-- These need to exist before we can create profiles due to foreign key constraints

-- User 1: alice@example.com
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'alice@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Alice Johnson"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Create identity for alice@example.com
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'email',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000001', 'alice@example.com')::jsonb,
  now(),
  now()
) on conflict (provider, provider_id) do nothing;

-- User 2: bob@example.com
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'bob@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Bob Smith"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Create identity for bob@example.com
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000002'::uuid,
  'email',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000002', 'bob@example.com')::jsonb,
  now(),
  now()
) on conflict (provider, provider_id) do nothing;

-- User 3: charlie@example.com
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'charlie@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Charlie Davis"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Create identity for charlie@example.com
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000003'::uuid,
  'email',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000003', 'charlie@example.com')::jsonb,
  now(),
  now()
) on conflict (provider, provider_id) do nothing;

-- User 4: diana@example.com
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'diana@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Diana Martinez"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Create identity for diana@example.com
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000004'::uuid,
  'email',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000004', 'diana@example.com')::jsonb,
  now(),
  now()
) on conflict (provider, provider_id) do nothing;

-- User 5: evan@example.com
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'evan@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Evan Wilson"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Create identity for evan@example.com
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000005'::uuid,
  'email',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000005', 'evan@example.com')::jsonb,
  now(),
  now()
) on conflict (provider, provider_id) do nothing;

-- User 6: fiona@example.com
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'fiona@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Fiona Lee"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
) on conflict (id) do nothing;

-- Create identity for fiona@example.com
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  created_at,
  updated_at
)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000006'::uuid,
  'email',
  format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000006', 'fiona@example.com')::jsonb,
  now(),
  now()
) on conflict (provider, provider_id) do nothing;

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

-- Seed user goals with varying completion levels
-- None of the users have 100% completion
do $$
declare
  week_start timestamp with time zone;
  today date;
  three_days_ago date;
  two_days_ago date;
  one_day_ago date;
  four_days_ago date;
begin
  -- Calculate the Monday of the current week
  week_start := date_trunc('week', now()) + interval '1 day';
  today := current_date;
  one_day_ago := current_date - interval '1 day';
  two_days_ago := current_date - interval '2 days';
  three_days_ago := current_date - interval '3 days';
  four_days_ago := current_date - interval '4 days';

  -- Alice (user 1): 3x/week, 0/3 completed (no progress yet)
  insert into public.user_goals (user_id, goal_type, frequency, current_progress, week_start_date, last_completion_date, completion_dates)
  values (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'running',
    3,
    0,
    week_start,
    null,
    '{}'::date[]
  ) on conflict (user_id) do update set
    goal_type = excluded.goal_type,
    frequency = excluded.frequency,
    current_progress = excluded.current_progress,
    week_start_date = excluded.week_start_date,
    last_completion_date = excluded.last_completion_date,
    completion_dates = excluded.completion_dates;

  -- Bob (user 2): 3x/week, 1/3 completed
  insert into public.user_goals (user_id, goal_type, frequency, current_progress, week_start_date, last_completion_date, completion_dates)
  values (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'running',
    3,
    1,
    week_start,
    three_days_ago,
    array[three_days_ago]::date[]
  ) on conflict (user_id) do update set
    goal_type = excluded.goal_type,
    frequency = excluded.frequency,
    current_progress = excluded.current_progress,
    week_start_date = excluded.week_start_date,
    last_completion_date = excluded.last_completion_date,
    completion_dates = excluded.completion_dates;

  -- Charlie (user 3): 3x/week, 2/3 completed
  insert into public.user_goals (user_id, goal_type, frequency, current_progress, week_start_date, last_completion_date, completion_dates)
  values (
    '00000000-0000-0000-0000-000000000003'::uuid,
    'running',
    3,
    2,
    week_start,
    one_day_ago,
    array[three_days_ago, one_day_ago]::date[]
  ) on conflict (user_id) do update set
    goal_type = excluded.goal_type,
    frequency = excluded.frequency,
    current_progress = excluded.current_progress,
    week_start_date = excluded.week_start_date,
    last_completion_date = excluded.last_completion_date,
    completion_dates = excluded.completion_dates;

  -- Diana (user 4): 4x/week, 1/4 completed
  insert into public.user_goals (user_id, goal_type, frequency, current_progress, week_start_date, last_completion_date, completion_dates)
  values (
    '00000000-0000-0000-0000-000000000004'::uuid,
    'running',
    4,
    1,
    week_start,
    two_days_ago,
    array[two_days_ago]::date[]
  ) on conflict (user_id) do update set
    goal_type = excluded.goal_type,
    frequency = excluded.frequency,
    current_progress = excluded.current_progress,
    week_start_date = excluded.week_start_date,
    last_completion_date = excluded.last_completion_date,
    completion_dates = excluded.completion_dates;

  -- Evan (user 5): 2x/week, 1/2 completed
  insert into public.user_goals (user_id, goal_type, frequency, current_progress, week_start_date, last_completion_date, completion_dates)
  values (
    '00000000-0000-0000-0000-000000000005'::uuid,
    'running',
    2,
    1,
    week_start,
    three_days_ago,
    array[three_days_ago]::date[]
  ) on conflict (user_id) do update set
    goal_type = excluded.goal_type,
    frequency = excluded.frequency,
    current_progress = excluded.current_progress,
    week_start_date = excluded.week_start_date,
    last_completion_date = excluded.last_completion_date,
    completion_dates = excluded.completion_dates;

  -- Fiona (user 6): 4x/week, 2/4 completed
  insert into public.user_goals (user_id, goal_type, frequency, current_progress, week_start_date, last_completion_date, completion_dates)
  values (
    '00000000-0000-0000-0000-000000000006'::uuid,
    'running',
    4,
    2,
    week_start,
    one_day_ago,
    array[four_days_ago, one_day_ago]::date[]
  ) on conflict (user_id) do update set
    goal_type = excluded.goal_type,
    frequency = excluded.frequency,
    current_progress = excluded.current_progress,
    week_start_date = excluded.week_start_date,
    last_completion_date = excluded.last_completion_date,
    completion_dates = excluded.completion_dates;

end $$;

-- Seed arena quests for the group
-- These will showcase different quest types between the 3 group members (Alice, Bob, Charlie)

-- Alice and Bob are in an alliance (accepted)
insert into public.arena_quests (group_id, sender_id, receiver_id, quest_type, status, created_at)
values (
  '10000000-0000-0000-0000-000000000001'::uuid,  -- Morning Warriors group
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Alice (sender)
  '00000000-0000-0000-0000-000000000002'::uuid,  -- Bob (receiver)
  'alliance',
  'accepted',
  now() - interval '2 days'
) on conflict (group_id, sender_id, receiver_id, quest_type, status) where status = 'pending' do nothing;

-- Bob and Charlie are battling it out (accepted)
insert into public.arena_quests (group_id, sender_id, receiver_id, quest_type, status, created_at)
values (
  '10000000-0000-0000-0000-000000000001'::uuid,  -- Morning Warriors group
  '00000000-0000-0000-0000-000000000002'::uuid,  -- Bob (sender)
  '00000000-0000-0000-0000-000000000003'::uuid,  -- Charlie (receiver)
  'battle',
  'accepted',
  now() - interval '1 day'
) on conflict (group_id, sender_id, receiver_id, quest_type, status) where status = 'pending' do nothing;

-- Alice is prophesying about Charlie (accepted)
insert into public.arena_quests (group_id, sender_id, receiver_id, quest_type, status, created_at)
values (
  '10000000-0000-0000-0000-000000000001'::uuid,  -- Morning Warriors group
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Alice (sender)
  '00000000-0000-0000-0000-000000000003'::uuid,  -- Charlie (receiver)
  'prophecy',
  'accepted',
  now() - interval '3 days'
) on conflict (group_id, sender_id, receiver_id, quest_type, status) where status = 'pending' do nothing;

-- Charlie has put a curse on Alice (accepted)
insert into public.arena_quests (group_id, sender_id, receiver_id, quest_type, status, created_at)
values (
  '10000000-0000-0000-0000-000000000001'::uuid,  -- Morning Warriors group
  '00000000-0000-0000-0000-000000000003'::uuid,  -- Charlie (sender)
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Alice (receiver)
  'curse',
  'accepted',
  now() - interval '4 days'
) on conflict (group_id, sender_id, receiver_id, quest_type, status) where status = 'pending' do nothing;

-- Pending request: Charlie sent a battle request to Alice (pending)
insert into public.arena_quests (group_id, sender_id, receiver_id, quest_type, status, created_at)
values (
  '10000000-0000-0000-0000-000000000001'::uuid,  -- Morning Warriors group
  '00000000-0000-0000-0000-000000000003'::uuid,  -- Charlie (sender)
  '00000000-0000-0000-0000-000000000001'::uuid,  -- Alice (receiver)
  'battle',
  'pending',
  now() - interval '12 hours'
) on conflict (group_id, sender_id, receiver_id, quest_type, status) where status = 'pending' do nothing;
