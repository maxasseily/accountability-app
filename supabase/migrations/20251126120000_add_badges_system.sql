-- Create badges table
-- This stores the master list of all available badges/achievements
CREATE TABLE "public"."badges" (
    "id" TEXT PRIMARY KEY, -- e.g., 'three_times_charm', 'warmonger'
    "name" TEXT NOT NULL, -- Display name e.g., "3 times a charm"
    "description" TEXT NOT NULL, -- Description of how to earn it
    "icon" TEXT NOT NULL, -- Emoji or icon identifier
    "category" TEXT NOT NULL, -- 'streak', 'quest', 'mojo', 'milestone', 'special'
    "sort_order" INTEGER NOT NULL DEFAULT 0, -- For ordering in UI
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_badges junction table
-- Tracks which badges each user has earned
CREATE TABLE "public"."user_badges" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "badge_id" TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    "earned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "progress_value" DOUBLE PRECISION, -- Optional: for tracking progress (e.g., 5/10 wars won)
    UNIQUE(user_id, badge_id) -- Each user can only earn a badge once
);

-- Enable Row Level Security
ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;

-- Policies for badges (everyone can read, no one can modify - only via functions)
CREATE POLICY "Anyone can view badges"
ON "public"."badges"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Policies for user_badges
CREATE POLICY "Users can view all user badges"
ON "public"."user_badges"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can view their own badge progress"
ON "public"."user_badges"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- Insert badge definitions (MVP set)
INSERT INTO badges (id, name, description, icon, category, sort_order) VALUES
-- Streak badges
('three_times_charm', '3 times a charm', 'Complete 3 goal logs in one week', '🔥', 'streak', 1),
('seven_is_heaven', '7 is heaven', 'Complete 7 goal logs in one week', '✨', 'streak', 2),
('are_you_kidding_me', 'Are you kidding me?!', 'Achieve a 50 goal logging streak', '🚀', 'streak', 3),

-- Quest badges
('alliance_master', 'Alliance Master', 'Complete 25 alliance quests', '🤝', 'quest', 10),
('gladiator', 'Gladiator', 'Win 15 battle quests', '⚔️', 'quest', 11),
('warmonger', 'Warmonger', 'Win 10 speculation bets betting AGAINST', '🗡️', 'quest', 12),
('prophet', 'Prophet', 'Win 10 speculation bets betting FOR', '🔮', 'quest', 13),
('high_roller', 'High Roller', 'Win a single speculation bet worth 100+ mojo', '🎲', 'quest', 14),
('peacemaker', 'Peacemaker', 'Resolve 20 speculation quests as third-party', '🕊️', 'quest', 15),

-- Mojo badges
('mojo_millionaire', 'Mojo Millionaire', 'Accumulate 1000 total mojo earned (lifetime)', '💰', 'mojo', 20),
('big_spender', 'Big Spender', 'Spend 500 mojo on rank upgrades', '💸', 'mojo', 21),

-- Milestone badges
('first_steps', 'First Steps', 'Complete your first goal', '👣', 'milestone', 30),

-- Special badges
('night_owl', 'Night Owl', 'Log a goal at 3 AM or later', '🦉', 'special', 40),
('early_bird', 'Early Bird', 'Log a goal before 6 AM', '🌅', 'special', 41),
('underdog', 'Underdog', 'Win a speculation bet when odds were against you (3:1 or worse)', '🐕', 'special', 42);

-- Function to award a badge to a user (idempotent)
CREATE OR REPLACE FUNCTION award_badge(
    p_user_id UUID,
    p_badge_id TEXT,
    p_progress_value DOUBLE PRECISION DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_already_earned BOOLEAN;
BEGIN
    -- Check if user already has this badge
    SELECT EXISTS(
        SELECT 1 FROM user_badges
        WHERE user_id = p_user_id AND badge_id = p_badge_id
    ) INTO v_already_earned;

    -- If already earned, return false (no-op)
    IF v_already_earned THEN
        RETURN FALSE;
    END IF;

    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id, progress_value)
    VALUES (p_user_id, p_badge_id, p_progress_value);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_badge(UUID, TEXT, DOUBLE PRECISION) TO authenticated;

