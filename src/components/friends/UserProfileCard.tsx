import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { getUserRank } from '../../types/ranks';
import { getSubActivityConfig } from '../../utils/goalConfig';
import type { FriendProfile, Friend, PendingFriendRequest } from '../../types/friends';

interface UserProfileCardProps {
  profile: FriendProfile | Friend | PendingFriendRequest;
  action?: 'send_request' | 'accept' | 'remove' | 'pending_sent' | 'none';
  onActionPress?: () => void;
  isLoading?: boolean;
}

export default function UserProfileCard({
  profile,
  action = 'none',
  onActionPress,
  isLoading = false,
}: UserProfileCardProps) {
  const rank = getUserRank(profile.user_rank);

  // Determine goal display text
  const getGoalDisplay = () => {
    if ('goal_type' in profile && profile.goal_type && profile.sub_activity) {
      const subActivityConfig = getSubActivityConfig(profile.sub_activity as any);
      return subActivityConfig?.name || profile.goal_type;
    }
    return 'No goal set';
  };

  // Determine action button
  const renderActionButton = () => {
    if (isLoading) {
      return (
        <View style={styles.actionButton}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      );
    }

    switch (action) {
      case 'send_request':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
            <MaterialCommunityIcons name="account-plus" size={24} color={colors.accent} />
            <Text style={styles.actionButtonText}>Add</Text>
          </TouchableOpacity>
        );
      case 'accept':
        return (
          <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
            <MaterialCommunityIcons name="check" size={24} color={colors.accent} />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        );
      case 'remove':
        return (
          <TouchableOpacity style={styles.actionButtonDanger} onPress={onActionPress}>
            <MaterialCommunityIcons name="account-remove" size={24} color={colors.error} />
            <Text style={styles.actionButtonTextDanger}>Remove</Text>
          </TouchableOpacity>
        );
      case 'pending_sent':
        return (
          <View style={styles.actionButtonDisabled}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={colors.textMuted} />
            <Text style={styles.actionButtonTextDisabled}>Pending</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.profileSection}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {profile.username?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {/* Rank icon overlay */}
          <View style={styles.rankBadge}>
            <MaterialCommunityIcons name={rank.icon as any} size={20} color={rank.color} />
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>{profile.username}</Text>
            {profile.displayed_badge_icon && (
              <Text style={styles.badgeIcon}>
                {profile.displayed_badge_icon}
              </Text>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Rank</Text>
              <Text style={styles.statValue}>{rank.name}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Credibility</Text>
              <Text style={styles.statValue}>{profile.credibility}</Text>
            </View>
          </View>

          {/* Goal */}
          {'goal_type' in profile && (
            <View style={styles.goalRow}>
              <MaterialCommunityIcons name="target" size={16} color={colors.textMuted} />
              <Text style={styles.goalText}>{getGoalDisplay()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Button */}
      {renderActionButton()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glassLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  avatarPlaceholder: {
    backgroundColor: colors.glassLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.backgroundStart,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  infoSection: {
    flex: 1,
    gap: 6,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  badgeIcon: {
    fontSize: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.glassBorder,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.glassLight,
    minWidth: 60,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  actionButtonDanger: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.glassLight,
    minWidth: 60,
  },
  actionButtonTextDanger: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  actionButtonDisabled: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassLight,
    minWidth: 60,
  },
  actionButtonTextDisabled: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
