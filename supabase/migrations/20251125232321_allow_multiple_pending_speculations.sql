-- Allow multiple pending speculation quests per user
-- The original unique_pending_quest_idx prevents users from creating multiple speculations
-- because speculation quests use sender_id as a placeholder for receiver_id
-- This results in duplicate (group_id, sender_id, receiver_id, quest_type, status) entries

-- Drop the existing constraint
DROP INDEX IF EXISTS unique_pending_quest_idx;

-- Recreate the constraint to exclude speculation quests
-- Speculation quests have different uniqueness rules (unlimited pending per user)
CREATE UNIQUE INDEX unique_pending_quest_idx
  ON arena_quests (group_id, sender_id, receiver_id, quest_type, status)
  WHERE status = 'pending' AND quest_type != 'speculation';

-- Update comment to explain the change
COMMENT ON INDEX unique_pending_quest_idx IS 'Prevents duplicate pending quests for alliance, battle, prophecy, and curse. Excludes speculation to allow multiple pending speculation quests per user.';

-- Add a separate constraint for speculation uniqueness if needed in the future
-- Currently, we allow unlimited pending speculations per user (max 3 will be enforced in app logic)
