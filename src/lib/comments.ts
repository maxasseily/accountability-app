import { supabase } from './supabase';
import { PostComment } from '../types/feed';

/**
 * Add a comment to a post
 */
export async function addComment(postId: string, commentText: string): Promise<PostComment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      comment_text: commentText.trim(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get all comments for a post (with user profile info)
 */
export async function getPostComments(postId: string): Promise<PostComment[]> {
  const { data: comments, error: commentsError } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  // Get profiles for all commenters (including their displayed badge)
  const commenterIds = [...new Set(comments.map(c => c.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      avatar_url,
      displayed_badge_id,
      badge:badges!profiles_displayed_badge_id_fkey(id, icon, name)
    `)
    .in('id', commenterIds);

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  // Create a map of profiles by user_id
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Combine comments with profiles
  const commentsWithProfiles: PostComment[] = comments.map(comment => {
    const profile = profileMap.get(comment.user_id);
    return {
      ...comment,
      profile: {
        id: comment.user_id,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
        displayed_badge: profile?.badge || null,
      },
    };
  });

  return commentsWithProfiles;
}

/**
 * Update a comment
 */
export async function updateComment(commentId: string, commentText: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .update({
      comment_text: commentText.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Subscribe to changes in comments for a post
 */
export function subscribeToPostComments(
  postId: string,
  callback: (comments: PostComment[]) => void
) {
  const subscription = supabase
    .channel(`post_comments_${postId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'post_comments',
        filter: `post_id=eq.${postId}`,
      },
      async () => {
        try {
          const comments = await getPostComments(postId);
          callback(comments);
        } catch (error) {
          console.error('Error in comment subscription:', error);
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Get comment count for a post
 */
export async function getPostCommentCount(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}
