import { supabase } from './supabase';
import type { UserStatistics } from '../types/statistics';
import type { SubActivity } from '../types/goals';

export function mapRowToUserStatistics(row: any): UserStatistics {
  return {
    userId: row.user_id,
    credibility: row.credibility,
    lifetimeGoalsLogged: row.lifetime_goals_logged,
    mojo: row.mojo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface GroupMemberStats {
  userId: string;
  fullName: string | null;
  credibility: number;
  subActivity: SubActivity | null;
  isCurrentUser: boolean;
}

export async function getOrCreateUserStatistics(userId: string): Promise<UserStatistics> {
  const { data, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createUserStatistics(userId);
    }
    throw error;
  }

  return mapRowToUserStatistics(data);
}

export async function getUserStatistics(userId: string): Promise<UserStatistics | null> {
  const { data, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No statistics found - return default values
      return {
        userId,
        credibility: 50,
        lifetimeGoalsLogged: 0,
        mojo: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    throw error;
  }

  return mapRowToUserStatistics(data);
}

export async function createUserStatistics(userId: string): Promise<UserStatistics> {
  const { data, error } = await supabase
    .from('user_statistics')
    .upsert(
      {
        user_id: userId,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapRowToUserStatistics(data);
}

export async function getGroupMemberStats(groupId: string, currentUserId: string): Promise<GroupMemberStats[]> {
  // Get all group members
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  if (membersError) {
    throw membersError;
  }

  if (!members || members.length === 0) {
    return [];
  }

  const userIds = members.map(m => m.user_id);

  // Fetch profiles, statistics, and goals for all members in parallel
  const [profilesResult, statisticsResult, goalsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds),
    supabase
      .from('user_statistics')
      .select('user_id, credibility')
      .in('user_id', userIds),
    supabase
      .from('user_goals')
      .select('user_id, sub_activity')
      .in('user_id', userIds),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (statisticsResult.error) throw statisticsResult.error;
  if (goalsResult.error) throw goalsResult.error;

  // Create lookup maps
  const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p.full_name]) || []);
  const statisticsMap = new Map(statisticsResult.data?.map(s => [s.user_id, s.credibility]) || []);
  const goalsMap = new Map(goalsResult.data?.map(g => [g.user_id, g.sub_activity]) || []);

  // Combine the data
  const result = userIds.map(userId => ({
    userId,
    fullName: profilesMap.get(userId) || 'Unknown',
    credibility: statisticsMap.get(userId) || 50,
    subActivity: goalsMap.get(userId) || null,
    isCurrentUser: userId === currentUserId,
  }));

  // Sort by credibility descending
  return result.sort((a, b) => b.credibility - a.credibility);
}
