-- =====================================================================
-- WEEKLY CREDIBILITY RESOLUTION
-- =====================================================================
-- This migration creates a function to apply weekly credibility bonuses
-- or penalties every Monday at 4am UTC based on goal completion.
--
-- Bonus: +4 credibility if all goals completed (current_progress >= frequency)
-- Penalty: -2 * n_goals_missed if goals not completed
--
-- SCHEDULE THIS WITH GITHUB ACTIONS:
-- See .github/workflows/weekly-credibility-resolution.yml
-- Runs Monday 4am UTC: cron: '0 4 * * 1'
-- =====================================================================

CREATE OR REPLACE FUNCTION apply_weekly_credibility_resolution()
RETURNS TABLE(
  users_processed INTEGER,
  bonuses_applied INTEGER,
  penalties_applied INTEGER
) AS $$
DECLARE
  v_user RECORD;
  v_last_week_start TIMESTAMPTZ;
  v_current_week_start TIMESTAMPTZ;
  v_credibility_change INTEGER;
  v_users_count INTEGER := 0;
  v_bonus_count INTEGER := 0;
  v_penalty_count INTEGER := 0;
  v_goals_missed INTEGER;
BEGIN
  -- Calculate last week's window
  -- date_trunc('week', timestamp) returns Monday 00:00:00 UTC
  v_current_week_start := date_trunc('week', NOW());
  v_last_week_start := v_current_week_start - INTERVAL '1 week';

  -- Process all users who had active goals last week
  FOR v_user IN
    SELECT
      ug.user_id,
      ug.frequency,
      ug.current_progress,
      ug.week_start_date,
      us.credibility AS current_credibility,
      prof.full_name AS user_name
    FROM user_goals ug
    JOIN user_statistics us ON us.user_id = ug.user_id
    LEFT JOIN profiles prof ON prof.id = ug.user_id
    WHERE ug.week_start_date = v_last_week_start
  LOOP
    v_users_count := v_users_count + 1;

    -- Check if user completed their weekly goal
    IF v_user.current_progress >= v_user.frequency THEN
      -- BONUS: User completed all goals
      v_credibility_change := calculate_completion_bonus();
      v_bonus_count := v_bonus_count + 1;

      -- Apply bonus (no floor needed for positive value)
      UPDATE user_statistics
      SET
        credibility = credibility + v_credibility_change,
        updated_at = NOW()
      WHERE user_id = v_user.user_id;

      -- Create notification
      INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change)
      VALUES (
        v_user.user_id,
        'weekly_bonus',
        'Weekly Goal Completed! 🎯',
        format('You completed all %s goals this week! +%s credibility bonus.', v_user.frequency, v_credibility_change),
        0  -- No mojo change, just credibility
      );

    ELSE
      -- PENALTY: User missed some goals
      v_goals_missed := v_user.frequency - v_user.current_progress;
      v_credibility_change := calculate_failure_penalty(v_goals_missed);
      v_penalty_count := v_penalty_count + 1;

      -- Apply penalty (ensure credibility doesn't go below 0)
      UPDATE user_statistics
      SET
        credibility = GREATEST(0, credibility + v_credibility_change),  -- v_credibility_change is negative
        updated_at = NOW()
      WHERE user_id = v_user.user_id;

      -- Create notification
      INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change)
      VALUES (
        v_user.user_id,
        'weekly_penalty',
        'Weekly Goal Incomplete ⚠️',
        format('You missed %s goal(s) this week. %s credibility penalty.', v_goals_missed, v_credibility_change),
        0  -- No mojo change, just credibility
      );
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_users_count, v_bonus_count, v_penalty_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION apply_weekly_credibility_resolution() TO authenticated;

COMMENT ON FUNCTION apply_weekly_credibility_resolution() IS
'Applies weekly credibility bonuses (+4 for completion) or penalties (-2 * n_missed for failure) to all users. Run this function every Monday at 4am UTC via GitHub Actions scheduled workflow. See .github/workflows/weekly-credibility-resolution.yml';

-- Update notification types comment to include new weekly bonus/penalty types
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_notifications'
    AND column_name = 'notification_type'
  ) THEN
    COMMENT ON COLUMN user_notifications.notification_type IS
      'Notification types: alliance_success, alliance_failure, rank_upgrade, rank_demotion, rank_warning, weekly_bonus, weekly_penalty, battle_won, battle_lost, battle_tie, prophecy_won, prophecy_lost, curse_won, curse_lost, speculation_won, speculation_lost';
  END IF;
END $$;
