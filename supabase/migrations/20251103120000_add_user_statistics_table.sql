-- Create table for tracking persistent user statistics
create table "public"."user_statistics" (
    "user_id" uuid primary key references auth.users(id) on delete cascade,
    "credibility" integer not null default 50,
    "lifetime_goals_logged" integer not null default 0,
    "mojo" double precision not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);

-- Enable Row Level Security
alter table "public"."user_statistics" enable row level security;

-- Policies for individual access
create policy "Users can view their own statistics"
on "public"."user_statistics"
as permissive
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own statistics"
on "public"."user_statistics"
as permissive
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own statistics"
on "public"."user_statistics"
as permissive
for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own statistics"
on "public"."user_statistics"
as permissive
for delete
to authenticated
using (auth.uid() = user_id);
