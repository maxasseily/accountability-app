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
    actionVerb: 'Run',
    actionNoun: 'running',
  },
  {
    id: 'gym',
    parentActivity: 'body',
    name: 'Gym',
    description: 'Track your gym workouts and progress',
    icon: 'dumbbell',
    actionVerb: 'Go to',
    actionNoun: 'the gym',
  },
  // Brain sub-activities
  {
    id: 'mindfulness',
    parentActivity: 'brain',
    name: 'Mindfulness',
    description: 'Practice meditation and mindfulness',
    icon: 'emoticon-happy-outline',
    actionVerb: 'Practice',
    actionNoun: 'mindfulness',
  },
  {
    id: 'learning_language',
    parentActivity: 'brain',
    name: 'Learning a Language',
    description: 'Learn and practice a new language',
    icon: 'book-alphabet',
    actionVerb: 'Practice',
    actionNoun: 'language learning',
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
 */
export const formatGoalText = (subActivityId: SubActivity, frequency: number): string => {
  const config = getSubActivityConfig(subActivityId);
  if (!config) return `${frequency} times/week`;

  return `${config.actionVerb} ${frequency} times/week`;
};

/**
 * Helper function to format goal description
 */
export const formatGoalDescription = (subActivityId: SubActivity): string => {
  const config = getSubActivityConfig(subActivityId);
  if (!config) return 'Complete your goal';

  return `${config.actionVerb} ${config.actionNoun}`;
};
