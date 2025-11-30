import { View, Text, StyleSheet, ScrollView, Image, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import ReactionBar from '../../../src/components/feed/ReactionBar';
import { colors } from '../../../src/utils/colors';
import { spacing } from '../../../src/utils/spacing';
import { PostComment } from '../../../src/types/feed';
import { getPostComments, addComment, deleteComment, subscribeToPostComments } from '../../../src/lib/comments';
import { useAuth } from '../../../src/context/AuthContext';

export default function PostCommentsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Parse the post data from route params
  const postId = params.postId as string;
  const postUserId = params.postUserId as string;
  const postUserName = params.postUserName as string;
  const postUserAvatar = params.postUserAvatar as string | undefined;
  const postPhotoUrl = params.postPhotoUrl as string;
  const postDate = params.postDate as string;
  const postBadgeIcon = params.postBadgeIcon as string | undefined;

  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const isOwnPost = postUserId === user?.id;

  // Load comments and subscribe to changes
  useEffect(() => {
    loadComments();

    const unsubscribe = subscribeToPostComments(postId, (newComments) => {
      setComments(newComments);
    });

    return () => {
      unsubscribe();
    };
  }, [postId]);

  const loadComments = async () => {
    try {
      const fetchedComments = await getPostComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await addComment(postId, commentText);
      setCommentText('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsDeleting(commentId);
    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{postUserName}'s Post</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Post Card */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.avatarContainer}>
                {postUserAvatar ? (
                  <Image
                    source={{ uri: postUserAvatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                      {postUserName?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.postInfo}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userName}>
                    {postUserName || 'Unknown User'}
                    {isOwnPost && <Text style={styles.youBadge}> (You)</Text>}
                  </Text>
                  {postBadgeIcon && (
                    <Text style={styles.badgeIcon}>{postBadgeIcon}</Text>
                  )}
                </View>
                <Text style={styles.postDate}>
                  {new Date(postDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <Image
              source={{ uri: postPhotoUrl }}
              style={styles.postImage}
              resizeMode="cover"
            />

            {/* Reactions */}
            <ReactionBar postId={postId} />
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsHeader}>
              Comments ({comments.length})
            </Text>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyStateText}>No comments yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  {isOwnPost
                    ? 'Your friends and group members can comment here'
                    : 'Be the first to comment!'}
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => {
                  const isOwnComment = comment.user_id === user?.id;
                  return (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <View style={styles.avatarContainer}>
                          {comment.profile?.avatar_url ? (
                            <Image
                              source={{ uri: comment.profile.avatar_url }}
                              style={styles.commentAvatar}
                            />
                          ) : (
                            <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                              <Text style={styles.commentAvatarText}>
                                {comment.profile?.username?.[0]?.toUpperCase() || '?'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.commentContent}>
                          <View style={styles.commentMetaRow}>
                            <Text style={styles.commentUserName}>
                              {comment.profile?.username || 'Unknown'}
                              {comment.profile?.displayed_badge && (
                                <Text> {comment.profile.displayed_badge.icon}</Text>
                              )}
                            </Text>
                            <Text style={styles.commentTimestamp}>
                              {formatTimestamp(comment.created_at)}
                            </Text>
                          </View>
                          <Text style={styles.commentText}>{comment.comment_text}</Text>
                        </View>
                        {isOwnComment && (
                          <TouchableOpacity
                            onPress={() => handleDeleteComment(comment.id)}
                            disabled={isDeleting === comment.id}
                            style={styles.deleteButton}
                          >
                            {isDeleting === comment.id ? (
                              <ActivityIndicator size="small" color={colors.textMuted} />
                            ) : (
                              <MaterialCommunityIcons
                                name="delete-outline"
                                size={18}
                                color={colors.textMuted}
                              />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={1000}
            editable={!isSubmitting}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingVertical: 16,
  },
  postCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 24,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarPlaceholder: {
    backgroundColor: colors.glassLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
  },
  postInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  badgeIcon: {
    fontSize: 18,
  },
  youBadge: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.accent,
  },
  postDate: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  commentsSection: {
    flex: 1,
  },
  commentsHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 40,
  },
  commentsList: {
    gap: 12,
  },
  commentCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.accent,
  },
  commentContent: {
    flex: 1,
  },
  commentMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  commentTimestamp: {
    fontSize: 12,
    color: colors.textMuted,
  },
  commentText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 3,
    borderTopColor: colors.accent,
    backgroundColor: 'rgba(0, 255, 255, 0.15)',
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundStart + '80',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
});
