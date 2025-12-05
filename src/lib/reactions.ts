import { supabase } from './supabase';
import { ReactionType, PostReaction, ReactionCounts } from '../types/feed';

/**
 * Toggle a reaction on a post
 * If the user has already reacted with this type, it removes the reaction
 * If the user hasn't reacted with this type, it adds the reaction
 */
export async function toggleReaction(postId: string, reactionType: ReactionType): Promise<void> {
  const { error } = await supabase.rpc('toggle_post_reaction', {
    p_post_id: postId,
    p_reaction_type: reactionType,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get reaction counts for a post
 */
export async function getPostReactionCounts(postId: string): Promise<ReactionCounts> {
  const { data, error } = await supabase.rpc('get_post_reaction_counts', {
    p_post_id: postId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data || {};
}

/**
 * Get the current user's reactions for a post
 */
export async function getUserReactionsForPost(postId: string): Promise<ReactionType[]> {
  const { data, error } = await supabase.rpc('get_user_reactions_for_post', {
    p_post_id: postId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get all reactions for a post (with user info)
 */
export async function getPostReactions(postId: string): Promise<PostReaction[]> {
  const { data, error } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get reactions with user profile information
 */
export async function getPostReactionsWithUsers(postId: string) {
  const { data: reactions, error: reactionsError } = await supabase
    .from('post_reactions')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (reactionsError) {
    throw new Error(reactionsError.message);
  }

  if (!reactions || reactions.length === 0) {
    return [];
  }

  // Get profiles for all users who reacted
  const userIds = [...new Set(reactions.map(r => r.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', userIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  // Create a map of profiles by user_id
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Combine reactions with profiles
  return reactions.map(reaction => ({
    ...reaction,
    profile: profileMap.get(reaction.user_id),
  }));
}
