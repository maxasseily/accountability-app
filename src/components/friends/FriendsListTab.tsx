import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import {
  getFriends,
  getPendingRequests,
  acceptFriendRequest,
  removeFriend,
  subscribeToFriendshipChanges,
} from '../../utils/friends';
import UserProfileCard from './UserProfileCard';
import type { Friend, PendingFriendRequest } from '../../types/friends';

export default function FriendsListTab() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{
    received: PendingFriendRequest[];
    sent: PendingFriendRequest[];
  }>({ received: [], sent: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingFriendshipId, setLoadingFriendshipId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFriendsData = useCallback(async () => {
    try {
      const [friendsList, requests] = await Promise.all([
        getFriends(),
        getPendingRequests(),
      ]);

      setFriends(friendsList);
      setPendingRequests(requests);
      setError(null);
    } catch (err) {
      setError('Failed to load friends');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFriendsData();
  }, [loadFriendsData]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFriendsData();
    }, [loadFriendsData])
  );

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubscribe = subscribeToFriendshipChanges(() => {
      loadFriendsData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadFriendsData]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadFriendsData();
  }, [loadFriendsData]);

  const handleAcceptRequest = useCallback(async (friendshipId: string) => {
    setLoadingFriendshipId(friendshipId);
    setError(null);
    try {
      await acceptFriendRequest(friendshipId);
      await loadFriendsData();
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError(err.message || 'Failed to accept friend request');
    } finally {
      setLoadingFriendshipId(null);
    }
  }, [loadFriendsData]);

  const handleRemoveFriend = useCallback(async (friendshipId: string) => {
    setLoadingFriendshipId(friendshipId);
    setError(null);
    try {
      await removeFriend(friendshipId);
      await loadFriendsData();
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError(err.message || 'Failed to remove friend');
    } finally {
      setLoadingFriendshipId(null);
    }
  }, [loadFriendsData]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const totalFriends = friends.length;
  const totalPending = pendingRequests.received.length + pendingRequests.sent.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* My Friends Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account-group" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>My Friends</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalFriends}</Text>
          </View>
        </View>

        {totalFriends > 0 ? (
          <View style={styles.cardContent}>
            {friends.map((friend) => (
              <UserProfileCard
                key={friend.friendship_id}
                profile={friend}
                action="remove"
                onActionPress={() => handleRemoveFriend(friend.friendship_id)}
                isLoading={loadingFriendshipId === friend.friendship_id}
              />
            ))}
          </View>
        ) : (
          <View style={styles.cardEmptyState}>
            <Text style={styles.cardEmptyText}>No friends yet</Text>
            <Text style={styles.cardEmptySubtext}>
              Add friends to see them here
            </Text>
          </View>
        )}
      </View>

      {/* Pending Requests Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account-clock" size={24} color={colors.accent} />
          <Text style={styles.cardTitle}>Pending Requests</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalPending}</Text>
          </View>
        </View>

        {totalPending > 0 ? (
          <View style={styles.cardContent}>
            {/* Incoming Requests */}
            {pendingRequests.received.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>
                  Incoming ({pendingRequests.received.length})
                </Text>
                {pendingRequests.received.map((request) => (
                  <UserProfileCard
                    key={request.friendship_id}
                    profile={request}
                    action="accept"
                    onActionPress={() => handleAcceptRequest(request.friendship_id)}
                    isLoading={loadingFriendshipId === request.friendship_id}
                  />
                ))}
              </View>
            )}

            {/* Outgoing Requests */}
            {pendingRequests.sent.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>
                  Outgoing ({pendingRequests.sent.length})
                </Text>
                {pendingRequests.sent.map((request) => (
                  <UserProfileCard
                    key={request.friendship_id}
                    profile={request}
                    action="pending_sent"
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cardEmptyState}>
            <Text style={styles.cardEmptyText}>No pending requests</Text>
            <Text style={styles.cardEmptySubtext}>
              Send friend requests from the "Add Friends" tab
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
  },
  card: {
    backgroundColor: colors.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardContent: {
    padding: 16,
  },
  cardEmptyState: {
    padding: 40,
    alignItems: 'center',
  },
  cardEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  cardEmptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
