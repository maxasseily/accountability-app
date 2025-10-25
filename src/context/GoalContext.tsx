import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserGoal, GoalType, GoalFrequency, GoalProgress } from '../types/goals';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GoalContextType {
  goal: UserGoal | null;
  isLoading: boolean;
  hasGoal: boolean;
  setGoal: (goalType: GoalType, frequency: GoalFrequency) => Promise<void>;
  updateGoal: (goalType: GoalType, frequency: GoalFrequency) => Promise<void>;
  incrementProgress: () => Promise<void>;
  getProgress: () => GoalProgress | null;
  resetWeeklyProgress: () => Promise<void>;
  getUserGoal: (userId: string) => Promise<UserGoal | null>;
  canLogToday: () => boolean;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

// Helper to get the start of the current week (Monday)
function getWeekStartDate(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday (0) to be part of previous week
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

// Check if we're in a new week
function isNewWeek(weekStartDate: string): boolean {
  const currentWeekStart = getWeekStartDate();
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

  // Storage key for user's goal
  const getStorageKey = useCallback(() => {
    return `user_goal_${user?.id}`;
  }, [user?.id]);

  // Load goal from storage
  const loadGoal = useCallback(async () => {
    if (!user) {
      setGoalState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const key = getStorageKey();
      const storedGoal = await AsyncStorage.getItem(key);

      if (storedGoal) {
        const parsedGoal: UserGoal = JSON.parse(storedGoal);

        // Check if we need to reset for a new week
        if (isNewWeek(parsedGoal.weekStartDate)) {
          parsedGoal.currentProgress = 0;
          parsedGoal.weekStartDate = getWeekStartDate();
          parsedGoal.completionDates = [];
          await AsyncStorage.setItem(key, JSON.stringify(parsedGoal));
        }

        // Ensure new fields exist for backward compatibility
        if (!parsedGoal.lastCompletionDate) {
          parsedGoal.lastCompletionDate = null;
        }
        if (!parsedGoal.completionDates) {
          parsedGoal.completionDates = [];
        }

        setGoalState(parsedGoal);
      } else {
        setGoalState(null);
      }
    } catch (error) {
      console.error('Error loading goal:', error);
      setGoalState(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, getStorageKey]);

  // Load goal when user changes
  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  // Set a new goal
  const setGoal = async (goalType: GoalType, frequency: GoalFrequency) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    const newGoal: UserGoal = {
      id: `goal_${Date.now()}`,
      userId: user.id,
      goalType,
      frequency,
      currentProgress: 0,
      weekStartDate: getWeekStartDate(),
      lastCompletionDate: null,
      completionDates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const key = getStorageKey();
      await AsyncStorage.setItem(key, JSON.stringify(newGoal));
      setGoalState(newGoal);
    } catch (error) {
      console.error('Error setting goal:', error);
      throw error;
    }
  };

  // Update existing goal
  const updateGoal = async (goalType: GoalType, frequency: GoalFrequency) => {
    if (!user || !goal) {
      throw new Error('No goal to update');
    }

    const updatedGoal: UserGoal = {
      ...goal,
      goalType,
      frequency,
      currentProgress: 0, // Reset progress when changing goal
      weekStartDate: getWeekStartDate(),
      lastCompletionDate: null,
      completionDates: [],
      updatedAt: new Date().toISOString(),
    };

    try {
      const key = getStorageKey();
      await AsyncStorage.setItem(key, JSON.stringify(updatedGoal));
      setGoalState(updatedGoal);
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  // Increment progress (e.g., when user completes a run)
  const incrementProgress = async () => {
    if (!goal) {
      throw new Error('No goal set');
    }

    const today = getTodayDateString();

    // Check if already logged today
    if (goal.lastCompletionDate === today) {
      throw new Error('Already logged a run today');
    }

    // Check if we need to reset for a new week
    let currentGoal = goal;
    if (isNewWeek(goal.weekStartDate)) {
      currentGoal = {
        ...goal,
        currentProgress: 0,
        weekStartDate: getWeekStartDate(),
        completionDates: [],
      };
    }

    // Add today to completion dates
    const newCompletionDates = [...currentGoal.completionDates, today];

    const updatedGoal: UserGoal = {
      ...currentGoal,
      currentProgress: Math.min(currentGoal.currentProgress + 1, currentGoal.frequency),
      lastCompletionDate: today,
      completionDates: newCompletionDates,
      updatedAt: new Date().toISOString(),
    };

    try {
      const key = getStorageKey();
      await AsyncStorage.setItem(key, JSON.stringify(updatedGoal));
      setGoalState(updatedGoal);
    } catch (error) {
      console.error('Error incrementing progress:', error);
      throw error;
    }
  };

  // Get current progress
  const getProgress = (): GoalProgress | null => {
    if (!goal) return null;

    return {
      completed: goal.currentProgress,
      total: goal.frequency,
      percentage: (goal.currentProgress / goal.frequency) * 100,
    };
  };

  // Reset weekly progress (called automatically, but can be called manually)
  const resetWeeklyProgress = async () => {
    if (!goal) return;

    const resetGoal: UserGoal = {
      ...goal,
      currentProgress: 0,
      weekStartDate: getWeekStartDate(),
      completionDates: [],
      updatedAt: new Date().toISOString(),
    };

    try {
      const key = getStorageKey();
      await AsyncStorage.setItem(key, JSON.stringify(resetGoal));
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
      const key = `user_goal_${userId}`;
      const storedGoal = await AsyncStorage.getItem(key);

      if (storedGoal) {
        const parsedGoal: UserGoal = JSON.parse(storedGoal);

        // Check if we need to reset for a new week
        if (isNewWeek(parsedGoal.weekStartDate)) {
          parsedGoal.currentProgress = 0;
          parsedGoal.weekStartDate = getWeekStartDate();
          parsedGoal.completionDates = [];
          // Update the stored goal
          await AsyncStorage.setItem(key, JSON.stringify(parsedGoal));
        }

        // Ensure new fields exist for backward compatibility
        if (!parsedGoal.lastCompletionDate) {
          parsedGoal.lastCompletionDate = null;
        }
        if (!parsedGoal.completionDates) {
          parsedGoal.completionDates = [];
        }

        return parsedGoal;
      }

      return null;
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
