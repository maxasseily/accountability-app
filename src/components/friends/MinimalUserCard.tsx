import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import { getUserRank } from '../../types/ranks';
import type { FriendProfile } from '../../types/friends';

interface MinimalUserCardProps {
  profile: FriendProfile;
  onAddPress: () => void;
  isLoading?: boolean;
  isPending?: boolean;
}

export default function MinimalUserCard({ profile, onAddPress, isLoading, isPending }: MinimalUserCardProps) {
  const rank = getUserRank(profile.user_rank);

  return (
    <BlurView intensity={20} tint="dark" style={styles.card}>
      <View style={styles.cardContent}>
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

        {/* Add Button or Pending State */}
        {isPending ? (
          <View style={[styles.button, styles.pendingButton]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.textMuted} />
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={onAddPress}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus" size={20} color={colors.textPrimary} />
                <Text style={styles.addText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
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
  addButton: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
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
