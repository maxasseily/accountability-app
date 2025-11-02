/**
 * Goal database operations
 */

import { supabase } from './supabase';
import type { UserGoal, GoalType, GoalFrequency } from '../types/goals';

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

// Get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Convert database row to UserGoal
function mapDbToUserGoal(row: any): UserGoal {
  return {
    id: row.id,
    userId: row.user_id,
    goalType: row.goal_type as GoalType,
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
  goalType: GoalType,
  frequency: GoalFrequency
): Promise<UserGoal> {
  const { data, error } = await supabase
    .from('user_goals')
    .insert({
      user_id: userId,
      goal_type: goalType,
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
  goalType: GoalType,
  frequency: GoalFrequency
): Promise<UserGoal> {
  const { data, error } = await supabase
    .from('user_goals')
    .update({
      goal_type: goalType,
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
export async function incrementGoalProgress(userId: string): Promise<UserGoal> {
  const today = getTodayDateString();

  // Get current goal
  const goal = await getUserGoalFromDb(userId);
  if (!goal) {
    throw new Error('No goal set');
  }

  // Check if already logged today
  if (goal.lastCompletionDate === today) {
    throw new Error('Already logged a run today');
  }

  // Check if we need to reset for a new week
  const currentWeekStart = getWeekStartDate();
  const needsReset = new Date(currentWeekStart) > new Date(goal.weekStartDate);

  let newProgress: number;
  let newCompletionDates: string[];

  if (needsReset) {
    // Reset for new week
    newProgress = 1;
    newCompletionDates = [today];
  } else {
    // Add to current week
    newProgress = Math.min(goal.currentProgress + 1, goal.frequency);
    newCompletionDates = [...goal.completionDates, today];
  }

  const { data, error } = await supabase
    .from('user_goals')
    .update({
      current_progress: newProgress,
      week_start_date: needsReset ? currentWeekStart : goal.weekStartDate,
      last_completion_date: today,
      completion_dates: newCompletionDates,
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
