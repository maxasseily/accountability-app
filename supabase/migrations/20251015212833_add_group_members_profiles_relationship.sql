-- Add foreign key relationship from group_members to profiles
-- This allows Supabase to automatically join profiles when querying group_members

-- The relationship already exists through auth.users, but we need to make it explicit for PostgREST
-- Since group_members.user_id references auth.users.id and profiles.id also references auth.users.id,
-- we can create a view or use a different query approach

-- Actually, the issue is that PostgREST needs to know about the relationship
-- Let's add a comment to document the relationship for PostgREST

comment on column group_members.user_id is
'@fk profiles(id)';
