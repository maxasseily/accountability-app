-- ============================================================================
-- Migration: Add Group Chat Messages
-- Description: Creates the messages table and RLS policies for group chat
--              functionality. Messages are associated with groups and users,
--              with full Row Level Security to ensure only group members can
--              view and send messages.
-- ============================================================================

-- Create messages table for group chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient message fetching (sorted by time)
CREATE INDEX messages_group_id_created_at_idx ON public.messages(group_id, created_at DESC);

-- Create index for user's messages
CREATE INDEX messages_user_id_idx ON public.messages(user_id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages from groups they are members of
CREATE POLICY "Users can view messages from their groups"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = messages.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert messages to groups they are members of
CREATE POLICY "Users can send messages to their groups"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.group_id = messages.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update their own messages (for edit functionality)
CREATE POLICY "Users can update their own messages"
  ON public.messages
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before updates
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;

-- Enable Realtime for the messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
