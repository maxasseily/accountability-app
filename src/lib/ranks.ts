import { supabase } from './supabase';
import { RANK_LADDER, getUserRank, canUpgradeToRank, type UserRank } from '../types/ranks';
import { checkMojoBadges } from './badges';

export interface RankUpgradeResult {
  success: boolean;
  newMojo?: number;
  errorMessage?: string;
}

/**
 * Upgrades a user's rank by calling the database function
 */
export async function upgradeUserRank(
  userId: string,
  newRankId: number
): Promise<RankUpgradeResult> {
  try {
    const { data, error } = await supabase.rpc('upgrade_user_rank', {
      p_user_id: userId,
      p_new_rank: newRankId,
    });

    if (error) {
      console.error('Error upgrading rank:', error);
      return {
        success: false,
        errorMessage: error.message || 'Failed to upgrade rank',
      };
    }

    // The function returns a single row with success, new_mojo, and error_message
    if (data && data.length > 0) {
      const result = data[0];

      // Check for Big Spender badge after successful rank upgrade
      if (result.success) {
        checkMojoBadges(userId).catch(err => console.error('Error checking mojo badges:', err));
      }

      return {
        success: result.success,
        newMojo: result.new_mojo,
        errorMessage: result.error_message,
      };
    }

    return {
      success: false,
      errorMessage: 'No response from server',
    };
  } catch (error) {
    console.error('Exception upgrading rank:', error);
    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets the user's current rank information
 */
export function getUserRankInfo(rankId: number): UserRank {
  return getUserRank(rankId);
}

/**
 * Checks if a user can upgrade to the next rank
 */
export function checkCanUpgradeRank(
  currentRankId: number,
  userCredibility: number,
  userMojo: number
): {
  canUpgrade: boolean;
  nextRank?: UserRank;
  missingCredibility?: number;
  missingMojo?: number;
  message?: string;
} {
  const nextRankId = currentRankId + 1;

  // Check if there is a next rank
  if (nextRankId > RANK_LADDER.length) {
    return {
      canUpgrade: false,
      message: 'You are already at the maximum rank!',
    };
  }

  const nextRank = RANK_LADDER.find(r => r.id === nextRankId);
  if (!nextRank) {
    return {
      canUpgrade: false,
      message: 'Invalid rank',
    };
  }

  const result = canUpgradeToRank(currentRankId, nextRankId, userCredibility, userMojo);

  if (result.canUpgrade) {
    return {
      canUpgrade: true,
      nextRank,
    };
  }

  // Build message based on what's missing
  const messages: string[] = [];
  if (result.missingCredibility !== undefined && result.missingCredibility > 0) {
    messages.push(`${result.missingCredibility} more credibility`);
  }
  if (result.missingMojo !== undefined && result.missingMojo > 0) {
    messages.push(`${Math.round(result.missingMojo)} more mojo`);
  }

  const message = messages.length > 0
    ? `You need ${messages.join(' and ')} to upgrade.`
    : 'Cannot upgrade at this time.';

  return {
    canUpgrade: false,
    nextRank,
    missingCredibility: result.missingCredibility,
    missingMojo: result.missingMojo,
    message,
  };
}
