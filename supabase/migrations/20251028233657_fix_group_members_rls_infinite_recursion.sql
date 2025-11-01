-- Fix infinite recursion in group_members RLS policy
-- The previous policy queried group_members within the policy check, causing infinite recursion
-- New approach: Use scalar subquery to get user's group_id without triggering RLS recursion

-- Drop the problematic policy
drop policy if exists "Users can view their group members" on public.group_members;

-- Create a security definer function to get user's group_id
-- This bypasses RLS and breaks the recursion cycle
create or replace function public.get_user_group_id(uid uuid)
returns uuid
language sql
security definer
stable
as $$
  select group_id
  from public.group_members
  where user_id = uid
  limit 1;
$$;

-- Create new policy using the helper function
create policy "Users can view their group members"
on public.group_members
as permissive
for select
to authenticated
using (
  -- User can see their own membership
  user_id = auth.uid()
  or
  -- User can see other members in the same group
  group_id = public.get_user_group_id(auth.uid())
);
