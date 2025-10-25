export type GoalType = 'running' | 'coming_soon';
export type GoalFrequency = 2 | 3 | 4;

export interface UserGoal {
  id: string;
  userId: string;
  goalType: GoalType;
  frequency: GoalFrequency;
  currentProgress: number; // Number of completions this week
  weekStartDate: string; // ISO date string for the start of the current week
  lastCompletionDate: string | null; // ISO date string of the last completion (YYYY-MM-DD format)
  completionDates: string[]; // Array of completion dates for the current week (YYYY-MM-DD format)
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  completed: number;
  total: number;
  percentage: number;
}
