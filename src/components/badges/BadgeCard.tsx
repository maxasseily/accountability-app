// BadgeCard component - displays a single badge with press-to-view details

import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import { useState } from 'react';
import type { BadgeWithStatus } from '../../types/badges';
import { setDisplayedBadge } from '../../lib/badges';

interface BadgeCardProps {
  badge: BadgeWithStatus;
  userId: string;
  currentDisplayedBadgeId?: string | null;
  onDisplayBadgeSet?: () => void;
}

export default function BadgeCard({ badge, userId, currentDisplayedBadgeId, onDisplayBadgeSet }: BadgeCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isSettingDisplay, setIsSettingDisplay] = useState(false);

  const isCurrentlyDisplayed = currentDisplayedBadgeId === badge.id;

  const handleSetAsDisplayed = async () => {
    setIsSettingDisplay(true);
    try {
      const success = await setDisplayedBadge(userId, badge.id);
      if (success) {
        Alert.alert('Success!', `"${badge.name}" is now your displayed badge!`);
        setShowDetails(false);
        onDisplayBadgeSet?.();
      } else {
        Alert.alert('Error', 'Failed to set displayed badge. Please try again.');
      }
    } catch (error) {
      console.error('Error setting displayed badge:', error);
      Alert.alert('Error', 'Failed to set displayed badge. Please try again.');
    } finally {
      setIsSettingDisplay(false);
    }
  };

  return (
    <>
      {/* Badge Item */}
      <TouchableOpacity
        style={[styles.badgeItem, !badge.isEarned && styles.badgeItemLocked]}
        onPress={() => setShowDetails(true)}
        activeOpacity={0.7}
      >
        <View style={styles.badgeIconContainer}>
          {badge.isEarned ? (
            <LinearGradient
              colors={[colors.accent, colors.accentGlow]}
              style={styles.badgeIconGradient}
            >
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.badgeIconLocked}>
              <Text style={styles.badgeIconLockedText}>{badge.icon}</Text>
              <View style={styles.lockOverlay}>
                <MaterialCommunityIcons name="lock" size={24} color={colors.textMuted} />
              </View>
            </View>
          )}
        </View>
        <Text
          style={[styles.badgeName, !badge.isEarned && styles.badgeNameLocked]}
          numberOfLines={2}
        >
          {badge.name}
        </Text>
      </TouchableOpacity>

      {/* Badge Detail Modal */}
      <Modal
        visible={showDetails}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDetails(false)}
        >
          <View style={styles.modalContent}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <MaterialCommunityIcons name="close-circle" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Badge icon */}
            <View style={styles.modalIconContainer}>
              {badge.isEarned ? (
                <LinearGradient
                  colors={[colors.accent, colors.accentGlow]}
                  style={styles.modalIconGradient}
                >
                  <Text style={styles.modalIcon}>{badge.icon}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.modalIconLocked}>
                  <Text style={styles.modalIconLockedText}>{badge.icon}</Text>
                  <View style={styles.modalLockOverlay}>
                    <MaterialCommunityIcons name="lock" size={48} color={colors.textMuted} />
                  </View>
                </View>
              )}
            </View>

            {/* Badge name */}
            <Text style={styles.modalBadgeName}>{badge.name}</Text>

            {/* Badge description */}
            <Text style={styles.modalBadgeDescription}>{badge.description}</Text>

            {/* Earned status */}
            {badge.isEarned && badge.earnedAt && (
              <View style={styles.earnedBadge}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
                <Text style={styles.earnedText}>
                  Earned on {new Date(badge.earnedAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            {!badge.isEarned && (
              <View style={styles.lockedBadge}>
                <MaterialCommunityIcons name="lock" size={20} color={colors.textMuted} />
                <Text style={styles.lockedText}>Not yet earned</Text>
              </View>
            )}

            {/* Progress value (if available) */}
            {badge.isEarned && badge.progressValue !== undefined && (
              <Text style={styles.progressValue}>Progress: {badge.progressValue}</Text>
            )}

            {/* Set as Displayed Badge button (only for earned badges) */}
            {badge.isEarned && (
              <TouchableOpacity
                style={[styles.setDisplayButton, isCurrentlyDisplayed && styles.setDisplayButtonActive]}
                onPress={handleSetAsDisplayed}
                disabled={isSettingDisplay || isCurrentlyDisplayed}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isCurrentlyDisplayed
                    ? [colors.glassDark, colors.glassDark]
                    : [colors.accent, colors.accentGlow]
                  }
                  style={styles.setDisplayGradient}
                >
                  {isSettingDisplay ? (
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name={isCurrentlyDisplayed ? "star" : "star-outline"}
                        size={20}
                        color={colors.textPrimary}
                      />
                      <Text style={styles.setDisplayText}>
                        {isCurrentlyDisplayed ? 'Currently Displayed' : 'Set as Displayed Badge'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Badge item in grid
  badgeItem: {
    width: '30%',
    aspectRatio: 1,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeIconContainer: {
    marginBottom: 8,
  },
  badgeIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeIcon: {
    fontSize: 40,
  },
  badgeIconLocked: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.glassDark,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeIconLockedText: {
    fontSize: 40,
    opacity: 0.3,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: colors.textMuted,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: colors.backgroundStart,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 12,
  },
  modalIcon: {
    fontSize: 64,
  },
  modalIconLocked: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.glassDark,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalIconLockedText: {
    fontSize: 64,
    opacity: 0.3,
  },
  modalLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBadgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 255, 200, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  earnedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.glassDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  progressValue: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },

  // Set as Displayed Badge button
  setDisplayButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  setDisplayButtonActive: {
    opacity: 0.7,
  },
  setDisplayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  setDisplayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
