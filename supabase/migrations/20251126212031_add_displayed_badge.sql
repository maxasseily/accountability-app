-- Add displayed_badge_id column to profiles table
-- This allows users to select one of their earned badges as their "displayed badge"

ALTER TABLE profiles
  ADD COLUMN displayed_badge_id TEXT REFERENCES badges(id) ON DELETE SET NULL;

-- Add index for performance when querying displayed badges
CREATE INDEX idx_profiles_displayed_badge ON profiles(displayed_badge_id);

-- RPC function to set displayed badge (validates user owns the badge)
-- This ensures users can only set badges they have actually earned
CREATE OR REPLACE FUNCTION set_displayed_badge(
  p_user_id UUID,
  p_badge_id TEXT
)
RETURNS VOID AS $$
DECLARE
  v_has_badge BOOLEAN;
BEGIN
  -- Check if user has earned this badge
  SELECT EXISTS(
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) INTO v_has_badge;

  -- If user doesn't have badge, raise exception
  IF NOT v_has_badge THEN
    RAISE EXCEPTION 'User has not earned this badge';
  END IF;

  -- Update profile with displayed badge
  UPDATE profiles
  SET displayed_badge_id = p_badge_id
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_displayed_badge(UUID, TEXT) TO authenticated;

-- RPC function to clear displayed badge
CREATE OR REPLACE FUNCTION clear_displayed_badge(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET displayed_badge_id = NULL
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clear_displayed_badge(UUID) TO authenticated;
