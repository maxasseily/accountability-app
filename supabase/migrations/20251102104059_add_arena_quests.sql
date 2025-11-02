-- Create arena_quests table to store all quest interactions between group members
CREATE TABLE IF NOT EXISTS arena_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_type TEXT NOT NULL CHECK (quest_type IN ('alliance', 'battle', 'prophecy', 'curse')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate pending quests of the same type between two users
  CONSTRAINT unique_pending_quest UNIQUE (group_id, sender_id, receiver_id, quest_type, status)
);

-- Create indexes for faster queries
CREATE INDEX idx_arena_quests_group_id ON arena_quests(group_id);
CREATE INDEX idx_arena_quests_sender_id ON arena_quests(sender_id);
CREATE INDEX idx_arena_quests_receiver_id ON arena_quests(receiver_id);
CREATE INDEX idx_arena_quests_status ON arena_quests(status);

-- Enable RLS
ALTER TABLE arena_quests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view quests in their groups
CREATE POLICY "Users can view quests in their groups"
  ON arena_quests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = arena_quests.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- Policy: Users can create quests to other members in their groups
CREATE POLICY "Users can create quests to group members"
  ON arena_quests
  FOR INSERT
  WITH CHECK (
    -- Sender must be the authenticated user
    sender_id = auth.uid()
    AND
    -- Both sender and receiver must be in the same group
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = arena_quests.sender_id
        AND gm2.user_id = arena_quests.receiver_id
        AND gm1.group_id = arena_quests.group_id
    )
  );

-- Policy: Receivers can update quest status (accept/reject)
CREATE POLICY "Receivers can update quest status"
  ON arena_quests
  FOR UPDATE
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_arena_quests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_arena_quests_updated_at
  BEFORE UPDATE ON arena_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_arena_quests_updated_at();

-- Function to send arena quest request
CREATE OR REPLACE FUNCTION send_arena_quest_request(
  p_group_id UUID,
  p_receiver_id UUID,
  p_quest_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_quest_id UUID;
BEGIN
  -- Insert the quest request
  INSERT INTO arena_quests (group_id, sender_id, receiver_id, quest_type, status)
  VALUES (p_group_id, auth.uid(), p_receiver_id, p_quest_type, 'pending')
  RETURNING id INTO v_quest_id;

  RETURN v_quest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to arena quest request
CREATE OR REPLACE FUNCTION respond_to_arena_quest(
  p_quest_id UUID,
  p_accept BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
BEGIN
  v_status := CASE WHEN p_accept THEN 'accepted' ELSE 'rejected' END;

  UPDATE arena_quests
  SET status = v_status
  WHERE id = p_quest_id
    AND receiver_id = auth.uid()
    AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
