/**
 * Goal database operations
 */

import { supabase } from './supabase';
import type { UserGoal, GoalFrequency, ActivityType, SubActivity } from '../types/goals';
import type { GoalCompletionResult } from '../types/statistics';
import { mapRowToUserStatistics } from './statistics';
import { checkStreakBadges, checkTimeBadges, checkMilestoneBadges } from './badges';
import { calculatePerGoalGain } from './credibility';

// Helper to get the start of the current week (Monday)
function getWeekStartDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// Convert database row to UserGoal
function mapDbToUserGoal(row: any): UserGoal {
  return {
    id: row.id,
    userId: row.user_id,
    activity: row.activity as ActivityType,
    subActivity: row.sub_activity as SubActivity,
    frequency: row.frequency as GoalFrequency,
    currentProgress: row.current_progress,
    weekStartDate: row.week_start_date,
    lastCompletionDate: row.last_completion_date,
    completionDates: row.completion_dates || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get the current user's goal
 */
export async function getUserGoalFromDb(userId: string): Promise<UserGoal | null> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No goal found
      return null;
    }
    throw error;
  }

  return mapDbToUserGoal(data);
}

/**
 * Create a new goal for the user
 */
export async function createGoal(
  userId: string,
  activity: ActivityType,
  subActivity: SubActivity,
  frequency: GoalFrequency
): Promise<UserGoal> {
  const { data, error } = await supabase
    .from('user_goals')
    .insert({
      user_id: userId,
      activity,
      sub_activity: subActivity,
      frequency,
      current_progress: 0,
      week_start_date: getWeekStartDate(),
      last_completion_date: null,
      completion_dates: [],
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapDbToUserGoal(data);
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  userId: string,
  activity: ActivityType,
  subActivity: SubActivity,
  frequency: GoalFrequency
): Promise<UserGoal> {
  const { data, error } = await supabase
    .from('user_goals')
    .update({
      activity,
      sub_activity: subActivity,
      frequency,
      current_progress: 0, // Reset progress when changing goal
      week_start_date: getWeekStartDate(),
      last_completion_date: null,
      completion_dates: [],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapDbToUserGoal(data);
}

/**
 * Increment goal progress (log a completion)
 */
export async function incrementGoalProgress(userId: string): Promise<GoalCompletionResult> {
  const { data, error } = await supabase.rpc('log_goal_completion', {
    user_uuid: userId,
  });

  if (error) {
    throw error;
  }

  if (!data?.goal || !data?.statistics) {
    throw new Error('Unexpected response from log_goal_completion');
  }

  // Check for badge achievements after goal completion
  // Run these in the background (don't await)
  const now = new Date();
  checkStreakBadges(userId).catch(err => console.error('Error checking streak badges:', err));
  checkTimeBadges(userId, now).catch(err => console.error('Error checking time badges:', err));
  checkMilestoneBadges(userId).catch(err => console.error('Error checking milestone badges:', err));

  return {
    goal: mapDbToUserGoal(data.goal),
    statistics: mapRowToUserStatistics(data.statistics),
    mojoGained: data.mojo_gained,
    credibilityGained: data.credibility_gained, // NEW: Credibility gained from this log
    weeklyGoalCompleted: data.weekly_goal_completed,
    hasAllianceBonus: data.has_alliance_bonus,
  };
}

/**
 * Reset weekly progress (called automatically for new week)
 */
export async function resetWeeklyProgress(userId: string): Promise<UserGoal> {
  const { data, error } = await supabase
    .from('user_goals')
    .update({
      current_progress: 0,
      week_start_date: getWeekStartDate(),
      completion_dates: [],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapDbToUserGoal(data);
}

/**
 * Get goal for any user (for displaying in groups)
 */
export async function getAnyUserGoal(userId: string): Promise<UserGoal | null> {
  return getUserGoalFromDb(userId);
}

/**
 * Preview credibility gain before logging a goal
 * (Client-side preview before committing)
 *
 * @param frequency - User's weekly goal frequency
 * @returns Expected credibility gain from logging the goal
 *
 * @example
 * previewCredibilityGain(3) // Returns ~3.46
 */
export function previewCredibilityGain(frequency: number): number {
  return calculatePerGoalGain(frequency);
}
