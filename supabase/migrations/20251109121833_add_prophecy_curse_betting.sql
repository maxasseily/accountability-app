-- Add prophecy/curse betting fields to arena_quests table
ALTER TABLE "public"."arena_quests"
ADD COLUMN "mojo_stake" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "odds" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "potential_payout" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "prophecy_curse_status" TEXT DEFAULT 'active' CHECK (prophecy_curse_status IN ('active', 'won', 'lost', 'refunded')),
ADD COLUMN "resolution_date" TIMESTAMPTZ;

-- Add comment explaining the betting system
COMMENT ON COLUMN "public"."arena_quests"."mojo_stake" IS 'Amount of mojo the sender is betting (only for prophecy/curse)';
COMMENT ON COLUMN "public"."arena_quests"."odds" IS 'Calculated odds: 100/credibility for prophecy, 100/(100-credibility) for curse';
COMMENT ON COLUMN "public"."arena_quests"."potential_payout" IS 'Amount sender will win if they win the bet (mojo_stake * odds)';
COMMENT ON COLUMN "public"."arena_quests"."prophecy_curse_status" IS 'Status of prophecy/curse bet: active (ongoing), won (sender wins), lost (sender loses), refunded (receiver rejected)';
COMMENT ON COLUMN "public"."arena_quests"."resolution_date" IS 'When the prophecy/curse was resolved (week end)';

-- Function to calculate odds based on credibility and quest type
CREATE OR REPLACE FUNCTION calculate_quest_odds(
  p_quest_type TEXT,
  p_receiver_credibility INTEGER
) RETURNS DOUBLE PRECISION AS $$
BEGIN
  -- Prophecy: betting receiver will succeed (higher credibility = lower odds)
  IF p_quest_type = 'prophecy' THEN
    -- Prevent division by zero and handle edge cases
    IF p_receiver_credibility <= 0 THEN
      RETURN 100.0; -- Maximum odds for zero credibility
    ELSIF p_receiver_credibility >= 100 THEN
      RETURN 1.0; -- Minimum odds for perfect credibility
    ELSE
      RETURN 100.0 / p_receiver_credibility;
    END IF;

  -- Curse: betting receiver will fail (higher credibility = higher odds needed)
  ELSIF p_quest_type = 'curse' THEN
    -- Prevent division by zero and handle edge cases
    IF p_receiver_credibility >= 100 THEN
      RETURN 100.0; -- Maximum odds for perfect credibility (very unlikely to fail)
    ELSIF p_receiver_credibility <= 0 THEN
      RETURN 1.0; -- Minimum odds for zero credibility (very likely to fail)
    ELSE
      RETURN 100.0 / (100.0 - p_receiver_credibility);
    END IF;

  ELSE
    -- For alliance/battle, no odds
    RETURN 0.0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to deduct mojo stake when quest is accepted
CREATE OR REPLACE FUNCTION deduct_mojo_on_quest_acceptance(
  p_quest_id UUID
) RETURNS VOID AS $$
DECLARE
  v_quest arena_quests%ROWTYPE;
  v_sender_mojo DOUBLE PRECISION;
