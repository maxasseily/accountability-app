import type { UserGoal } from './goals';

export interface UserStatistics {
  userId: string;
  credibility: number;
  lifetimeGoalsLogged: number;
  mojo: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalCompletionResult {
  goal: UserGoal;
  statistics: UserStatistics;
  mojoGained?: number;
  weeklyGoalCompleted?: boolean;
  hasAllianceBonus?: boolean;
}

export interface UserNotification {
  id: string;
  userId: string;
  notificationType: 'alliance_success' | 'alliance_failure';
  title: string;
  message: string;
  mojoChange: number;
  questId: string | null;
  isRead: boolean;
  createdAt: string;
}
