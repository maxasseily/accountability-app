// Badge system library - client-side helpers for managing badges

import { supabase } from './supabase';
import type { Badge, UserBadge, BadgeWithStatus } from '../types/badges';

/**
 * Fetch all available badges from the database
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching badges:', error);
    throw error;
  }

  return (data || []).map(mapBadgeFromDb);
}

/**
 * Fetch badges earned by a specific user
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user badges:', error);
    throw error;
  }

  return (data || []).map(mapUserBadgeFromDb);
}

/**
 * Fetch all badges with earned status for a user
 * This combines all available badges with the user's earned badges
 */
export async function getBadgesWithStatus(userId: string): Promise<BadgeWithStatus[]> {
  // Fetch all badges and user badges in parallel
  const [allBadges, userBadges] = await Promise.all([
    getAllBadges(),
    getUserBadges(userId),
  ]);

  // Create a map of earned badges for quick lookup
  const earnedBadgesMap = new Map(
    userBadges.map((ub) => [
      ub.badgeId,
      { earnedAt: ub.earnedAt, progressValue: ub.progressValue },
    ])
  );

  // Combine all badges with earned status
  return allBadges.map((badge) => {
    const earned = earnedBadgesMap.get(badge.id);
    return {
      ...badge,
      isEarned: !!earned,
      earnedAt: earned?.earnedAt,
      progressValue: earned?.progressValue,
    };
  });
}

/**
 * Award a badge to a user (called from client after an achievement)
 */
export async function awardBadge(
  userId: string,
  badgeId: string,
  progressValue?: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('award_badge', {
    p_user_id: userId,
    p_badge_id: badgeId,
    p_progress_value: progressValue,
  });

  if (error) {
    console.error('Error awarding badge:', error);
    return false;
  }

  return data as boolean;
}

/**
 * Check and award streak badges after a goal is logged
 */
export async function checkStreakBadges(userId: string): Promise<void> {
  const { error } = await supabase.rpc('check_and_award_streak_badges', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking streak badges:', error);
  }
}

/**
 * Check and award time-based badges (night owl, early bird)
 */
export async function checkTimeBadges(
  userId: string,
  timestamp: Date = new Date()
): Promise<void> {
  const { error } = await supabase.rpc('check_and_award_time_badges', {
    p_user_id: userId,
    p_timestamp: timestamp.toISOString(),
  });

  if (error) {
    console.error('Error checking time badges:', error);
  }
}

/**
 * Check quest-related badges based on user statistics
 */
export async function checkQuestBadges(userId: string): Promise<void> {
  // Fetch user statistics
  const { data: stats, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !stats) {
    console.error('Error fetching user stats for badge check:', error);
    return;
  }

  // Check Alliance Master (25 alliance quests)
  if (stats.alliance_quests_completed >= 25) {
    await awardBadge(userId, 'alliance_master', stats.alliance_quests_completed);
  }

  // Check Gladiator (15 battle wins)
  if (stats.battle_quests_won >= 15) {
    await awardBadge(userId, 'gladiator', stats.battle_quests_won);
  }

  // Check Warmonger (10 speculation wins betting AGAINST)
  if (stats.speculation_bets_won_against >= 10) {
    await awardBadge(userId, 'warmonger', stats.speculation_bets_won_against);
  }

  // Check Prophet (10 speculation wins betting FOR)
  if (stats.speculation_bets_won_for >= 10) {
    await awardBadge(userId, 'prophet', stats.speculation_bets_won_for);
  }

  // Check Peacemaker (20 speculation resolutions)
  if (stats.speculation_quests_resolved >= 20) {
    await awardBadge(userId, 'peacemaker', stats.speculation_quests_resolved);
  }
}

/**
 * Check mojo-related badges
 */
export async function checkMojoBadges(userId: string): Promise<void> {
  const { data: stats, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !stats) {
    console.error('Error fetching user stats for mojo badge check:', error);
    return;
  }

  // Check Mojo Millionaire (1000 lifetime mojo earned)
  if (stats.lifetime_mojo_earned >= 1000) {
    await awardBadge(userId, 'mojo_millionaire', stats.lifetime_mojo_earned);
  }

  // Check Big Spender (500 mojo spent on ranks)
  if (stats.lifetime_mojo_spent_on_ranks >= 500) {
    await awardBadge(userId, 'big_spender', stats.lifetime_mojo_spent_on_ranks);
  }
}

/**
 * Check milestone badges
 */
export async function checkMilestoneBadges(userId: string): Promise<void> {
  const { data: stats, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !stats) {
    console.error('Error fetching user stats for milestone badge check:', error);
    return;
  }

  // Check First Steps (1 goal logged)
  if (stats.lifetime_goals_logged >= 1) {
    await awardBadge(userId, 'first_steps', 1);
  }
}

/**
 * Check for High Roller badge (win speculation with 100+ mojo)
 * This should be called when a speculation is resolved
 */
export async function checkHighRollerBadge(
  userId: string,
  mojoWon: number
): Promise<void> {
  if (mojoWon >= 100) {
    await awardBadge(userId, 'high_roller', mojoWon);
  }
}

/**
 * Check for Underdog badge (win with 3:1 or worse odds)
 * This should be called when a speculation is resolved
 */
export async function checkUnderdogBadge(
  userId: string,
  odds: number,
  won: boolean
): Promise<void> {
  if (won && odds >= 3.0) {
    await awardBadge(userId, 'underdog', odds);
  }
}

// Helper functions to map database snake_case to camelCase
function mapBadgeFromDb(dbBadge: any): Badge {
  return {
    id: dbBadge.id,
    name: dbBadge.name,
    description: dbBadge.description,
    icon: dbBadge.icon,
    category: dbBadge.category,
    sortOrder: dbBadge.sort_order,
    createdAt: dbBadge.created_at,
  };
}

function mapUserBadgeFromDb(dbUserBadge: any): UserBadge {
  return {
    id: dbUserBadge.id,
    userId: dbUserBadge.user_id,
    badgeId: dbUserBadge.badge_id,
    earnedAt: dbUserBadge.earned_at,
    progressValue: dbUserBadge.progress_value,
    badge: dbUserBadge.badge ? mapBadgeFromDb(dbUserBadge.badge) : undefined,
  };
}
