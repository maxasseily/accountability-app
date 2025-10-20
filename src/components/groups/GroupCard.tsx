import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';
import type { GroupWithMembers } from '../../types/groups';

interface GroupCardProps {
  group: GroupWithMembers;
  onLeaveGroup?: () => void;
}

export default function GroupCard({ group, onLeaveGroup }: GroupCardProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my accountability group "${group.name}"!\n\nAccess Code: ${group.access_code}`,
        title: 'Join My Group',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <LinearGradient
          colors={[colors.glassLight, colors.glassDark]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.groupName}>{group.name}</Text>
            <View style={styles.memberCount}>
              <Text style={styles.memberCountText}>
                {group.member_count}/6
              </Text>
            </View>
          </View>

          <View style={styles.accessCodeContainer}>
            <Text style={styles.accessCodeLabel}>Access Code</Text>
            <View style={styles.accessCodeBox}>
              <Text style={styles.accessCode}>{group.access_code}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[colors.secondaryStart, colors.secondaryEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareGradient}
              >
                <Text style={styles.shareButtonText}>Share Code</Text>
              </LinearGradient>
            </TouchableOpacity>

            {onLeaveGroup && (
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={onLeaveGroup}
                activeOpacity={0.7}
              >
                <Text style={styles.leaveButtonText}>Leave Group</Text>
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    flex: 1,
  },
  memberCount: {
    backgroundColor: colors.glassLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  memberCountText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  accessCodeContainer: {
    marginBottom: 20,
  },
  accessCodeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  accessCodeBox: {
    backgroundColor: colors.glassDark,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  accessCode: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  leaveButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
