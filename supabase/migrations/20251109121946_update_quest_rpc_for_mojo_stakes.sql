-- Update send_arena_quest_request to handle mojo stakes for prophecy/curse
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

    -- Calculate potential payout (rounded to whole number)
    v_potential_payout := ROUND(p_mojo_stake * v_odds);
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

-- Update respond_to_arena_quest to handle mojo deduction/refund
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
      -- Deduct mojo stake from sender
      PERFORM deduct_mojo_on_quest_acceptance(p_quest_id);
    ELSE
      -- Mark as refunded (no actual refund needed since mojo wasn't deducted yet)
      PERFORM refund_mojo_on_quest_rejection(p_quest_id);
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions (specify function signature for overloaded functions)
GRANT EXECUTE ON FUNCTION send_arena_quest_request(UUID, UUID, TEXT, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_arena_quest(UUID, BOOLEAN) TO authenticated;
