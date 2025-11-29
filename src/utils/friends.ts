import { supabase } from '../lib/supabase';
import type { FriendProfile, Friend, PendingFriendRequest } from '../types/friends';

/**
 * Search for users by username (case-insensitive prefix search)
 */
export async function searchUsersByUsername(query: string): Promise<FriendProfile[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('search_users_by_username', {
      search_query: query.trim(),
      limit_count: 10,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Send a friend request to a user by username
 */
export async function sendFriendRequest(username: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('send_friend_request', {
      target_username: username,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('accept_friend_request', {
      friendship_id: friendshipId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Remove a friend (bidirectional deletion)
 */
export async function removeFriend(friendshipId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('remove_friend', {
      friendship_id: friendshipId,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Get all accepted friends
 */
export async function getFriends(): Promise<Friend[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, user_id_1, user_id_2')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'accepted');

    if (error) {
      throw error;
    }

    if (!friendships || friendships.length === 0) {
      return [];
    }

    // Get friend user IDs
    const friendUserIds = friendships.map(f =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );

    // Fetch friend profiles with statistics
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        avatar_url,
        displayed_badge_id,
        badge:badges!profiles_displayed_badge_id_fkey(icon, name)
      `)
      .in('id', friendUserIds);

    if (profilesError) {
      throw profilesError;
    }

    // Fetch statistics separately for all friend user IDs
    const { data: statistics, error: statsError } = await supabase
      .from('user_statistics')
      .select('user_id, credibility, user_rank')
      .in('user_id', friendUserIds);

    if (statsError) {
      throw statsError;
    }

    // Create a map of statistics by user_id
    const statsMap = new Map(statistics?.map(s => [s.user_id, s]) || []);

    // Combine friendships with profiles
    const friends: Friend[] = profiles?.map(profile => {
      const friendship = friendships.find(f =>
        f.user_id_1 === profile.id || f.user_id_2 === profile.id
      );

      const stats = statsMap.get(profile.id);

      return {
        user_id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        friendship_id: friendship!.id,
        user_rank: stats?.user_rank || 1,
        credibility: stats?.credibility || 50,
        displayed_badge_icon: (profile.badge as any)?.icon || null,
        displayed_badge_name: (profile.badge as any)?.name || null,
      };
    }) || [];

    return friends;
  } catch (error) {
    throw error;
  }
}

/**
 * Get pending friend requests (both sent and received)
 */
export async function getPendingRequests(): Promise<{
  received: PendingFriendRequest[];
  sent: PendingFriendRequest[];
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('id, user_id_1, user_id_2, requester_id')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'pending');

    if (error) {
      throw error;
    }

    if (!friendships || friendships.length === 0) {
      return { received: [], sent: [] };
    }

    // Separate received vs sent requests
    const receivedFriendships = friendships.filter(f => f.requester_id !== user.id);
    const sentFriendships = friendships.filter(f => f.requester_id === user.id);

    // Get user IDs
    const receivedUserIds = receivedFriendships.map(f =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );
    const sentUserIds = sentFriendships.map(f =>
      f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
    );

    const allUserIds = [...receivedUserIds, ...sentUserIds];

    if (allUserIds.length === 0) {
      return { received: [], sent: [] };
    }

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        avatar_url,
        displayed_badge_id,
        badge:badges!profiles_displayed_badge_id_fkey(icon, name)
      `)
      .in('id', allUserIds);

    if (profilesError) {
      throw profilesError;
    }

    // Fetch statistics separately
    const { data: statistics, error: statsError } = await supabase
      .from('user_statistics')
      .select('user_id, credibility, user_rank')
      .in('user_id', allUserIds);

    if (statsError) {
      throw statsError;
    }

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const statsMap = new Map(statistics?.map(s => [s.user_id, s]) || []);

    // Map received requests
    const received: PendingFriendRequest[] = receivedFriendships.map(f => {
      const otherUserId = f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1;
      const profile = profileMap.get(otherUserId);
      const stats = statsMap.get(otherUserId);

      return {
        friendship_id: f.id,
        user_id: otherUserId,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        user_rank: stats?.user_rank || 1,
        credibility: stats?.credibility || 50,
        displayed_badge_icon: (profile?.badge as any)?.icon || null,
        displayed_badge_name: (profile?.badge as any)?.name || null,
        is_requester: false,
      };
    });

    // Map sent requests
    const sent: PendingFriendRequest[] = sentFriendships.map(f => {
      const otherUserId = f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1;
      const profile = profileMap.get(otherUserId);
      const stats = statsMap.get(otherUserId);

      return {
        friendship_id: f.id,
        user_id: otherUserId,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        user_rank: stats?.user_rank || 1,
        credibility: stats?.credibility || 50,
        displayed_badge_icon: (profile?.badge as any)?.icon || null,
        displayed_badge_name: (profile?.badge as any)?.name || null,
        is_requester: true,
      };
    });

    return { received, sent };
  } catch (error) {
    throw error;
  }
}

/**
 * Get friend count for a user
 */
export async function getFriendCount(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('get_friend_count', {
      target_user_id: userId,
    });

    if (error) {
      throw error;
    }

    return data || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Subscribe to friendship changes (real-time)
 */
export function subscribeToFriendshipChanges(callback: () => void) {
  const subscription = supabase
    .channel('friendships_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friendships',
      },
      () => {
        callback();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}
