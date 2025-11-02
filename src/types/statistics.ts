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
}
