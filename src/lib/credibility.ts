/**
 * Credibility Calculation Module
 *
 * This is the SINGLE SOURCE OF TRUTH for all credibility calculations.
 * To adjust the credibility system, modify the formulas in this file.
 *
 * The database functions mirror these same formulas (duplicated in SQL).
 * If you change formulas here, update the corresponding SQL migration.
 *
 * Formula Overview:
 * - Weekly allocation: dC = 2 * n_goals^1.5
 * - Per-goal gain: (1/n_goals) * dC
 * - Completion bonus: +4 (if all goals met)
 * - Failure penalty: -2 * n_goals_missed
 */

/**
 * Timezone for weekly reset (configurable)
 * Used for documentation and client-side display
 */
export const WEEKLY_RESET_TIMEZONE = 'UTC';
export const WEEKLY_RESET_HOUR = 4; // 4am

/**
 * Calculate total credibility available per week
 * Formula: dC = 2 * n_goals^1.5
 *
 * @param nGoals - Number of goals user committed to this week (e.g., 3 for "3x/week")
 * @returns Total credibility allocation for the week
 *
 * @example
 * calculateWeeklyAllocation(3) // Returns ~10.39
 * calculateWeeklyAllocation(4) // Returns 16
 */
export function calculateWeeklyAllocation(nGoals: number): number {
  if (nGoals <= 0) return 0;
  return 2 * Math.pow(nGoals, 1.5);
}

/**
 * Calculate credibility gain per individual goal completion
 * Formula: (1/n_goals) * dC
 *
 * This ensures that completing all goals awards exactly dC credibility.
 * Each goal gives an equal share of the weekly allocation.
 *
 * @param nGoals - Number of goals user committed to this week
 * @returns Credibility gained from logging one goal
 *
 * @example
 * calculatePerGoalGain(3) // Returns ~3.46 (each goal = 1/3 of 10.39)
 * calculatePerGoalGain(4) // Returns 4 (each goal = 1/4 of 16)
 */
export function calculatePerGoalGain(nGoals: number): number {
  if (nGoals <= 0) return 0;
  const weeklyAllocation = calculateWeeklyAllocation(nGoals);
  return weeklyAllocation / nGoals;
}

/**
 * Weekly bonus for completing all weekly goals
 * Applied at Monday 4am UTC if current_progress >= frequency
 *
 * @returns Bonus credibility for completing all goals
 */
export function calculateCompletionBonus(): number {
  return 4;
}

/**
 * Weekly penalty for missing goals
 * Formula: -2 * n_goals_missed
 * Applied at Monday 4am UTC if current_progress < frequency
 *
 * @param nGoalsMissed - Number of goals not completed this week
 * @returns Penalty credibility (negative number)
 *
 * @example
 * calculateFailurePenalty(1) // Returns -2 (missed 1 goal)
 * calculateFailurePenalty(2) // Returns -4 (missed 2 goals)
 */
export function calculateFailurePenalty(nGoalsMissed: number): number {
  if (nGoalsMissed <= 0) return 0;
  return -2 * nGoalsMissed;
}

/**
 * Preview credibility change for a user about to log a goal
 * (Client-side preview before committing)
 *
 * @param userFrequency - User's weekly goal frequency
 * @returns Expected credibility gain from logging the goal
 *
 * @example
 * previewGoalLogCredibilityGain(3) // Returns ~3.46
 */
export function previewGoalLogCredibilityGain(userFrequency: number): number {
  return calculatePerGoalGain(userFrequency);
}

/**
 * Calculate net weekly outcome if week ended now
 * Useful for showing users their projected weekly result
 *
 * @param frequency - User's weekly goal frequency
 * @param currentProgress - Number of goals completed so far this week
 * @returns Object with bonus, penalty, and net credibility change
 *
 * @example
 * calculateWeeklyOutcome(3, 3) // { bonus: 4, penalty: 0, net: 4 } - all goals met
 * calculateWeeklyOutcome(3, 1) // { bonus: 0, penalty: -4, net: -4 } - missed 2 goals
 */
export function calculateWeeklyOutcome(
  frequency: number,
  currentProgress: number
): { bonus: number; penalty: number; net: number } {
  const goalsMissed = Math.max(0, frequency - currentProgress);

  if (currentProgress >= frequency) {
    // User completed all goals - apply bonus
    return {
      bonus: calculateCompletionBonus(),
      penalty: 0,
      net: calculateCompletionBonus(),
    };
  } else {
    // User missed some goals - apply penalty
    return {
      bonus: 0,
      penalty: calculateFailurePenalty(goalsMissed),
      net: calculateFailurePenalty(goalsMissed),
    };
  }
}

/**
 * Calculate total credibility earned in a week (excluding bonuses/penalties)
 * This is the sum of all per-goal gains
 *
 * @param frequency - User's weekly goal frequency
 * @param completedCount - Number of goals actually completed
 * @returns Total credibility from goal completions (not including weekly bonus/penalty)
 *
 * @example
 * calculateWeeklyGoalCredibility(3, 3) // Returns ~10.39 (all 3 goals)
 * calculateWeeklyGoalCredibility(3, 2) // Returns ~6.93 (2 out of 3 goals)
 */
export function calculateWeeklyGoalCredibility(
  frequency: number,
  completedCount: number
): number {
  const perGoal = calculatePerGoalGain(frequency);
  return perGoal * completedCount;
}
