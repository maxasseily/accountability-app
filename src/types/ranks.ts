export interface UserRank {
  id: number;
  name: string;
  minCredibility: number;
  mojoCost: number;
  icon: string;
  color: string;
}

export const RANK_LADDER: UserRank[] = [
  {
    id: 1,
    name: 'Ritual Rookie',
    minCredibility: 0,
    mojoCost: 0,
    icon: 'egg-easter',
    color: '#9CA3AF', // Gray
  },
  {
    id: 2,
    name: 'Padawan Procrastinator',
    minCredibility: 60,
    mojoCost: 50,
    icon: 'account-clock',
    color: '#10B981', // Green
  },
  {
    id: 3,
    name: 'Accidental Achiever',
    minCredibility: 120,
    mojoCost: 100,
    icon: 'trophy-variant',
    color: '#3B82F6', // Blue
  },
  {
    id: 4,
    name: 'Bare-Minimum Benchwarmer',
    minCredibility: 240,
    mojoCost: 200,
    icon: 'seat',
    color: '#8B5CF6', // Purple
  },
  {
    id: 5,
    name: 'Half-Send Hero',
    minCredibility: 480,
    mojoCost: 400,
    icon: 'rocket-launch',
    color: '#F59E0B', // Amber
  },
  {
    id: 6,
    name: 'Casual Conqueror',
    minCredibility: 960,
    mojoCost: 800,
    icon: 'sword',
    color: '#EF4444', // Red
  },
  {
    id: 7,
    name: 'Grindset Guru',
    minCredibility: 1920,
    mojoCost: 1600,
    icon: 'fire',
    color: '#EC4899', // Pink
  },
  {
    id: 8,
    name: 'Grandmaster General',
    minCredibility: 3840,
    mojoCost: 3200,
    icon: 'crown',
    color: '#FFD700', // Gold
  },
];

// Helper function to get rank by ID
export const getRankById = (rankId: number): UserRank | undefined => {
  return RANK_LADDER.find(rank => rank.id === rankId);
};

// Helper function to get user's current rank based on their rank ID
export const getUserRank = (rankId: number): UserRank => {
  return getRankById(rankId) || RANK_LADDER[0];
};

// Helper function to check if user can upgrade to next rank
export const canUpgradeToRank = (
  currentRankId: number,
  targetRankId: number,
  userCredibility: number,
  userMojo: number
): { canUpgrade: boolean; missingCredibility?: number; missingMojo?: number } => {
  // Can only upgrade to the next rank (one level at a time)
  if (targetRankId !== currentRankId + 1) {
    return { canUpgrade: false };
  }

  const targetRank = getRankById(targetRankId);
  if (!targetRank) {
    return { canUpgrade: false };
  }

  const hasCredibility = userCredibility >= targetRank.minCredibility;
  const hasMojo = userMojo >= targetRank.mojoCost;

  if (hasCredibility && hasMojo) {
    return { canUpgrade: true };
  }

  return {
    canUpgrade: false,
    missingCredibility: hasCredibility ? undefined : targetRank.minCredibility - userCredibility,
    missingMojo: hasMojo ? undefined : targetRank.mojoCost - userMojo,
  };
};

// Helper function to get the minimum credibility to maintain a rank (10 below minimum)
export const getMinCredibilityToMaintainRank = (rankId: number): number => {
  const rank = getRankById(rankId);
  if (!rank || rankId === 1) return 0; // Ritual Rookie can't be demoted
  return Math.max(0, rank.minCredibility - 10);
};

// Helper function to check if user should be demoted
export const shouldBeDemoted = (rankId: number, userCredibility: number): boolean => {
  if (rankId === 1) return false; // Can't demote from Ritual Rookie
  const minToMaintain = getMinCredibilityToMaintainRank(rankId);
  return userCredibility < minToMaintain;
};

// Helper function to check if user is in warning zone (below min credibility but not yet 10 below)
export const isInWarningZone = (rankId: number, userCredibility: number): boolean => {
  if (rankId === 1) return false; // Ritual Rookie has no warning zone
  const rank = getRankById(rankId);
  if (!rank) return false;

  const minToMaintain = getMinCredibilityToMaintainRank(rankId);
  return userCredibility < rank.minCredibility && userCredibility >= minToMaintain;
};
