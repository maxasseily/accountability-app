-- Add activity and sub_activity columns to user_goals table
-- This migration supports the new hierarchical goal structure: Activity -> SubActivity -> Frequency
-- BREAKING CHANGE: Removes legacy goal_type column

-- Add new columns
ALTER TABLE user_goals
ADD COLUMN IF NOT EXISTS activity text NOT NULL DEFAULT 'body',
ADD COLUMN IF NOT EXISTS sub_activity text NOT NULL DEFAULT 'running';

-- Add check constraints for valid values
ALTER TABLE user_goals
ADD CONSTRAINT valid_activity CHECK (activity IN ('brain', 'body'));

ALTER TABLE user_goals
ADD CONSTRAINT valid_sub_activity CHECK (
  sub_activity IN ('running', 'gym', 'mindfulness', 'learning_language')
);

-- Add constraint to ensure sub_activity matches its parent activity
ALTER TABLE user_goals
ADD CONSTRAINT valid_activity_subactivity_pair CHECK (
  (activity = 'body' AND sub_activity IN ('running', 'gym')) OR
  (activity = 'brain' AND sub_activity IN ('mindfulness', 'learning_language'))
);

-- Remove the old goal_type column
ALTER TABLE user_goals
DROP COLUMN IF EXISTS goal_type;

-- Add comments explaining the new structure
COMMENT ON COLUMN user_goals.activity IS 'Main activity category: brain or body';
COMMENT ON COLUMN user_goals.sub_activity IS 'Specific sub-activity within the main category';
