-- Make prophecies and curses instant (no acceptance required)
-- When User1 creates a prophecy/curse, it is immediately active and mojo is deducted

-- Create new function for instant prophecy/curse creation
CREATE OR REPLACE FUNCTION create_instant_prophecy_curse(
  p_group_id UUID,
  p_receiver_id UUID,
  p_quest_type TEXT,
  p_mojo_stake DOUBLE PRECISION
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
  -- Validate quest type
  IF p_quest_type NOT IN ('prophecy', 'curse') THEN
    RAISE EXCEPTION 'This function only handles prophecy and curse quests';
  END IF;

  -- Validate mojo stake
  IF p_mojo_stake <= 0 THEN
    RAISE EXCEPTION 'Mojo stake must be greater than 0';
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

  -- Get current week start date
  v_week_start_date := DATE_TRUNC('week', NOW());

  -- Insert the quest with status='accepted' (instant activation)
  INSERT INTO arena_quests (
    group_id,
    sender_id,
    receiver_id,
    quest_type,
    status,
    mojo_stake,
    odds,
    potential_payout,
    week_start_date,
    prophecy_curse_status
  )
  VALUES (
    p_group_id,
    auth.uid(),
    p_receiver_id,
    p_quest_type,
    'accepted',  -- Instantly accepted, no waiting
    p_mojo_stake,
    v_odds,
    v_potential_payout,
    v_week_start_date,
    'active'  -- Immediately active
  )
  RETURNING id INTO v_quest_id;

  -- Deduct mojo from sender immediately
  UPDATE user_statistics
  SET mojo = mojo - p_mojo_stake,
      updated_at = NOW()
  WHERE user_id = auth.uid();

  -- No notification needed - user initiated the action

  RETURN v_quest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_instant_prophecy_curse(UUID, UUID, TEXT, DOUBLE PRECISION) TO authenticated;

-- Update the unique constraint to allow multiple accepted prophecy/curse quests
-- but still prevent duplicate pending quests (for alliance/battle)
-- Drop the old constraint
ALTER TABLE arena_quests DROP CONSTRAINT IF EXISTS unique_pending_quest;

-- Add new constraint that only applies to pending status
-- This allows multiple accepted prophecy/curse quests but prevents duplicate pending requests
CREATE UNIQUE INDEX unique_pending_quest_idx
  ON arena_quests (group_id, sender_id, receiver_id, quest_type, status)
  WHERE status = 'pending';

-- Comment explaining the change
COMMENT ON INDEX unique_pending_quest_idx IS 'Prevents duplicate pending quests. Allows multiple accepted prophecy/curse quests since they are created instantly.';
