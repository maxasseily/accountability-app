import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, RefreshControl, Modal, Pressable, Dimensions, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';
import { spacing } from '../../src/utils/spacing';
import { getGroupFeedPosts, subscribeToFeedChanges, FeedPost } from '../../src/utils/feed';
import { useAuth } from '../../src/context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    try {
      const feedPosts = await getGroupFeedPosts();
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading feed posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadPosts();
    } catch (error) {
      console.error('Error refreshing feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadPosts]);

  // Load posts on mount and subscribe to changes
  useEffect(() => {
    loadPosts();

    // Subscribe to real-time changes
    const unsubscribe = subscribeToFeedChanges((newPosts) => {
      setPosts(newPosts);
    });

    return () => {
      unsubscribe();
    };
  }, [loadPosts]);

  // Reload posts when screen comes into focus (e.g., after uploading from home)
  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [loadPosts])
  );

  if (isLoading) {
    return (
      <GradientBackground>
        <StatusBar style="light" hidden={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: spacing.screenPaddingTopCompact + insets.top },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <View style={styles.headerWithButton}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>This Week's Feed</Text>
            <Text style={styles.subheaderText}>
              Posts from your group and friends
            </Text>
          </View>
          <TouchableOpacity
            style={styles.friendsButton}
            onPress={() => router.push('/(app)/friends')}
          >
            <MaterialCommunityIcons name="account-multiple" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="image-off-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No posts yet this week</Text>
            <Text style={styles.emptyStateSubtext}>
              Add friends or join a group to see their daily photos here
            </Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.avatarContainer}>
                    {post.profile.avatar_url ? (
                      <Image
                        source={{ uri: post.profile.avatar_url }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {post.profile.username?.[0]?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.postInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>
                        {post.profile.username || 'Unknown User'}
                        {post.user_id === user?.id && (
                          <Text style={styles.youBadge}> (You)</Text>
                        )}
                      </Text>
                      {post.profile.displayed_badge && (
                        <Text style={styles.badgeIcon} title={post.profile.displayed_badge.name}>
                          {post.profile.displayed_badge.icon}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.postDate}>
                      {new Date(post.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.postTimestamp}>
                      {new Date(post.uploaded_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelectedImage(post.photo_url)}>
                  <Image
                    source={{ uri: post.photo_url }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Image Zoom Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalCloseButton}
            onPress={() => setSelectedImage(null)}
          >
            <MaterialCommunityIcons name="close" size={32} color={colors.textPrimary} />
          </Pressable>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.zoomedImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.screenPaddingTopCompact,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.screenPaddingBottom,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subheaderText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  friendsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  postsContainer: {
    gap: 24,
  },
  postCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: 16,
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
  postTimestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
    opacity: 0.8,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  zoomedImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
