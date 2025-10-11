create table "public"."daily_photos" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "photo_url" text not null,
    "uploaded_at" timestamp with time zone not null default now(),
    "date" date not null default CURRENT_DATE
);


alter table "public"."daily_photos" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "rank" text default 'Noob'::text
);


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX daily_photos_pkey ON public.daily_photos USING btree (id);

CREATE UNIQUE INDEX daily_photos_user_id_date_key ON public.daily_photos USING btree (user_id, date);

CREATE INDEX idx_daily_photos_user_date ON public.daily_photos USING btree (user_id, date DESC);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."daily_photos" add constraint "daily_photos_pkey" PRIMARY KEY using index "daily_photos_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."daily_photos" add constraint "daily_photos_user_id_date_key" UNIQUE using index "daily_photos_user_id_date_key";

alter table "public"."daily_photos" add constraint "daily_photos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."daily_photos" validate constraint "daily_photos_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ begin insert into public.profiles (id, email, full_name) values ( new.id, new.email, new.raw_user_meta_data->>'full_name' ); return new; end; $function$
;

create policy "Users can delete their own daily photos"
on "public"."daily_photos"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can update today's photo"
on "public"."daily_photos"
as permissive
for update
to authenticated
using (((auth.uid() = user_id) AND (date = CURRENT_DATE)));


create policy "Users can upload their own daily photo"
on "public"."daily_photos"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can view their own daily photos"
on "public"."daily_photos"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));



CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();


  create policy "Daily photos are publicly accessible"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'daily-photos'::text));



  create policy "Users can delete their daily photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'daily-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their daily photos"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'daily-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload daily photos"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'daily-photos'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



