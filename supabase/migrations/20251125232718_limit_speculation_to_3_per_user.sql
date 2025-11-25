-- Limit users to 3 active (pending or accepted) speculation quests at any time
-- This prevents users from creating too many speculations and cluttering the UI

-- Update the create_speculation_quest function to enforce the limit
CREATE OR REPLACE FUNCTION create_speculation_quest(
  p_group_id UUID,
  p_description TEXT,
  p_creator_side BOOLEAN,
  p_odds DOUBLE PRECISION,
  p_mojo_stake DOUBLE PRECISION
)
RETURNS UUID AS $$
DECLARE
  v_quest_id UUID;
  v_sender_mojo DOUBLE PRECISION;
  v_group_member_count INTEGER;
  v_potential_payout DOUBLE PRECISION;
  v_active_speculation_count INTEGER;
BEGIN
  -- Validate description
  IF p_description IS NULL OR LENGTH(TRIM(p_description)) = 0 THEN
    RAISE EXCEPTION 'Speculation description cannot be empty';
  END IF;

  -- Validate description length (about one long sentence, ~200 characters)
  IF LENGTH(p_description) > 200 THEN
    RAISE EXCEPTION 'Speculation description is too long (max 200 characters)';
  END IF;

  -- Validate odds
  IF p_odds <= 0 THEN
    RAISE EXCEPTION 'Odds must be greater than 0';
  END IF;

  -- Validate mojo stake
  IF p_mojo_stake <= 0 THEN
    RAISE EXCEPTION 'Mojo stake must be greater than 0';
  END IF;

  -- Check group has at least 3 members
  SELECT COUNT(*) INTO v_group_member_count
  FROM group_members
  WHERE group_id = p_group_id;

  IF v_group_member_count < 3 THEN
    RAISE EXCEPTION 'Speculation requires at least 3 group members (current: %)', v_group_member_count;
  END IF;

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

  -- NEW: Check if user already has 3 active speculations (pending or accepted)
  SELECT COUNT(*) INTO v_active_speculation_count
  FROM arena_quests
  WHERE sender_id = auth.uid()
    AND quest_type = 'speculation'
    AND status IN ('pending', 'accepted');

  IF v_active_speculation_count >= 3 THEN
    RAISE EXCEPTION 'You can only have up to 3 active speculation quests at a time (current: %)', v_active_speculation_count;
  END IF;

  -- Calculate potential payout (same formula as prophecy/curse)
  -- Payout includes stake return: stake * (1 + odds)
  v_potential_payout := ROUND(p_mojo_stake * (1 + p_odds));

  -- Insert the speculation quest with status='pending' (waits for acceptance)
  INSERT INTO arena_quests (
    group_id,
    sender_id,
    receiver_id, -- Will be set to accepter when accepted (initially NULL would violate NOT NULL constraint, so we use sender as placeholder)
    quest_type,
    status,
    mojo_stake,
    odds,
    potential_payout,
    speculation_description,
    speculation_creator_side
  )
  VALUES (
    p_group_id,
    auth.uid(),
    auth.uid(), -- Placeholder, will be updated when someone accepts
    'speculation',
    'pending',
    p_mojo_stake,
    p_odds,
    v_potential_payout,
    p_description,
    p_creator_side
  )
  RETURNING id INTO v_quest_id;

  -- Deduct mojo from sender immediately (committed to the bet)
  UPDATE user_statistics
  SET mojo = mojo - p_mojo_stake,
      updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN v_quest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment explaining the 3 speculation limit
COMMENT ON FUNCTION create_speculation_quest IS 'Creates a new speculation quest with a maximum of 3 active (pending or accepted) speculations per user';
