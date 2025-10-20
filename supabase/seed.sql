-- Helper to safely check shared group membership
create or replace function public.is_same_group(u1 uuid, u2 uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = u1
    and gm2.user_id = u2
  );
$$;

-- Policy: allow members of same group to view each other
drop policy if exists "Users can view their group members" on public.group_members;

create policy "Users can view their group members"
on public.group_members
as permissive
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_same_group(auth.uid(), user_id)
);
