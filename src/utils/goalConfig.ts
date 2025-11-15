import { ActivityConfig, SubActivityConfig, ActivityType, SubActivity } from '../types/goals';

/**
 * Main activity categories configuration
 */
export const ACTIVITIES: ActivityConfig[] = [
  {
    id: 'body',
    name: 'Body',
    description: 'Physical fitness and movement goals',
    icon: 'arm-flex',
  },
  {
    id: 'brain',
    name: 'Brain',
    description: 'Mental wellness and learning goals',
    icon: 'brain',
  },
];

/**
 * Sub-activity configurations for each main activity
 */
export const SUB_ACTIVITIES: SubActivityConfig[] = [
  // Body sub-activities
  {
    id: 'running',
    parentActivity: 'body',
    name: 'Running',
    description: 'Track your running goals and progress',
    icon: 'run',
    templates: {
      frequencyText: 'Run',           // "Run 3 times/week"
      frequencyNoun: 'running',        // "Choose your weekly running frequency"
      logAction: 'Run',                // "Log Run"
    },
  },
  {
    id: 'gym',
    parentActivity: 'body',
    name: 'Gym',
    description: 'Track your gym workouts and progress',
    icon: 'dumbbell',
    templates: {
      frequencyText: 'Go to the gym',  // "Go to the gym 3 times/week"
      frequencyNoun: 'gym session',    // "Choose your weekly gym session frequency"
      logAction: 'Gym Session',        // "Log Gym Session"
    },
  },
  // Brain sub-activities
  {
    id: 'mindfulness',
    parentActivity: 'brain',
    name: 'Mindfulness',
    description: 'Practice meditation and mindfulness',
    icon: 'emoticon-happy-outline',
    templates: {
      frequencyText: 'Practice mindfulness',  // "Practice mindfulness 3 times/week"
      frequencyNoun: 'mindfulness practice',  // "Choose your weekly mindfulness practice frequency"
      logAction: 'Mindfulness',               // "Log Mindfulness"
    },
  },
  {
    id: 'learning_language',
    parentActivity: 'brain',
    name: 'Learning a Language',
    description: 'Learn and practice a new language',
    icon: 'book-alphabet',
    templates: {
      frequencyText: 'Practice a language',     // "Practice a language 3 times/week"
      frequencyNoun: 'language learning',       // "Choose your weekly language learning frequency"
      logAction: 'Language Practice',           // "Log Language Practice"
    },
  },
];

/**
 * Helper function to get activity config by ID
 */
export const getActivityConfig = (activityId: ActivityType): ActivityConfig | undefined => {
  return ACTIVITIES.find(a => a.id === activityId);
};

/**
 * Helper function to get sub-activity config by ID
 */
export const getSubActivityConfig = (subActivityId: SubActivity): SubActivityConfig | undefined => {
  return SUB_ACTIVITIES.find(sa => sa.id === subActivityId);
};

/**
 * Helper function to get all sub-activities for a given activity
 */
export const getSubActivitiesForActivity = (activityId: ActivityType): SubActivityConfig[] => {
  return SUB_ACTIVITIES.filter(sa => sa.parentActivity === activityId);
};

/**
 * Helper function to format goal display text
 * Used for displaying the goal with frequency (e.g., "Run 3 times/week")
 */
export const formatGoalText = (subActivityId: SubActivity, frequency: number): string => {
  const config = getSubActivityConfig(subActivityId);
  if (!config) return `${frequency} times/week`;

  return `${config.templates.frequencyText} ${frequency} times/week`;
};

/**
 * Helper function to get frequency noun
 * Used for "Choose your weekly X frequency" text
 */
export const getFrequencyNoun = (subActivityId: SubActivity): string => {
  const config = getSubActivityConfig(subActivityId);
  if (!config) return 'activity';

  return config.templates.frequencyNoun;
};

/**
 * Helper function to get log action text
 * Used for button text like "Log Run" or "Log Gym Session"
 */
export const getLogActionText = (subActivityId: SubActivity): string => {
  const config = getSubActivityConfig(subActivityId);
  if (!config) return 'Goal';

  return config.templates.logAction;
};
