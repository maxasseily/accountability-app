-- Create groups table
create table "public"."groups" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "access_code" text not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."groups" enable row level security;

-- Create group_members table
create table "public"."group_members" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "group_id" uuid not null,
    "joined_at" timestamp with time zone not null default now()
);

alter table "public"."group_members" enable row level security;

-- Add primary keys
CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id);
CREATE UNIQUE INDEX group_members_pkey ON public.group_members USING btree (id);

alter table "public"."groups" add constraint "groups_pkey" PRIMARY KEY using index "groups_pkey";
alter table "public"."group_members" add constraint "group_members_pkey" PRIMARY KEY using index "group_members_pkey";

-- Add unique constraints
CREATE UNIQUE INDEX groups_access_code_key ON public.groups USING btree (access_code);
CREATE UNIQUE INDEX group_members_user_id_group_id_key ON public.group_members USING btree (user_id, group_id);

alter table "public"."groups" add constraint "groups_access_code_key" UNIQUE using index "groups_access_code_key";
alter table "public"."group_members" add constraint "group_members_user_id_group_id_key" UNIQUE using index "group_members_user_id_group_id_key";

-- Add foreign keys
alter table "public"."groups" add constraint "groups_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."groups" validate constraint "groups_created_by_fkey";

alter table "public"."group_members" add constraint "group_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."group_members" validate constraint "group_members_user_id_fkey";

alter table "public"."group_members" add constraint "group_members_group_id_fkey" FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE not valid;
alter table "public"."group_members" validate constraint "group_members_group_id_fkey";

-- Add check constraint for maximum 6 members per group
-- Note: This is enforced at the function level for better error handling

-- Create function to generate random access code
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
declare
  code text;
  code_exists boolean;
begin
  loop
    -- Generate 8-character alphanumeric code (uppercase)
    code := upper(substr(md5(random()::text), 1, 8));

    -- Check if code already exists
    select exists(select 1 from groups where access_code = code) into code_exists;

    exit when not code_exists;
  end loop;

  return code;
end;
$function$;

-- Create function to create a group
CREATE OR REPLACE FUNCTION public.create_group(group_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  new_group_id uuid;
  new_access_code text;
  result json;
begin
  -- Generate unique access code
  new_access_code := generate_access_code();

  -- Insert new group
  insert into public.groups (name, access_code, created_by)
  values (group_name, new_access_code, auth.uid())
  returning id into new_group_id;

  -- Add creator as first member
  insert into public.group_members (user_id, group_id)
  values (auth.uid(), new_group_id);

  -- Return group details
  select json_build_object(
    'id', new_group_id,
    'name', group_name,
    'access_code', new_access_code,
    'created_by', auth.uid(),
    'created_at', now()
  ) into result;

  return result;
end;
$function$;

-- Create function to join a group
CREATE OR REPLACE FUNCTION public.join_group(code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  target_group_id uuid;
  member_count int;
  result json;
begin
  -- Find group by access code
  select id into target_group_id
  from public.groups
  where access_code = upper(code);

  if target_group_id is null then
    raise exception 'Invalid access code';
  end if;

  -- Check if user is already a member
  if exists(
    select 1 from public.group_members
    where user_id = auth.uid() and group_id = target_group_id
  ) then
    raise exception 'You are already a member of this group';
  end if;

  -- Check if user is in another group
  if exists(
    select 1 from public.group_members
    where user_id = auth.uid()
  ) then
    raise exception 'You must leave your current group before joining a new one';
  end if;

  -- Count current members
  select count(*) into member_count
  from public.group_members
  where group_id = target_group_id;

  if member_count >= 6 then
    raise exception 'Group is full (maximum 6 members)';
  end if;

  -- Add user to group
  insert into public.group_members (user_id, group_id)
  values (auth.uid(), target_group_id);

  -- Return group details
  select json_build_object(
    'id', g.id,
    'name', g.name,
    'access_code', g.access_code,
    'created_by', g.created_by,
    'created_at', g.created_at
  ) into result
  from public.groups g
  where g.id = target_group_id;

  return result;
end;
$function$;

-- Create function to leave a group
CREATE OR REPLACE FUNCTION public.leave_group()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
declare
  user_group_id uuid;
  remaining_members int;
begin
  -- Find user's group
  select group_id into user_group_id
  from public.group_members
  where user_id = auth.uid();

  if user_group_id is null then
    raise exception 'You are not a member of any group';
  end if;

  -- Remove user from group
  delete from public.group_members
  where user_id = auth.uid();

  -- Check if group is now empty
  select count(*) into remaining_members
  from public.group_members
  where group_id = user_group_id;

  -- Delete group if empty
  if remaining_members = 0 then
    delete from public.groups
    where id = user_group_id;
  end if;
end;
$function$;

-- Row Level Security Policies

-- Groups: Users can view groups they are members of
create policy "Users can view their group"
on "public"."groups"
as permissive
for select
to authenticated
using (
  exists (
    select 1 from public.group_members
    where group_members.group_id = groups.id
    and group_members.user_id = auth.uid()
  )
);

-- Groups: Users can create groups (handled by function)
create policy "Users can create groups"
on "public"."groups"
as permissive
for insert
to authenticated
with check (created_by = auth.uid());

-- Groups: Only creator can update group name
create policy "Group creator can update group"
on "public"."groups"
as permissive
for update
to authenticated
using (created_by = auth.uid());

-- Groups: Only creator can delete group (or automatic deletion when empty)
create policy "Group creator can delete group"
on "public"."groups"
as permissive
for delete
to authenticated
using (created_by = auth.uid());

-- Group Members: Users can view members of their group
drop policy if exists "Users can view their group members" on public.group_members;

create policy "Users can view their group members"
on public.group_members
as permissive
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid()
    and gm2.user_id = group_members.user_id
  )
);

-- Group Members: Users can join groups (handled by function)
create policy "Users can join groups"
on "public"."group_members"
as permissive
for insert
to authenticated
with check (user_id = auth.uid());

-- Group Members: Users can leave groups
create policy "Users can leave groups"
on "public"."group_members"
as permissive
for delete
to authenticated
using (user_id = auth.uid());

-- Update profiles RLS to allow group members to view each other
create policy "Group members can view each other's profiles"
on "public"."profiles"
as permissive
for select
to authenticated
using (
  -- User can view their own profile
  auth.uid() = id
  or
  -- User can view profiles of group members
  exists (
    select 1 from public.group_members gm1
    join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid()
    and gm2.user_id = profiles.id
  )
);
