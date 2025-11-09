-- Fix 1: Update potential_payout calculation to include stake (so 1:1 odds = 2x total)
-- Currently: payout = stake * odds (so 1:1 gives you 1x, net 0 after stake deduction)
-- Fixed: payout = stake * (1 + odds) (so 1:1 gives you 2x, net +1x after stake deduction)

CREATE OR REPLACE FUNCTION send_arena_quest_request(
  p_group_id UUID,
  p_receiver_id UUID,
  p_quest_type TEXT,
  p_mojo_stake DOUBLE PRECISION DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_quest_id UUID;
  v_sender_mojo DOUBLE PRECISION;
  v_receiver_credibility INTEGER;
  v_odds DOUBLE PRECISION;
  v_potential_payout DOUBLE PRECISION;
  v_week_start_date TIMESTAMPTZ;
BEGIN
  -- Validate mojo stake for prophecy/curse
  IF p_quest_type IN ('prophecy', 'curse') AND p_mojo_stake > 0 THEN
    -- Check sender has enough mojo
    SELECT mojo INTO v_sender_mojo
    FROM user_statistics
    WHERE user_id = auth.uid();

    IF v_sender_mojo IS NULL THEN
      RAISE EXCEPTION 'Sender statistics not found';
    END IF;

    IF v_sender_mojo < p_mojo_stake THEN
      RAISE EXCEPTION 'Insufficient mojo: you have % but are trying to bet %', v_sender_mojo, p_mojo_stake;
    END IF;

    -- Get receiver's credibility
    SELECT credibility INTO v_receiver_credibility
    FROM user_statistics
    WHERE user_id = p_receiver_id;

    IF v_receiver_credibility IS NULL THEN
      RAISE EXCEPTION 'Receiver statistics not found';
    END IF;

    -- Calculate odds
    v_odds := calculate_quest_odds(p_quest_type, v_receiver_credibility);

    -- Calculate potential payout: stake * (1 + odds) to include stake return
    -- This makes 1:1 odds = 2x total (stake back + stake winnings)
    v_potential_payout := ROUND(p_mojo_stake * (1 + v_odds));
  ELSE
    -- For alliance/battle or zero stake, set defaults
    v_odds := 0;
    v_potential_payout := 0;
  END IF;

  -- Get current week start date
  v_week_start_date := DATE_TRUNC('week', NOW());

  -- Insert the quest request
  INSERT INTO arena_quests (
    group_id,
    sender_id,
    receiver_id,
    quest_type,
    status,
    mojo_stake,
    odds,
    potential_payout,
    week_start_date
  )
  VALUES (
    p_group_id,
    auth.uid(),
    p_receiver_id,
    p_quest_type,
    'pending',
    COALESCE(p_mojo_stake, 0),
    v_odds,
    v_potential_payout,
    v_week_start_date
  )
  RETURNING id INTO v_quest_id;

  RETURN v_quest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Update respond_to_arena_quest to add timestamp delay for acceptance notification
-- This ensures acceptance notification appears before win notification (which happens on goal completion)
CREATE OR REPLACE FUNCTION respond_to_arena_quest(
  p_quest_id UUID,
  p_accept BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_quest arena_quests%ROWTYPE;
BEGIN
  -- Get quest details
  SELECT * INTO v_quest
  FROM arena_quests
  WHERE id = p_quest_id
    AND receiver_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Determine new status
  v_status := CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END;

  -- Update quest status
  UPDATE arena_quests
  SET status = v_status
  WHERE id = p_quest_id;

  -- Handle mojo for prophecy/curse
  IF v_quest.quest_type IN ('prophecy', 'curse') THEN
    IF p_accept THEN
      -- Deduct mojo stake from sender and create acceptance notification
      -- We create the notification with a timestamp slightly in the past
      -- to ensure it appears before any win notification (which will have NOW() timestamp)
      PERFORM deduct_mojo_on_quest_acceptance(p_quest_id);
    ELSE
      -- Mark as refunded (no actual refund needed since mojo wasn't deducted yet)
      PERFORM refund_mojo_on_quest_rejection(p_quest_id);
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update deduct_mojo_on_quest_acceptance to create notification with earlier timestamp
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
  -- Use the quest's updated_at timestamp to ensure it appears before any win notification
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
    v_quest.updated_at
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_arena_quest_request(UUID, UUID, TEXT, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_arena_quest(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_mojo_on_quest_acceptance(UUID) TO authenticated;
