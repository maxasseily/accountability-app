import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserGoal, GoalFrequency, GoalProgress, ActivityType, SubActivity } from '../types/goals';
import { useAuth } from './AuthContext';
import {
  getUserGoalFromDb,
  createGoal as createGoalDb,
  updateGoal as updateGoalDb,
  incrementGoalProgress as incrementGoalProgressDb,
  resetWeeklyProgress as resetWeeklyProgressDb,
  getAnyUserGoal,
} from '../lib/goals';

interface GoalContextType {
  goal: UserGoal | null;
  isLoading: boolean;
  hasGoal: boolean;
  setGoal: (activity: ActivityType, subActivity: SubActivity, frequency: GoalFrequency) => Promise<void>;
  updateGoal: (activity: ActivityType, subActivity: SubActivity, frequency: GoalFrequency) => Promise<void>;
  incrementProgress: () => Promise<{ mojoGained?: number; weeklyGoalCompleted?: boolean; hasAllianceBonus?: boolean }>;
  getProgress: () => GoalProgress | null;
  resetWeeklyProgress: () => Promise<void>;
  getUserGoal: (userId: string) => Promise<UserGoal | null>;
  canLogToday: () => boolean;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

// Check if we're in a new week
function isNewWeek(weekStartDate: string): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const currentWeekStart = monday.toISOString();
  return new Date(currentWeekStart) > new Date(weekStartDate);
}

// Get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [goal, setGoalState] = useState<UserGoal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load goal from database
  const loadGoal = useCallback(async () => {
    if (!user) {
      setGoalState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userGoal = await getUserGoalFromDb(user.id);

      if (userGoal) {
        // Check if we need to reset for a new week
        if (isNewWeek(userGoal.weekStartDate)) {
          const resetGoal = await resetWeeklyProgressDb(user.id);
          setGoalState(resetGoal);
        } else {
          setGoalState(userGoal);
        }
      } else {
        setGoalState(null);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      setGoalState(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load goal when user changes
  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  // Set a new goal
  const setGoal = async (activity: ActivityType, subActivity: SubActivity, frequency: GoalFrequency) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      const newGoal = await createGoalDb(user.id, activity, subActivity, frequency);
      setGoalState(newGoal);
    } catch (error) {
      console.error('Error setting goal:', error);
      throw error;
    }
  };

  // Update existing goal
  const updateGoal = async (activity: ActivityType, subActivity: SubActivity, frequency: GoalFrequency) => {
    if (!user || !goal) {
      throw new Error('No goal to update');
    }

    try {
      const updatedGoal = await updateGoalDb(user.id, activity, subActivity, frequency);
      setGoalState(updatedGoal);
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  // Increment progress (e.g., when user completes a run)
  const incrementProgress = async (): Promise<{ mojoGained?: number; weeklyGoalCompleted?: boolean; hasAllianceBonus?: boolean }> => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    if (!goal) {
      throw new Error('No goal set');
    }

    try {
      const result = await incrementGoalProgressDb(user.id);
      setGoalState(result.goal);
      return {
        mojoGained: result.mojoGained,
        weeklyGoalCompleted: result.weeklyGoalCompleted,
        hasAllianceBonus: result.hasAllianceBonus,
      };
    } catch (error) {
      console.error('Error incrementing progress:', error);
      throw error;
    }
  };

  // Get current progress
  const getProgress = (): GoalProgress | null => {
    if (!goal) return null;

    // Cap percentage at 700% (7 times the goal, max logs per week)
    const maxPercentage = 700;
    const calculatedPercentage = (goal.currentProgress / goal.frequency) * 100;

    return {
      completed: goal.currentProgress,
      total: goal.frequency,
      percentage: Math.min(calculatedPercentage, maxPercentage),
    };
  };

  // Reset weekly progress (called automatically, but can be called manually)
  const resetWeeklyProgress = async () => {
    if (!user || !goal) return;

    try {
      const resetGoal = await resetWeeklyProgressDb(user.id);
      setGoalState(resetGoal);
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  };

  // Check if user can log a run today (hasn't already logged)
  const canLogToday = (): boolean => {
    if (!goal) return false;
    const today = getTodayDateString();
    return goal.lastCompletionDate !== today;
  };

  // Get goal for any user (for displaying in groups)
  const getUserGoal = async (userId: string): Promise<UserGoal | null> => {
    try {
      return await getAnyUserGoal(userId);
    } catch (error) {
      console.error('Error getting user goal:', error);
      return null;
    }
  };

  const value: GoalContextType = {
    goal,
    isLoading,
    hasGoal: goal !== null,
    setGoal,
    updateGoal,
    incrementProgress,
    getProgress,
    resetWeeklyProgress,
    getUserGoal,
    canLogToday,
  };

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoal() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoal must be used within a GoalProvider');
  }
  return context;
}
