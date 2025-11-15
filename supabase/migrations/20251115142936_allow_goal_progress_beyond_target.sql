-- Allow goal progress to exceed the weekly target (up to 7 completions per week)
-- Previously capped at frequency, now caps at 7 to allow users to surpass their goals

CREATE OR REPLACE FUNCTION public.log_goal_completion(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record public.user_goals%rowtype;
  stats_record public.user_statistics%rowtype;
  now_ts timestamptz := timezone('utc', now());
  today date := now_ts::date;
  current_week_start timestamptz := date_trunc('week', now_ts);
  new_completion_dates date[];
  new_progress integer;
  needs_reset boolean;
  mojo_gained double precision := 5; -- Base mojo for logging a goal
  is_weekly_goal_completed boolean := false;
  has_alliance_bonus boolean := false;
BEGIN
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User id must be provided' USING errcode = 'P0001';
  END IF;

  IF auth.uid() IS DISTINCT FROM user_uuid THEN
    RAISE EXCEPTION 'Cannot modify goal for another user' USING errcode = 'P0001';
  END IF;

  SELECT *
    INTO goal_record
    FROM public.user_goals
    WHERE user_id = user_uuid
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found' USING errcode = 'P0001';
  END IF;

  IF goal_record.last_completion_date = today THEN
    RAISE EXCEPTION 'Already logged a run today' USING errcode = 'P0001';
  END IF;

  needs_reset := goal_record.week_start_date IS NULL OR current_week_start > goal_record.week_start_date;

  IF needs_reset THEN
    new_progress := 1;
    new_completion_dates := array[today];
  ELSE
    -- Cap at 7 completions per week (one per day) instead of capping at frequency
    new_progress := least(goal_record.current_progress + 1, 7);
    new_completion_dates := coalesce(goal_record.completion_dates, '{}'::date[]);
    new_completion_dates := array_append(new_completion_dates, today);
  END IF;

  -- Check if weekly goal is completed with this log
  IF new_progress = goal_record.frequency THEN
    is_weekly_goal_completed := true;
    mojo_gained := mojo_gained + 10; -- Bonus mojo for completing weekly goal

    -- Check for alliance completions (this may add notifications and mojo)
    PERFORM check_alliance_completion(user_uuid, current_week_start);

    -- Check for prophecy/curse resolutions (this may add notifications and mojo)
    PERFORM resolve_prophecy_curse_on_completion(user_uuid, current_week_start);

    -- Check if there's a pending alliance success notification for this user
    -- This indicates they just completed an alliance
    has_alliance_bonus := EXISTS (
      SELECT 1 FROM user_notifications
      WHERE user_id = user_uuid
        AND notification_type = 'alliance_success'
        AND is_read = FALSE
        AND created_at >= now_ts - interval '1 minute'
    );
  END IF;

  UPDATE public.user_goals
     SET current_progress   = new_progress,
         week_start_date    = CASE WHEN needs_reset THEN current_week_start ELSE goal_record.week_start_date END,
         last_completion_date = today,
         completion_dates   = new_completion_dates,
         updated_at         = now_ts
   WHERE user_id = user_uuid
   RETURNING * INTO goal_record;

  INSERT INTO public.user_statistics (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_statistics
     SET lifetime_goals_logged = lifetime_goals_logged + 1,
         credibility           = least(credibility + 1, 100),
         mojo                  = mojo + mojo_gained,
         updated_at            = now_ts
   WHERE user_id = user_uuid
   RETURNING * INTO stats_record;

  RETURN jsonb_build_object(
    'goal', to_jsonb(goal_record),
    'statistics', to_jsonb(stats_record),
    'mojo_gained', mojo_gained,
    'weekly_goal_completed', is_weekly_goal_completed,
    'has_alliance_bonus', has_alliance_bonus
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_goal_completion(uuid) TO authenticated;
