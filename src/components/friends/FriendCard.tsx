import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import { getUserRank } from '../../types/ranks';
import type { Friend, PendingFriendRequest } from '../../types/friends';

interface FriendCardProps {
  profile: Friend | PendingFriendRequest;
  action?: 'accept' | 'remove' | 'pending_sent' | 'view';
  onActionPress?: () => void;
  onCardPress?: () => void;
  isLoading?: boolean;
}

export default function FriendCard({ profile, action, onActionPress, onCardPress, isLoading }: FriendCardProps) {
  const rank = getUserRank(profile.user_rank);

  const renderActionButton = () => {
    if (action === 'pending_sent') {
      return (
        <View style={[styles.button, styles.pendingButton]}>
          <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      );
    }

    if (action === 'accept') {
      return (
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={onActionPress}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <>
              <MaterialCommunityIcons name="check" size={20} color={colors.textPrimary} />
              <Text style={styles.acceptText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    if (action === 'remove') {
      return (
        <TouchableOpacity
          style={[styles.button, styles.removeButton]}
          onPress={onActionPress}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <MaterialCommunityIcons name="account-remove" size={24} color={colors.error} />
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const CardWrapper = onCardPress ? TouchableOpacity : View;

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      <CardWrapper
        style={styles.cardContent}
        onPress={onCardPress}
        activeOpacity={onCardPress ? 0.7 : 1}
      >
        {/* Rank Icon Circle */}
        <View style={[styles.rankCircle, { backgroundColor: rank.color }]}>
          <MaterialCommunityIcons
            name={rank.icon as any}
            size={28}
            color="#FFFFFF"
          />
        </View>

        {/* Username and Rank Name */}
        <View style={styles.userInfo}>
          <Text style={styles.username} numberOfLines={1}>
            {profile.username}
          </Text>
          <Text style={styles.rankName} numberOfLines={1}>
            {rank.name}
          </Text>
        </View>

        {/* Action Button */}
        {renderActionButton()}
      </CardWrapper>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.paddingMedium,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.glassLight,
  },
  rankCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.paddingMedium,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: spacing.paddingSmall,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rankName: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: colors.success,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  removeButton: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: 8,
    minWidth: 40,
  },
  pendingButton: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
