import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import { getUserRank } from '../../types/ranks';
import { getSubActivityConfig } from '../../utils/goalConfig';
import type { Friend, PendingFriendRequest } from '../../types/friends';

interface FriendDetailsModalProps {
  visible: boolean;
  profile: Friend | PendingFriendRequest | null;
  onClose: () => void;
  onRemoveFriend?: () => void;
  isRemoving?: boolean;
}

export default function FriendDetailsModal({
  visible,
  profile,
  onClose,
  onRemoveFriend,
  isRemoving,
}: FriendDetailsModalProps) {
  if (!profile) return null;

  const rank = getUserRank(profile.user_rank);
  const goalConfig = profile.sub_activity ? getSubActivityConfig(profile.sub_activity as any) : null;

  // Format numbers with commas
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <BlurView intensity={40} tint="dark" style={styles.modalBlur}>
            <View style={styles.modalInner}>
              {/* Header with Close Button */}
              <View style={styles.header}>
                <Text style={styles.title}>Friend Details</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={28} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Large Rank Circle */}
              <View style={styles.avatarSection}>
                <View style={[styles.rankCircle, { backgroundColor: rank.color }]}>
                  <MaterialCommunityIcons
                    name={rank.icon as any}
                    size={48}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              {/* Username */}
              <Text style={styles.username}>{profile.username}</Text>

              {/* Rank Name */}
              <Text style={styles.rankName}>{rank.name}</Text>

              {/* Badge */}
              {profile.displayed_badge_icon && (
                <View style={styles.badgeSection}>
                  <Text style={styles.badgeIcon}>{profile.displayed_badge_icon}</Text>
                  {profile.displayed_badge_name && (
                    <Text style={styles.badgeName}>{profile.displayed_badge_name}</Text>
                  )}
                </View>
              )}

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="shield-check" size={20} color={colors.accent} />
                  <Text style={styles.statLabel}>Credibility</Text>
                  <Text style={styles.statValue}>{formatNumber(profile.credibility)}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="circle-multiple" size={20} color={colors.warning} />
                  <Text style={styles.statLabel}>Mojo</Text>
                  <Text style={styles.statValue}>{formatNumber(profile.mojo)}</Text>
                </View>
              </View>

              {/* Goal Section */}
              <View style={styles.goalSection}>
                {goalConfig ? (
                  <View style={styles.goalContent}>
                    <MaterialCommunityIcons
                      name={goalConfig.icon as any}
                      size={24}
                      color={colors.accent}
                    />
                    <Text style={styles.goalText}>{goalConfig.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.noGoalText}>No goal set</Text>
                )}
              </View>

              {/* Remove Friend Button */}
              {onRemoveFriend && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={onRemoveFriend}
                  disabled={isRemoving}
                  activeOpacity={0.7}
                >
                  {isRemoving ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="account-remove" size={20} color={colors.error} />
                      <Text style={styles.removeButtonText}>Remove Friend</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  modalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  modalInner: {
    backgroundColor: colors.glassLight,
    padding: spacing.paddingXl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.paddingXl,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.paddingLarge,
  },
  rankCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.paddingSmall,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.paddingLarge,
  },
  badgeSection: {
    alignItems: 'center',
    marginBottom: spacing.paddingLarge,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: spacing.paddingSmall,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    padding: spacing.paddingMedium,
    marginBottom: spacing.paddingLarge,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.glassBorder,
    marginHorizontal: spacing.paddingSmall,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  goalSection: {
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    padding: spacing.paddingMedium,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.paddingSmall,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noGoalText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.textMuted,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.paddingSmall,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: spacing.paddingLarge,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
