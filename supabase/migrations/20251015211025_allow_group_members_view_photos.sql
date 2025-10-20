-- Allow group members to view each other's daily photos
-- This is required for the Groups screen to display members' recent photos

-- Drop the restrictive policy
drop policy if exists "Users can view their own daily photos" on public.daily_photos;

-- Create new policy that allows viewing own photos AND group members' photos
create policy "Users can view their own and group members' daily photos"
on "public"."daily_photos"
as permissive
for select
to authenticated
using (
  -- User can view their own photos
  auth.uid() = user_id
  or
  -- User can view photos of group members
  exists (
    select 1 from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid()
    and gm2.user_id = daily_photos.user_id
  )
);
