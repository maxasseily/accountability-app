import type { UserGoal } from './goals';

export interface UserStatistics {
  userId: string;
  credibility: number;
  lifetimeGoalsLogged: number;
  mojo: number;
  userRank: number;
  createdAt: string;
  updatedAt: string;
}

export interface GoalCompletionResult {
  goal: UserGoal;
  statistics: UserStatistics;
  mojoGained?: number;
  credibilityGained?: number; // NEW: Credibility gained from this goal log
  weeklyGoalCompleted?: boolean;
  hasAllianceBonus?: boolean;
}

export interface UserNotification {
  id: string;
  userId: string;
  notificationType:
    | 'alliance_success'
    | 'alliance_failure'
    | 'weekly_bonus'     // NEW: Weekly goal completion bonus
    | 'weekly_penalty';  // NEW: Weekly goal failure penalty
  title: string;
  message: string;
  mojoChange: number;
  questId: string | null;
  isRead: boolean;
  createdAt: string;
}
