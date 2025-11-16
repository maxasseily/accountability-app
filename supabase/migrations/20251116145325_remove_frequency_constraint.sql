-- Remove the frequency constraint that limited values to (2, 3, 4)
-- This allows users to set any frequency value

-- Drop the existing constraint
ALTER TABLE public.user_goals
DROP CONSTRAINT IF EXISTS user_goals_frequency_check;

-- Add a new constraint that just ensures frequency is positive and reasonable (1-7)
ALTER TABLE public.user_goals
ADD CONSTRAINT user_goals_frequency_check CHECK (frequency >= 1 AND frequency <= 7);
