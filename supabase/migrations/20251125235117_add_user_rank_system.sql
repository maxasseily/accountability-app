-- Add user_rank column to user_statistics table
ALTER TABLE user_statistics
ADD COLUMN user_rank INTEGER NOT NULL DEFAULT 1;

-- Add check constraint to ensure rank is between 1 and 8
ALTER TABLE user_statistics
ADD CONSTRAINT user_rank_valid_range CHECK (user_rank >= 1 AND user_rank <= 8);

-- Create index on user_rank for faster queries
CREATE INDEX idx_user_statistics_user_rank ON user_statistics(user_rank);

-- Function to upgrade user rank
CREATE OR REPLACE FUNCTION upgrade_user_rank(
  p_user_id UUID,
  p_new_rank INTEGER
)
RETURNS TABLE(
  success BOOLEAN,
  new_mojo NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  v_current_rank INTEGER;
  v_current_credibility INTEGER;
  v_current_mojo NUMERIC;
  v_required_credibility INTEGER;
  v_mojo_cost NUMERIC;
  v_new_mojo NUMERIC;
BEGIN
  -- Get user's current stats
  SELECT user_rank, credibility, mojo
  INTO v_current_rank, v_current_credibility, v_current_mojo
  FROM user_statistics
  WHERE user_id = p_user_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0::NUMERIC, 'User statistics not found'::TEXT;
    RETURN;
  END IF;

  -- Can only upgrade to next rank (one level at a time)
  IF p_new_rank != v_current_rank + 1 THEN
    RETURN QUERY SELECT FALSE, v_current_mojo, 'Can only upgrade to the next rank'::TEXT;
    RETURN;
  END IF;

  -- Validate rank is in valid range
  IF p_new_rank < 1 OR p_new_rank > 8 THEN
    RETURN QUERY SELECT FALSE, v_current_mojo, 'Invalid rank'::TEXT;
    RETURN;
  END IF;

  -- Define rank requirements (credibility and mojo cost)
  -- Rank 1: Ritual Rookie (0 credibility, 0 mojo)
  -- Rank 2: Padawan Procrastinator (60 credibility, 50 mojo)
  -- Rank 3: Accidental Achiever (120 credibility, 100 mojo)
  -- Rank 4: Bare-Minimum Benchwarmer (240 credibility, 200 mojo)
  -- Rank 5: Half-Send Hero (480 credibility, 400 mojo)
  -- Rank 6: Casual Conqueror (960 credibility, 800 mojo)
  -- Rank 7: Grindset Guru (1920 credibility, 1600 mojo)
  -- Rank 8: Grandmaster General (3840 credibility, 3200 mojo)

  v_required_credibility := CASE p_new_rank
    WHEN 1 THEN 0
    WHEN 2 THEN 60
    WHEN 3 THEN 120
    WHEN 4 THEN 240
    WHEN 5 THEN 480
    WHEN 6 THEN 960
    WHEN 7 THEN 1920
    WHEN 8 THEN 3840
    ELSE 0
  END;

  v_mojo_cost := CASE p_new_rank
    WHEN 1 THEN 0
    WHEN 2 THEN 50
    WHEN 3 THEN 100
    WHEN 4 THEN 200
    WHEN 5 THEN 400
    WHEN 6 THEN 800
    WHEN 7 THEN 1600
    WHEN 8 THEN 3200
    ELSE 0
  END;

  -- Check if user has enough credibility
  IF v_current_credibility < v_required_credibility THEN
    RETURN QUERY SELECT FALSE, v_current_mojo,
      format('Need %s more credibility', v_required_credibility - v_current_credibility)::TEXT;
    RETURN;
  END IF;

  -- Check if user has enough mojo
  IF v_current_mojo < v_mojo_cost THEN
    RETURN QUERY SELECT FALSE, v_current_mojo,
      format('Need %s more mojo', v_mojo_cost - v_current_mojo)::TEXT;
    RETURN;
  END IF;

  -- Deduct mojo and upgrade rank
  v_new_mojo := v_current_mojo - v_mojo_cost;

  UPDATE user_statistics
  SET
    user_rank = p_new_rank,
    mojo = v_new_mojo,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, v_new_mojo, 'Rank upgraded successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and demote user if credibility drops too low
-- This will be called via trigger or manually
CREATE OR REPLACE FUNCTION check_and_demote_rank()
RETURNS TRIGGER AS $$
DECLARE
  v_min_credibility_to_maintain INTEGER;
  v_current_rank INTEGER;
BEGIN
  v_current_rank := NEW.user_rank;

  -- Ritual Rookie (rank 1) can't be demoted
  IF v_current_rank = 1 THEN
    RETURN NEW;
  END IF;

  -- Get minimum credibility for current rank
  v_min_credibility_to_maintain := CASE v_current_rank
    WHEN 2 THEN 60
    WHEN 3 THEN 120
    WHEN 4 THEN 240
    WHEN 5 THEN 480
    WHEN 6 THEN 960
    WHEN 7 THEN 1920
    WHEN 8 THEN 3840
    ELSE 0
  END;

  -- Demote if credibility drops 10 below minimum
  IF NEW.credibility < (v_min_credibility_to_maintain - 10) THEN
    NEW.user_rank := v_current_rank - 1;
    NEW.updated_at := NOW();

    -- Insert notification for demotion
    INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change)
    VALUES (
      NEW.user_id,
      'rank_demotion',
      'Rank Demotion',
      format('Your credibility has dropped too low. You have been demoted from rank %s to rank %s.',
        v_current_rank, NEW.user_rank),
      0
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for demotion on credibility updates
DROP TRIGGER IF EXISTS trigger_check_rank_demotion ON user_statistics;
CREATE TRIGGER trigger_check_rank_demotion
  BEFORE UPDATE OF credibility ON user_statistics
  FOR EACH ROW
  WHEN (OLD.credibility IS DISTINCT FROM NEW.credibility)
  EXECUTE FUNCTION check_and_demote_rank();

-- Add new notification types for rank system
-- First, check if notification_type is a constraint or enum
DO $$
BEGIN
  -- Try to add new notification types
  -- This assumes notification_type might be using a check constraint or no constraint
  -- If there's an enum, this would need to be handled differently

  -- Note: If user_notifications table doesn't exist yet, we'll handle that separately
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notifications') THEN
    -- Add comment about new notification types
    COMMENT ON COLUMN user_notifications.notification_type IS
      'Notification types: alliance_success, alliance_failure, rank_upgrade, rank_demotion, rank_warning';
  END IF;
END $$;
