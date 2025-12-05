-- Add alliance tracking fields to arena_quests table
-- Track the week_start_date and completion states for both users

ALTER TABLE arena_quests
ADD COLUMN IF NOT EXISTS week_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sender_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS receiver_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS alliance_status TEXT CHECK (alliance_status IN ('active', 'completed_success', 'completed_failure', 'expired'));

-- Create index for efficient alliance queries
CREATE INDEX IF NOT EXISTS idx_arena_quests_alliance_active ON arena_quests(quest_type, status, alliance_status) WHERE quest_type = 'alliance';

-- Create notifications table to track pending notifications for users
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('alliance_success', 'alliance_failure')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  mojo_change INTEGER NOT NULL, -- Positive for bonus, negative for penalty
  quest_id UUID REFERENCES arena_quests(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS on notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON user_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
  ON user_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to set week_start_date when alliance is accepted
CREATE OR REPLACE FUNCTION set_alliance_week_start()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set week_start_date for alliance quests when they are accepted
  IF NEW.quest_type = 'alliance' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    NEW.week_start_date := date_trunc('week', NOW());
    NEW.alliance_status := 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set week_start_date
CREATE TRIGGER trigger_set_alliance_week_start
  BEFORE UPDATE ON arena_quests
  FOR EACH ROW
  EXECUTE FUNCTION set_alliance_week_start();

-- Function to check alliance completion when a user completes their weekly goal
CREATE OR REPLACE FUNCTION check_alliance_completion(
  p_user_id UUID,
  p_week_start_date TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
  v_alliance RECORD;
  v_other_user_id UUID;
  v_other_user_completed BOOLEAN;
  v_is_sender BOOLEAN;
BEGIN
  -- Find active alliance quests for this user in the current week
  FOR v_alliance IN
    SELECT *
    FROM arena_quests
    WHERE quest_type = 'alliance'
      AND status = 'accepted'
      AND alliance_status = 'active'
      AND week_start_date = p_week_start_date
      AND (sender_id = p_user_id OR receiver_id = p_user_id)
  LOOP
    -- Determine if user is sender or receiver
    v_is_sender := v_alliance.sender_id = p_user_id;

    -- Update the appropriate completion flag
    IF v_is_sender THEN
      UPDATE arena_quests
      SET sender_completed = TRUE
      WHERE id = v_alliance.id;

      v_other_user_id := v_alliance.receiver_id;
      v_other_user_completed := v_alliance.receiver_completed;
    ELSE
      UPDATE arena_quests
      SET receiver_completed = TRUE
      WHERE id = v_alliance.id;

      v_other_user_id := v_alliance.sender_id;
      v_other_user_completed := v_alliance.sender_completed;
    END IF;

    -- If both users have completed, create success notifications
    IF v_other_user_completed THEN
      -- Mark alliance as successfully completed
      UPDATE arena_quests
      SET alliance_status = 'completed_success'
      WHERE id = v_alliance.id;

      -- Create success notification for current user (shown immediately after goal completion alert)
      INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change, quest_id)
      VALUES (
        p_user_id,
        'alliance_success',
        'Alliance Victory!',
        'You and your alliance mate both honoured your goals! You each receive 10 bonus mojo!',
        10,
        v_alliance.id
      );

      -- Create success notification for the other user (shown on next login)
      INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change, quest_id)
      VALUES (
        v_other_user_id,
        'alliance_success',
        'Alliance Victory!',
        'You and your alliance mate both honoured your goals! You each receive 10 bonus mojo!',
        10,
        v_alliance.id
      );

      -- Award mojo to both users
      UPDATE user_statistics
      SET mojo = mojo + 10
      WHERE user_id IN (p_user_id, v_other_user_id);
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for failed alliances at week end
CREATE OR REPLACE FUNCTION check_alliance_failures()
RETURNS VOID AS $$
DECLARE
  v_alliance RECORD;
  v_last_week_start TIMESTAMPTZ;
BEGIN
  -- Get last week's start date
  v_last_week_start := date_trunc('week', NOW() - INTERVAL '1 week');

  -- Find all active alliances from last week where at least one user didn't complete
  FOR v_alliance IN
    SELECT *
    FROM arena_quests
    WHERE quest_type = 'alliance'
      AND status = 'accepted'
      AND alliance_status = 'active'
      AND week_start_date = v_last_week_start
      AND (sender_completed = FALSE OR receiver_completed = FALSE)
  LOOP
    -- Mark alliance as failed
    UPDATE arena_quests
    SET alliance_status = 'completed_failure'
    WHERE id = v_alliance.id;

    -- Create failure notification for sender
    INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change, quest_id)
    VALUES (
      v_alliance.sender_id,
      'alliance_failure',
      'Alliance Broken',
      'The alliance was not honoured. You both lose 10 mojo for shaming the alliance.',
      -10,
      v_alliance.id
    );

    -- Create failure notification for receiver
    INSERT INTO user_notifications (user_id, notification_type, title, message, mojo_change, quest_id)
    VALUES (
      v_alliance.receiver_id,
      'alliance_failure',
      'Alliance Broken',
      'The alliance was not honoured. You both lose 10 mojo for shaming the alliance.',
      -10,
      v_alliance.id
    );

    -- Deduct mojo from both users
    UPDATE user_statistics
    SET mojo = GREATEST(mojo - 10, 0) -- Don't go below 0
    WHERE user_id IN (v_alliance.sender_id, v_alliance.receiver_id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_alliance_completion(UUID, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION check_alliance_failures() TO authenticated;
