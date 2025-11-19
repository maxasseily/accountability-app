-- Add Speculation quest type
-- Speculation allows users to create custom bets on non-goal activities
-- Requirements:
-- - Custom description (text)
-- - Odds set by creator
-- - Mojo stake (can't exceed available mojo)
-- - Creator chooses which side of the bet they're on
-- - Only one person can accept the speculation
-- - A third party must resolve/approve the result
-- - Requires at least 3 people in the group

-- First, update the quest_type check constraint to include 'speculation'
ALTER TABLE arena_quests DROP CONSTRAINT IF EXISTS arena_quests_quest_type_check;
ALTER TABLE arena_quests ADD CONSTRAINT arena_quests_quest_type_check
  CHECK (quest_type IN ('alliance', 'battle', 'prophecy', 'curse', 'speculation'));

-- Add new columns for speculation quests
ALTER TABLE arena_quests
  ADD COLUMN IF NOT EXISTS speculation_description TEXT,
  ADD COLUMN IF NOT EXISTS speculation_creator_side BOOLEAN, -- true = creator bets FOR the description, false = creator bets AGAINST
  ADD COLUMN IF NOT EXISTS speculation_accepter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS speculation_resolver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS speculation_result BOOLEAN; -- true = description happened (FOR side wins), false = description didn't happen (AGAINST side wins)

-- Add comments to explain the fields
COMMENT ON COLUMN arena_quests.speculation_description IS 'Custom bet description (e.g., "Bob cant finish his drink in less than 3 seconds")';
COMMENT ON COLUMN arena_quests.speculation_creator_side IS 'True if creator bets FOR the description happening, false if betting AGAINST';
COMMENT ON COLUMN arena_quests.speculation_accepter_id IS 'User who accepted the speculation bet (only one can accept)';
COMMENT ON COLUMN arena_quests.speculation_resolver_id IS 'Third party user who resolved/approved the speculation result';
COMMENT ON COLUMN arena_quests.speculation_result IS 'True if description happened (FOR wins), false if it didnt (AGAINST wins)';

-- Add new status for speculation resolution
ALTER TABLE arena_quests DROP CONSTRAINT IF EXISTS arena_quests_status_check;
ALTER TABLE arena_quests ADD CONSTRAINT arena_quests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'resolved'));

-- Create function to create a speculation quest
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_speculation_quest(UUID, TEXT, BOOLEAN, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;

-- Create function to accept a speculation quest
CREATE OR REPLACE FUNCTION accept_speculation_quest(
  p_quest_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quest_mojo_stake DOUBLE PRECISION;
  v_accepter_mojo DOUBLE PRECISION;
  v_sender_id UUID;
BEGIN
  -- Get quest details
  SELECT sender_id, mojo_stake INTO v_sender_id, v_quest_mojo_stake
  FROM arena_quests
  WHERE id = p_quest_id
    AND quest_type = 'speculation'
    AND status = 'pending'
    AND speculation_accepter_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Speculation quest not found or already accepted';
  END IF;

  -- Prevent creator from accepting their own speculation
  IF v_sender_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot accept your own speculation';
  END IF;

  -- Check accepter has enough mojo to match the stake
  SELECT mojo INTO v_accepter_mojo
  FROM user_statistics
  WHERE user_id = auth.uid();

  IF v_accepter_mojo IS NULL THEN
    RAISE EXCEPTION 'Accepter statistics not found';
  END IF;

  IF v_accepter_mojo < v_quest_mojo_stake THEN
    RAISE EXCEPTION 'Insufficient mojo to accept: you have % but need %', v_accepter_mojo, v_quest_mojo_stake;
  END IF;

  -- Update quest to accepted status
  UPDATE arena_quests
  SET status = 'accepted',
      speculation_accepter_id = auth.uid(),
      receiver_id = auth.uid(), -- Set receiver to accepter for consistency
      updated_at = NOW()
  WHERE id = p_quest_id;

  -- Deduct mojo from accepter
  UPDATE user_statistics
  SET mojo = mojo - v_quest_mojo_stake,
      updated_at = NOW()
  WHERE user_id = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION accept_speculation_quest(UUID) TO authenticated;

-- Create function to resolve a speculation quest (by a third party)
CREATE OR REPLACE FUNCTION resolve_speculation_quest(
  p_quest_id UUID,
  p_result BOOLEAN -- true = description happened (FOR wins), false = didn't happen (AGAINST wins)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quest RECORD;
  v_winner_id UUID;
  v_loser_id UUID;
  v_total_pot DOUBLE PRECISION;
BEGIN
  -- Get quest details
  SELECT
    sender_id,
    speculation_accepter_id,
    speculation_creator_side,
    mojo_stake,
    potential_payout,
    group_id
  INTO v_quest
  FROM arena_quests
  WHERE id = p_quest_id
    AND quest_type = 'speculation'
    AND status = 'accepted'
    AND speculation_accepter_id IS NOT NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Speculation quest not found or not in accepted state';
  END IF;

  -- Ensure resolver is not one of the participants
  IF auth.uid() = v_quest.sender_id OR auth.uid() = v_quest.speculation_accepter_id THEN
    RAISE EXCEPTION 'Participants cannot resolve their own speculation';
  END IF;

  -- Ensure resolver is in the same group
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_quest.group_id
      AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You must be in the group to resolve this speculation';
  END IF;

  -- Determine winner based on result and which side the creator took
  -- If result matches creator's side, creator wins; otherwise accepter wins
  IF (p_result = v_quest.speculation_creator_side) THEN
    v_winner_id := v_quest.sender_id;
    v_loser_id := v_quest.speculation_accepter_id;
  ELSE
    v_winner_id := v_quest.speculation_accepter_id;
    v_loser_id := v_quest.sender_id;
  END IF;

  -- Calculate total pot (both stakes)
  v_total_pot := v_quest.mojo_stake * 2;

  -- Award the total pot to the winner
  UPDATE user_statistics
  SET mojo = mojo + v_total_pot,
      updated_at = NOW()
  WHERE user_id = v_winner_id;

  -- Update quest status to resolved
  UPDATE arena_quests
  SET status = 'resolved',
      speculation_result = p_result,
      speculation_resolver_id = auth.uid(),
      updated_at = NOW()
  WHERE id = p_quest_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION resolve_speculation_quest(UUID, BOOLEAN) TO authenticated;

-- Create index for faster speculation queries
CREATE INDEX IF NOT EXISTS idx_arena_quests_speculation_accepter ON arena_quests(speculation_accepter_id) WHERE quest_type = 'speculation';
CREATE INDEX IF NOT EXISTS idx_arena_quests_speculation_pending ON arena_quests(group_id, quest_type, status) WHERE quest_type = 'speculation' AND status = 'pending';

-- Comment explaining speculation feature
COMMENT ON CONSTRAINT arena_quests_quest_type_check ON arena_quests IS 'Quest types: alliance (mutual support), battle (competition), prophecy (bet on success), curse (bet on failure), speculation (custom bets)';
