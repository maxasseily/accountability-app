import { supabase } from '../lib/supabase';
import { DailyPhoto } from './dailyPhoto';

export interface FeedPost extends DailyPhoto {
  profile: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    displayed_badge?: {
      id: string;
      icon: string;
      name: string;
    } | null;
  };
}

/**
 * Get the start of the current week (Monday)
 */
export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days, otherwise go to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get feed posts from friends and group members for the current week (Monday to Sunday)
 * Works without requiring group membership - shows friends' posts only if no group
 * Returns posts in chronological order (most recent first)
 */
export async function getGroupFeedPosts(): Promise<FeedPost[]> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const weekStart = getWeekStart();
    const weekStartStr = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch group members and friends in parallel
    const [groupMembersResult, friendshipsResult] = await Promise.all([
      supabase
        .from('group_members')
        .select('user_id, group_id')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .eq('status', 'accepted'),
    ]);

    // Collect user IDs to fetch posts from
    const userIdsSet = new Set<string>();

    // Add group members (if user is in a group)
    if (groupMembersResult.data) {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupMembersResult.data.group_id);

      groupMembers?.forEach(m => userIdsSet.add(m.user_id));
    }

    // Add friends
    friendshipsResult.data?.forEach(friendship => {
      const friendId = friendship.user_id_1 === user.id
        ? friendship.user_id_2
        : friendship.user_id_1;
      userIdsSet.add(friendId);
    });

    // If no group members or friends, return empty array
    // User can still use the app without a group or friends
    if (userIdsSet.size === 0) {
      return [];
    }

    const userIds = Array.from(userIdsSet);

    // Fetch all photos from group members and friends for the current week
    const { data: photos, error: photosError } = await supabase
      .from('daily_photos')
      .select('*')
      .in('user_id', userIds)
      .gte('date', weekStartStr)
      .order('date', { ascending: false })
      .order('uploaded_at', { ascending: false });

    if (photosError) {
      throw new Error(photosError.message);
    }

    if (!photos || photos.length === 0) {
      return [];
    }

    // Get profiles for all users who posted (including their displayed badge)
    const photoUserIds = [...new Set(photos.map(p => p.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        displayed_badge_id,
        badge:badges!profiles_displayed_badge_id_fkey(id, icon, name)
      `)
      .in('id', photoUserIds);

    if (profilesError) {
      throw new Error(profilesError.message);
    }

    // Create a map of profiles by user_id
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Combine photos with profiles
    const feedPosts: FeedPost[] = photos.map(photo => {
      const profile = profileMap.get(photo.user_id);
      return {
        ...photo,
        profile: {
          id: photo.user_id,
          username: profile?.username || 'Unknown',
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          displayed_badge: profile?.badge || null,
        },
      };
    });

    return feedPosts;
  } catch (error) {
    console.error('Error fetching group feed posts:', error);
    throw error;
  }
}

/**
 * Subscribe to changes in group feed (new photos, deleted photos, etc.)
 * Also subscribes to friendship changes to update feed when friends are added/removed
 */
export function subscribeToFeedChanges(
  callback: (posts: FeedPost[]) => void
) {
  // Subscribe to daily_photos changes
  const photosSubscription = supabase
    .channel('feed_photos_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_photos',
      },
      async () => {
        try {
          const posts = await getGroupFeedPosts();
          callback(posts);
        } catch (error) {
          // Silently fail
        }
      }
    )
    .subscribe();

  // Subscribe to friendships changes (to update feed when friends are added/removed)
  const friendshipsSubscription = supabase
    .channel('feed_friendships_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friendships',
      },
      async () => {
        try {
          const posts = await getGroupFeedPosts();
          callback(posts);
        } catch (error) {
          // Silently fail
        }
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    photosSubscription.unsubscribe();
    friendshipsSubscription.unsubscribe();
  };
}
