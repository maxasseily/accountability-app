# Supabase Setup Guide

## ✅ Completed Steps

### 1. Database Schema
Run this SQL in Supabase SQL Editor (already done):

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

## 🚀 Production Checklist

Before deploying:
- [ ] Enable email confirmation
- [ ] Configure custom SMTP (Settings → Auth → SMTP Settings)
- [ ] Set up password reset redirect URL
- [ ] Review RLS policies
- [ ] Add rate limiting
- [ ] Configure allowed redirect URLs
