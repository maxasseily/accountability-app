-- Remove obsolete rank column from profiles table
-- This column has been replaced by user_rank in user_statistics table

ALTER TABLE profiles
DROP COLUMN IF EXISTS rank;

-- Add comment to document the change
COMMENT ON TABLE profiles IS 'User profile information. Rank is now stored in user_statistics.user_rank (integer) instead of profiles.rank (text).';
