-- Fix notification ordering by passing acceptance timestamp explicitly
-- The issue: updated_at changes when quest status is updated, so we need to capture it before

-- Update respond_to_arena_quest to pass the quest object (with original timestamp)
CREATE OR REPLACE FUNCTION respond_to_arena_quest(
  p_quest_id UUID,
  p_accept BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_quest arena_quests%ROWTYPE;
  v_acceptance_timestamp TIMESTAMPTZ;
BEGIN
  -- Get quest details BEFORE updating (to capture original timestamp)
  SELECT * INTO v_quest
  FROM arena_quests
  WHERE id = p_quest_id
    AND receiver_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Capture timestamp for acceptance notification (before status update)
  v_acceptance_timestamp := NOW();

  -- Determine new status
  v_status := CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END;

  -- Update quest status (this will change updated_at)
  UPDATE arena_quests
  SET status = v_status
  WHERE id = p_quest_id;

  -- Handle mojo for prophecy/curse
  IF v_quest.quest_type IN ('prophecy', 'curse') THEN
    IF p_accept THEN
      -- Deduct mojo stake from sender and create acceptance notification
      -- Pass the quest data and acceptance timestamp
      PERFORM deduct_mojo_on_quest_acceptance_with_timestamp(p_quest_id, v_acceptance_timestamp);
    ELSE
      -- Mark as refunded (no actual refund needed since mojo wasn't deducted yet)
      PERFORM refund_mojo_on_quest_rejection(p_quest_id);
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new version of deduct_mojo function that accepts timestamp parameter
CREATE OR REPLACE FUNCTION deduct_mojo_on_quest_acceptance_with_timestamp(
  p_quest_id UUID,
  p_acceptance_timestamp TIMESTAMPTZ
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

  -- Create notification for sender with the acceptance timestamp
  -- This ensures it appears before win notification (which will have a later timestamp)
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
    p_acceptance_timestamp
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION respond_to_arena_quest(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_mojo_on_quest_acceptance_with_timestamp(UUID, TIMESTAMPTZ) TO authenticated;
