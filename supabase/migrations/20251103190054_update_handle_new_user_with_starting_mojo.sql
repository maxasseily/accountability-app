-- Update the handle_new_user trigger function to also create user_statistics with starting mojo
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Create profile entry
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );

  -- Create user_statistics entry with 10 starting mojo
  insert into public.user_statistics (user_id, credibility, mojo, lifetime_goals_logged)
  values (
    new.id,
    50,  -- Default credibility
    10,  -- Starting mojo
    0    -- No goals logged yet
  );

  return new;
end;
$function$;
