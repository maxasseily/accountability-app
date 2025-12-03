-- Add username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN username text NOT NULL DEFAULT 'temp_user';

-- Create unique index on username (case-insensitive)
CREATE UNIQUE INDEX profiles_username_key ON public.profiles (LOWER(username));

-- Remove the default now that the constraint is in place
ALTER TABLE public.profiles
ALTER COLUMN username DROP DEFAULT;

-- Update the handle_new_user trigger function to include username AND user_statistics
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username'
  );

  -- Create user_statistics entry with starting values
  INSERT INTO public.user_statistics (user_id, credibility, mojo, lifetime_goals_logged, user_rank)
  VALUES (
    NEW.id,
    50,  -- Default credibility
    10,  -- Starting mojo
    0,   -- No goals logged yet
    1    -- Starting rank (Bronze I)
  );

  RETURN NEW;
END;
$function$;
