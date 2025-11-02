-- Create user_goals table to store user goals in the database
create table "public"."user_goals" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "goal_type" text not null default 'running',
    "frequency" integer not null check (frequency in (2, 3, 4)),
    "current_progress" integer not null default 0,
    "week_start_date" timestamp with time zone not null,
    "last_completion_date" date,
    "completion_dates" date[] not null default '{}',
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Enable RLS
alter table "public"."user_goals" enable row level security;

-- Create indexes
create unique index user_goals_pkey on public.user_goals using btree (id);
create unique index user_goals_user_id_key on public.user_goals using btree (user_id);

-- Add primary key and unique constraint
alter table "public"."user_goals" add constraint "user_goals_pkey" primary key using index "user_goals_pkey";
alter table "public"."user_goals" add constraint "user_goals_user_id_key" unique using index "user_goals_user_id_key";

-- Add foreign key
alter table "public"."user_goals" add constraint "user_goals_user_id_fkey"
  foreign key (user_id) references auth.users(id) on delete cascade;

-- RLS Policies
create policy "Users can view their own goal"
on "public"."user_goals"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));

create policy "Users can insert their own goal"
on "public"."user_goals"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));

create policy "Users can update their own goal"
on "public"."user_goals"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));

create policy "Users can delete their own goal"
on "public"."user_goals"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));

-- Policy to allow group members to view each other's goals
create policy "Group members can view each other's goals"
on "public"."user_goals"
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.group_members gm1
    inner join public.group_members gm2 on gm1.group_id = gm2.group_id
    where gm1.user_id = auth.uid()
      and gm2.user_id = user_goals.user_id
  )
);
