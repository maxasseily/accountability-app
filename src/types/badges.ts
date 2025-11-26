// Badge types for the achievement system

export type BadgeCategory = 'streak' | 'quest' | 'mojo' | 'milestone' | 'special';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon identifier
  category: BadgeCategory;
  sortOrder: number;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  progressValue?: number;
  badge?: Badge; // Joined badge data
}

// Client-side badge with earned status
export interface BadgeWithStatus extends Badge {
  isEarned: boolean;
  earnedAt?: string;
  progressValue?: number;
}

// Badge progress tracking (for badges not yet earned)
export interface BadgeProgress {
  badgeId: string;
  current: number;
  target: number;
  percentage: number;
}
