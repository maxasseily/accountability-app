import { supabase } from './supabase';
import type { UserStatistics } from '../types/statistics';

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
