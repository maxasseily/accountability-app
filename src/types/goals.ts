// Main activity categories
export type ActivityType = 'brain' | 'body';

// Sub-activities for each category
export type BrainSubActivity = 'mindfulness' | 'learning_language';
export type BodySubActivity = 'running' | 'gym';
export type SubActivity = BrainSubActivity | BodySubActivity;

export type GoalFrequency = 2 | 3 | 4;

// Activity configuration for UI display
export interface ActivityConfig {
  id: ActivityType;
  name: string;
  description: string;
  icon: string; // MaterialCommunityIcons name
}

export interface SubActivityConfig {
  id: SubActivity;
  parentActivity: ActivityType;
  name: string;
  description: string;
  icon: string; // MaterialCommunityIcons name
  // Text templates for different contexts
  templates: {
    // Used for "X 3 times/week" (goal display)
    frequencyText: string; // e.g., "Run", "Go to the gym", "Practice mindfulness"
    // Used for "Choose your weekly X frequency"
    frequencyNoun: string; // e.g., "running", "gym session", "mindfulness practice"
    // Used for action button text "Log X"
    logAction: string; // e.g., "Run", "Gym Session", "Mindfulness"
  };
}

export interface UserGoal {
  id: string;
  userId: string;
  activity: ActivityType;
  subActivity: SubActivity;
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
