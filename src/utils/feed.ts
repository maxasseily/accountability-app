import { supabase } from '../lib/supabase';
import { DailyPhoto } from './dailyPhoto';

export interface FeedPost extends DailyPhoto {
  profile: {
    id: string;
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
 * Get group members' photos for the current week (Monday to Sunday)
 * Returns posts in chronological order (oldest first)
 */
export async function getGroupFeedPosts(): Promise<FeedPost[]> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get user's group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (!membership) {
      return []; // User is not in a group
    }

    // Get all group members
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', membership.group_id);

    if (membersError) {
      throw new Error(membersError.message);
    }

    if (!groupMembers || groupMembers.length === 0) {
      return [];
    }

    // Get the start of the current week (Monday)
    const weekStart = getWeekStart();
    const weekStartStr = weekStart.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get member IDs
    const memberIds = groupMembers.map(m => m.user_id);

    // Fetch all photos from group members for the current week (most recent first)
    const { data: photos, error: photosError } = await supabase
      .from('daily_photos')
      .select('*')
      .in('user_id', memberIds)
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
    const userIds = [...new Set(photos.map(p => p.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        avatar_url,
        displayed_badge_id,
        badge:badges!profiles_displayed_badge_id_fkey(id, icon, name)
      `)
      .in('id', userIds);

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
      async (payload) => {
        console.log('Feed subscription received change:', payload.eventType);
        try {
          const posts = await getGroupFeedPosts();
          callback(posts);
        } catch (error) {
          console.error('Error refreshing feed after change:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log('Feed subscription status:', status);
    });

  // Return cleanup function
  return () => {
    photosSubscription.unsubscribe();
  };
}