BEGIN
  -- Get quest details
  SELECT * INTO v_quest
  FROM arena_quests
  WHERE id = p_quest_id;

  -- Only process prophecy/curse quests with stakes
  IF v_quest.quest_type NOT IN ('prophecy', 'curse') OR v_quest.mojo_stake <= 0 THEN
    RETURN;
  END IF;

  -- Check sender has enough mojo
  SELECT mojo INTO v_sender_mojo
  FROM user_statistics
  WHERE user_id = v_quest.sender_id;

  IF v_sender_mojo < v_quest.mojo_stake THEN
    RAISE EXCEPTION 'Insufficient mojo: user has % but needs %', v_sender_mojo, v_quest.mojo_stake;
  END IF;

  -- Deduct mojo from sender
  UPDATE user_statistics
  SET mojo = mojo - v_quest.mojo_stake,
      updated_at = NOW()
  WHERE user_id = v_quest.sender_id;

  -- Create notification for sender
  INSERT INTO user_notifications (
    user_id,
    notification_type,
    title,
    message,
    mojo_change,
    quest_id,
    created_at
  ) VALUES (
    v_quest.sender_id,
    CASE
      WHEN v_quest.quest_type = 'prophecy' THEN 'prophecy_accepted'
      WHEN v_quest.quest_type = 'curse' THEN 'curse_accepted'
    END,
    CASE
      WHEN v_quest.quest_type = 'prophecy' THEN 'Prophecy Accepted!'
      WHEN v_quest.quest_type = 'curse' THEN 'Curse Accepted!'
    END,
    'Your bet of ' || v_quest.mojo_stake || ' mojo has been placed. Potential payout: ' || ROUND(v_quest.potential_payout) || ' mojo.',
    -v_quest.mojo_stake,
    p_quest_id,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to refund mojo stake when quest is rejected
CREATE OR REPLACE FUNCTION refund_mojo_on_quest_rejection(
  p_quest_id UUID
) RETURNS VOID AS $$
DECLARE
  v_quest arena_quests%ROWTYPE;
BEGIN
  -- Get quest details
  SELECT * INTO v_quest
  FROM arena_quests
  WHERE id = p_quest_id;

  -- Only process prophecy/curse quests with stakes
  IF v_quest.quest_type NOT IN ('prophecy', 'curse') OR v_quest.mojo_stake <= 0 THEN
    RETURN;
  END IF;

  -- Refund mojo to sender (if it was previously deducted - this handles the case where rejection happens before acceptance)
  -- For now, we'll just mark as refunded and not actually refund since mojo is deducted on acceptance
  UPDATE arena_quests
  SET prophecy_curse_status = 'refunded',
      updated_at = NOW()
  WHERE id = p_quest_id;

  -- Note: We don't refund here because mojo is only deducted on acceptance, not on request creation
  -- If the quest is rejected, the mojo was never deducted in the first place
END;
$$ LANGUAGE plpgsql;

-- Function to check prophecy/curse completion at week end
CREATE OR REPLACE FUNCTION check_prophecy_curse_completion()
RETURNS void AS $$
DECLARE
  v_quest RECORD;
  v_receiver_goal RECORD;
  v_week_end_date TIMESTAMPTZ;
  v_sender_won BOOLEAN;
BEGIN
  -- Calculate the end of last week (Sunday 23:59:59)
  v_week_end_date := DATE_TRUNC('week', NOW()) - INTERVAL '1 second';

  -- Find all active prophecy/curse quests that haven't been resolved
  FOR v_quest IN
    SELECT
      aq.*,
      us.full_name as receiver_name
    FROM arena_quests aq
    LEFT JOIN profiles us ON us.id = aq.receiver_id
    WHERE aq.quest_type IN ('prophecy', 'curse')
      AND aq.status = 'accepted'
      AND aq.prophecy_curse_status = 'active'
      AND aq.week_start_date IS NOT NULL
      AND aq.week_start_date < v_week_end_date
  LOOP
    -- Get receiver's goal for that week
    SELECT
      current_progress >= frequency as goal_completed
    INTO v_receiver_goal
    FROM user_goals
    WHERE user_id = v_quest.receiver_id
      AND week_start_date = v_quest.week_start_date;

    -- If no goal found, skip this quest
    IF v_receiver_goal IS NULL THEN
      CONTINUE;
    END IF;

    -- Determine if sender won the bet
    IF v_quest.quest_type = 'prophecy' THEN
      -- Prophecy: sender wins if receiver completed their goal
      v_sender_won := v_receiver_goal.goal_completed;
    ELSE
      -- Curse: sender wins if receiver failed their goal
      v_sender_won := NOT v_receiver_goal.goal_completed;
    END IF;

    -- Update quest status
    UPDATE arena_quests
    SET
      prophecy_curse_status = CASE WHEN v_sender_won THEN 'won' ELSE 'lost' END,
      resolution_date = v_week_end_date,
      updated_at = NOW()
    WHERE id = v_quest.id;

    -- Handle outcome
    IF v_sender_won THEN
      -- Sender wins: award payout
      UPDATE user_statistics
      SET mojo = mojo + v_quest.potential_payout,
          updated_at = NOW()
      WHERE user_id = v_quest.sender_id;

      -- Create win notification
      INSERT INTO user_notifications (
        user_id,
        notification_type,
        title,
        message,
        mojo_change,
        quest_id,
        created_at
      ) VALUES (
        v_quest.sender_id,
        CASE
          WHEN v_quest.quest_type = 'prophecy' THEN 'prophecy_won'
          WHEN v_quest.quest_type = 'curse' THEN 'curse_won'
        END,
        CASE
          WHEN v_quest.quest_type = 'prophecy' THEN 'Prophecy Fulfilled!'
          WHEN v_quest.quest_type = 'curse' THEN 'Curse Succeeded!'
        END,
        CASE
          WHEN v_quest.quest_type = 'prophecy' THEN
            'Your prophecy about ' || v_quest.receiver_name || ' came true! You won ' || ROUND(v_quest.potential_payout) || ' mojo!'
          WHEN v_quest.quest_type = 'curse' THEN
            'Your curse on ' || v_quest.receiver_name || ' worked! You won ' || ROUND(v_quest.potential_payout) || ' mojo!'
        END,
        v_quest.potential_payout,
        v_quest.id,
        NOW()
      );
    ELSE
      -- Sender loses: stake was already deducted, just notify
      INSERT INTO user_notifications (
        user_id,
        notification_type,
        title,
        message,
        mojo_change,
        quest_id,
        created_at
      ) VALUES (
        v_quest.sender_id,
        CASE
          WHEN v_quest.quest_type = 'prophecy' THEN 'prophecy_lost'
          WHEN v_quest.quest_type = 'curse' THEN 'curse_lost'
        END,
        CASE
          WHEN v_quest.quest_type = 'prophecy' THEN 'Prophecy Failed'
          WHEN v_quest.quest_type = 'curse' THEN 'Curse Failed'
        END,
        CASE
          WHEN v_quest.quest_type = 'prophecy' THEN
            'Your prophecy about ' || v_quest.receiver_name || ' did not come true. You lost ' || ROUND(v_quest.mojo_stake) || ' mojo.'
          WHEN v_quest.quest_type = 'curse' THEN
            'Your curse on ' || v_quest.receiver_name || ' failed. You lost ' || ROUND(v_quest.mojo_stake) || ' mojo.'
        END,
        0, -- No mojo change (already deducted)
        v_quest.id,
        NOW()
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_quest_odds TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_mojo_on_quest_acceptance TO authenticated;
GRANT EXECUTE ON FUNCTION refund_mojo_on_quest_rejection TO authenticated;
GRANT EXECUTE ON FUNCTION check_prophecy_curse_completion TO authenticated;
