-- =====================================================================
-- CREDIBILITY CALCULATION MODULE
-- =====================================================================
-- This migration creates self-contained functions for credibility calculations.
-- All credibility formulas are defined here for easy adjustment.
--
-- TO MODIFY CREDIBILITY FORMULAS: Update the functions in this file,
-- then create a new migration to replace them.
--
-- Formulas:
-- - Weekly allocation: dC = 2 * n_goals^1.5
-- - Per-goal gain: (1/n_goals) * dC
-- - Completion bonus: +4
-- - Failure penalty: -2 * n_goals_missed
--
-- Timezone: UTC (Monday 4am for weekly resolution)
-- =====================================================================

-- Function: Calculate weekly credibility allocation
-- Formula: dC = 2 * n_goals^1.5
CREATE OR REPLACE FUNCTION calculate_weekly_credibility_allocation(n_goals INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  IF n_goals <= 0 THEN
    RETURN 0;
  END IF;
  RETURN 2 * POWER(n_goals, 1.5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_weekly_credibility_allocation(INTEGER) IS
'Calculate total credibility available per week based on goal frequency. Formula: dC = 2 * n_goals^1.5. Mirrors TypeScript function in src/lib/credibility.ts.';

-- Function: Calculate per-goal credibility gain
-- Formula: (1/n_goals) * dC
CREATE OR REPLACE FUNCTION calculate_per_goal_credibility_gain(n_goals INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  weekly_allocation NUMERIC;
BEGIN
  IF n_goals <= 0 THEN
    RETURN 0;
  END IF;

  weekly_allocation := calculate_weekly_credibility_allocation(n_goals);
  RETURN weekly_allocation / n_goals;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_per_goal_credibility_gain(INTEGER) IS
'Calculate credibility gained per individual goal completion. Returns (1/n_goals) * dC. Ensures completing all goals awards exactly dC credibility. Mirrors TypeScript function in src/lib/credibility.ts.';

-- Function: Calculate weekly completion bonus
-- Formula: +4
CREATE OR REPLACE FUNCTION calculate_completion_bonus()
RETURNS INTEGER AS $$
BEGIN
  RETURN 4;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_completion_bonus() IS
'Weekly bonus credibility for completing all goals. Applied at Monday 4am UTC if current_progress >= frequency. Mirrors TypeScript function in src/lib/credibility.ts.';

-- Function: Calculate weekly failure penalty
-- Formula: -2 * n_goals_missed
CREATE OR REPLACE FUNCTION calculate_failure_penalty(n_goals_missed INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF n_goals_missed <= 0 THEN
    RETURN 0;
  END IF;
  RETURN -2 * n_goals_missed;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_failure_penalty(INTEGER) IS
'Weekly penalty credibility for missing goals. Formula: -2 * n_goals_missed. Applied at Monday 4am UTC if current_progress < frequency. Mirrors TypeScript function in src/lib/credibility.ts.';

-- Grant execute permissions to authenticated users
-- (allows client-side RPC calls for previews if needed)
GRANT EXECUTE ON FUNCTION calculate_weekly_credibility_allocation(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_per_goal_credibility_gain(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_completion_bonus() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_failure_penalty(INTEGER) TO authenticated;
