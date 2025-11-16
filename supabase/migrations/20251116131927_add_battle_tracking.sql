-- Add Battle Quest Tracking
-- This migration adds the necessary columns and logic to track and resolve Battle quests

-- 1. Add Battle-specific columns to arena_quests table
ALTER TABLE arena_quests
ADD COLUMN sender_completions INTEGER DEFAULT 0,
ADD COLUMN receiver_completions INTEGER DEFAULT 0,
ADD COLUMN battle_status TEXT CHECK (battle_status IN ('active', 'completed_sender_won', 'completed_receiver_won', 'completed_tie'));

-- 2. Create function to set battle week start date when accepted
CREATE OR REPLACE FUNCTION trigger_set_battle_week_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set week_start_date for battles when they're accepted
  IF NEW.quest_type = 'battle' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    NEW.week_start_date := date_trunc('week', CURRENT_TIMESTAMP);
    NEW.battle_status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on arena_quests update
DROP TRIGGER IF EXISTS set_battle_week_start ON arena_quests;
CREATE TRIGGER set_battle_week_start
  BEFORE UPDATE ON arena_quests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_battle_week_start();

-- 3. Function to track battle completions when user logs a goal
CREATE OR REPLACE FUNCTION check_battle_completion(p_user_id UUID, p_week_start_date TIMESTAMPTZ)
RETURNS VOID AS $$
DECLARE
  v_quest RECORD;
  v_sender_total INTEGER;
  v_receiver_total INTEGER;
BEGIN
  -- Find all active battles for this user in this week
  FOR v_quest IN
    SELECT * FROM arena_quests
    WHERE quest_type = 'battle'
      AND status = 'accepted'
      AND battle_status = 'active'
      AND week_start_date = p_week_start_date
      AND (sender_id = p_user_id OR receiver_id = p_user_id)
  LOOP
    -- Count sender's completions for this week
    -- user_goals.completion_dates is a date[] array
    SELECT COALESCE(array_length(completion_dates, 1), 0) INTO v_sender_total
    FROM user_goals
    WHERE user_id = v_quest.sender_id
      AND week_start_date = p_week_start_date;

    -- Count receiver's completions for this week
    SELECT COALESCE(array_length(completion_dates, 1), 0) INTO v_receiver_total
    FROM user_goals
    WHERE user_id = v_quest.receiver_id
      AND week_start_date = p_week_start_date;

    -- Update the quest with current completion counts
    UPDATE arena_quests
    SET
      sender_completions = v_sender_total,
      receiver_completions = v_receiver_total,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_quest.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Update the existing log_goal_completion function to include battle tracking
-- This extends the existing function (which returns jsonb) to also track battle completions
CREATE OR REPLACE FUNCTION public.log_goal_completion(user_uuid UUID)
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

    -- Check for battle completions (NEW - track battle progress)
    PERFORM check_battle_completion(user_uuid, current_week_start);

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

-- 5. Function to resolve battles at week end
CREATE OR REPLACE FUNCTION check_battle_completion_at_week_end()
RETURNS VOID AS $$
DECLARE
  v_quest RECORD;
  v_sender_total INTEGER;
  v_receiver_total INTEGER;
  v_sender_name TEXT;
  v_receiver_name TEXT;
BEGIN
  -- Find all active battles where the week has ended (7 days have passed)
  FOR v_quest IN
    SELECT
      aq.*,
      sender_prof.full_name AS sender_name,
      receiver_prof.full_name AS receiver_name
    FROM arena_quests aq
    JOIN profiles sender_prof ON sender_prof.id = aq.sender_id
    JOIN profiles receiver_prof ON receiver_prof.id = aq.receiver_id
    WHERE aq.quest_type = 'battle'
      AND aq.status = 'accepted'
      AND aq.battle_status = 'active'
      AND aq.week_start_date IS NOT NULL
      AND CURRENT_TIMESTAMP >= (aq.week_start_date + INTERVAL '7 days')
  LOOP
    v_sender_name := COALESCE(v_quest.sender_name, 'Unknown');
    v_receiver_name := COALESCE(v_quest.receiver_name, 'Unknown');

    -- Get final completion counts
    v_sender_total := COALESCE(v_quest.sender_completions, 0);
    v_receiver_total := COALESCE(v_quest.receiver_completions, 0);

    -- Determine winner and award/deduct mojo
    IF v_sender_total > v_receiver_total THEN
      -- Sender wins
      UPDATE arena_quests
      SET
        battle_status = 'completed_sender_won',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_quest.id;

      -- Award 20 mojo to sender
      UPDATE user_statistics
      SET mojo = mojo + 20
      WHERE user_id = v_quest.sender_id;

      -- Deduct 5 mojo from receiver
      UPDATE user_statistics
      SET mojo = GREATEST(0, mojo - 5)
      WHERE user_id = v_quest.receiver_id;

      -- Create notifications
      INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change, quest_id)
      VALUES
        (v_quest.sender_id, 'battle_won', 'Battle Victory! �',
         'You defeated ' || v_receiver_name || ' in battle! (' || v_sender_total || ' vs ' || v_receiver_total || ' completions)',
         20, v_quest.id),
        (v_quest.receiver_id, 'battle_lost', 'Battle Defeat',
         v_sender_name || ' defeated you in battle. (' || v_sender_total || ' vs ' || v_receiver_total || ' completions)',
         -5, v_quest.id);

    ELSIF v_receiver_total > v_sender_total THEN
      -- Receiver wins
      UPDATE arena_quests
      SET
        battle_status = 'completed_receiver_won',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_quest.id;

      -- Award 20 mojo to receiver
      UPDATE user_statistics
      SET mojo = mojo + 20
      WHERE user_id = v_quest.receiver_id;

      -- Deduct 5 mojo from sender
      UPDATE user_statistics
      SET mojo = GREATEST(0, mojo - 5)
      WHERE user_id = v_quest.sender_id;

      -- Create notifications
      INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change, quest_id)
      VALUES
        (v_quest.receiver_id, 'battle_won', 'Battle Victory! �',
         'You defeated ' || v_sender_name || ' in battle! (' || v_receiver_total || ' vs ' || v_sender_total || ' completions)',
         20, v_quest.id),
        (v_quest.sender_id, 'battle_lost', 'Battle Defeat',
         v_receiver_name || ' defeated you in battle. (' || v_receiver_total || ' vs ' || v_sender_total || ' completions)',
         -5, v_quest.id);

    ELSE
      -- Tie
      UPDATE arena_quests
      SET
        battle_status = 'completed_tie',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = v_quest.id;

      -- No mojo changes

      -- Create notifications
      INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change, quest_id)
      VALUES
        (v_quest.sender_id, 'battle_tie', 'Battle Ended in a Tie �',
         'Your battle with ' || v_receiver_name || ' ended in a draw. (' || v_sender_total || ' completions each)',
         0, v_quest.id),
        (v_quest.receiver_id, 'battle_tie', 'Battle Ended in a Tie �',
         'Your battle with ' || v_sender_name || ' ended in a draw. (' || v_receiver_total || ' completions each)',
         0, v_quest.id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Add comment explaining when to call the resolution function
COMMENT ON FUNCTION check_battle_completion_at_week_end() IS
'Call this function via a scheduled job (e.g., pg_cron) at the start of each week to resolve all active battles from the previous week. Example: SELECT cron.schedule(''resolve-battles'', ''0 0 * * 1'', $$SELECT check_battle_completion_at_week_end()$$);';
