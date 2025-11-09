-- Add prophecy and curse notification types to the check constraint

-- Drop the old constraint
ALTER TABLE user_notifications
DROP CONSTRAINT IF EXISTS user_notifications_notification_type_check;

-- Add new constraint with all notification types
ALTER TABLE user_notifications
ADD CONSTRAINT user_notifications_notification_type_check
CHECK (notification_type IN (
  'alliance_success',
  'alliance_failure',
  'prophecy_accepted',
  'prophecy_won',
  'prophecy_lost',
  'curse_accepted',
  'curse_won',
  'curse_lost'
));
