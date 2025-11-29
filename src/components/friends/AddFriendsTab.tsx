import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../utils/colors';
import { searchUsersByUsername, sendFriendRequest } from '../../utils/friends';
import UserProfileCard from './UserProfileCard';
import type { FriendProfile } from '../../types/friends';

interface AddFriendsTabProps {
  onRequestSent?: () => void;
}

export default function AddFriendsTab({ onRequestSent }: AddFriendsTabProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      try {
        const results = await searchUsersByUsername(searchQuery);
        setSearchResults(results);
        setHasSearched(true);
      } catch (err: any) {
        setError(err?.message || 'Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = useCallback(async (username: string, userId: string) => {
    setLoadingUserId(userId);
    setError(null);
    try {
      await sendFriendRequest(username);

      // Update search results to reflect pending status
      setSearchResults(prev => prev.map(result => {
        if (result.user_id === userId) {
          return {
            ...result,
            friendship_status: 'pending',
            requester_id: user?.id || null,
          };
        }
        return result;
      }));

      onRequestSent?.();
    } catch (err: any) {
      setError(err.message || 'Failed to send friend request');
    } finally {
      setLoadingUserId(null);
    }
  }, [user?.id, onRequestSent]);

  const getActionForProfile = (profile: FriendProfile): 'send_request' | 'pending_sent' | 'accept' | 'none' => {
    if (!profile.friendship_status) {
      return 'send_request';
    }
    if (profile.friendship_status === 'pending') {
      if (profile.requester_id === user?.id) {
        return 'pending_sent';
      }
      return 'accept';
    }
    if (profile.friendship_status === 'accepted') {
      return 'none';
    }
    return 'none';
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={24} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.accent} />
          )}
        </View>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasSearched && !searchQuery && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>Search for friends by username</Text>
            <Text style={styles.emptyStateSubtext}>
              Type a username above to find and add friends
            </Text>
          </View>
        )}

        {hasSearched && searchResults.length === 0 && !isSearching && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-off" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No users found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try searching with a different username
            </Text>
          </View>
        )}

        {searchResults.map((profile) => {
          const action = getActionForProfile(profile);
          return (
            <UserProfileCard
              key={profile.user_id}
              profile={profile}
              action={action}
              onActionPress={
                action === 'send_request'
                  ? () => handleSendRequest(profile.username, profile.user_id)
                  : undefined
              }
              isLoading={loadingUserId === profile.user_id}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
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
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