-- Function to check and award streak badges
-- This should be called after a goal is logged
CREATE OR REPLACE FUNCTION check_and_award_streak_badges(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_current_streak INTEGER;
    v_week_start DATE;
    v_week_goal_count INTEGER;
BEGIN
    -- Get the start of the current week (Monday)
    v_week_start := DATE_TRUNC('week', NOW())::DATE;

    -- Count goals logged this week
    SELECT COUNT(*) INTO v_week_goal_count
    FROM daily_photos
    WHERE user_id = p_user_id
        AND date >= v_week_start
        AND date < v_week_start + INTERVAL '7 days';

    -- Award "3 times a charm" if 3+ goals this week
    IF v_week_goal_count >= 3 THEN
        PERFORM award_badge(p_user_id, 'three_times_charm', v_week_goal_count);
    END IF;

    -- Award "7 is heaven" if 7+ goals this week
    IF v_week_goal_count >= 7 THEN
        PERFORM award_badge(p_user_id, 'seven_is_heaven', v_week_goal_count);
    END IF;

    -- Calculate current streak (consecutive days with goals)
    WITH daily_logs AS (
        SELECT DISTINCT date
        FROM daily_photos
        WHERE user_id = p_user_id
        ORDER BY date DESC
    ),
    streak_calc AS (
        SELECT
            date,
            date - (ROW_NUMBER() OVER (ORDER BY date DESC))::INTEGER * INTERVAL '1 day' AS grp
        FROM daily_logs
    ),
    consecutive_days AS (
        SELECT COUNT(*) as streak_length
        FROM streak_calc
        WHERE date >= CURRENT_DATE - INTERVAL '365 days' -- Look back 1 year max
        GROUP BY grp
        ORDER BY MIN(date) DESC
        LIMIT 1
    )
    SELECT COALESCE(streak_length, 0) INTO v_current_streak
    FROM consecutive_days;

    -- Award "Are you kidding me?!" if 50+ day streak
    IF v_current_streak >= 50 THEN
        PERFORM award_badge(p_user_id, 'are_you_kidding_me', v_current_streak);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_and_award_streak_badges(UUID) TO authenticated;

-- Function to check time-based badges (night owl, early bird)
CREATE OR REPLACE FUNCTION check_and_award_time_badges(
    p_user_id UUID,
    p_timestamp TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
DECLARE
    v_hour INTEGER;
BEGIN
    -- Extract hour from timestamp (in user's timezone - assuming UTC for now)
    v_hour := EXTRACT(HOUR FROM p_timestamp);

    -- Night Owl: 3 AM or later (3:00-3:59)
    IF v_hour >= 3 AND v_hour < 4 THEN
        PERFORM award_badge(p_user_id, 'night_owl');
    END IF;

    -- Early Bird: before 6 AM (0:00-5:59)
    IF v_hour >= 0 AND v_hour < 6 THEN
        PERFORM award_badge(p_user_id, 'early_bird');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_and_award_time_badges(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Add tracking columns to user_statistics for badge thresholds
ALTER TABLE user_statistics
    ADD COLUMN IF NOT EXISTS lifetime_mojo_earned DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lifetime_mojo_spent_on_ranks DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS alliance_quests_completed INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS battle_quests_won INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS speculation_bets_won_for INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS speculation_bets_won_against INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS speculation_quests_resolved INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_statistics.lifetime_mojo_earned IS 'Total mojo earned over all time (for Mojo Millionaire badge)';
COMMENT ON COLUMN user_statistics.lifetime_mojo_spent_on_ranks IS 'Total mojo spent on rank upgrades (for Big Spender badge)';
COMMENT ON COLUMN user_statistics.alliance_quests_completed IS 'Total alliance quests completed (for Alliance Master badge)';
COMMENT ON COLUMN user_statistics.battle_quests_won IS 'Total battle quests won (for Gladiator badge)';
COMMENT ON COLUMN user_statistics.speculation_bets_won_for IS 'Speculation bets won betting FOR (for Prophet badge)';
COMMENT ON COLUMN user_statistics.speculation_bets_won_against IS 'Speculation bets won betting AGAINST (for Warmonger badge)';
COMMENT ON COLUMN user_statistics.speculation_quests_resolved IS 'Speculation quests resolved as third party (for Peacemaker badge)';
