import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { GroupMemberWithProfile } from '../../types/groups';
import type { QuestType } from '../../types/arena';

interface ArenaGridProps {
  members: GroupMemberWithProfile[];
  currentUserId: string;
  onQuestSelect: (questType: QuestType, targetMember: GroupMemberWithProfile) => void;
  onSpeculationSelect: () => void;
}

interface ArenaAction {
  id: QuestType | 'speculation' | 'coming-soon';
  label: string;
  icon: string;
  color: string;
}

const ARENA_ACTIONS: ArenaAction[] = [
  {
    id: 'alliance',
    label: 'Alliance',
    icon: '🤝',
    color: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'battle',
    label: 'Battle',
    icon: '⚔️',
    color: 'rgba(220, 38, 38, 0.15)',
  },
  {
    id: 'prophecy',
    label: 'Prophecy',
    icon: '🔮',
    color: 'rgba(147, 51, 234, 0.15)',
  },
  {
    id: 'curse',
    label: 'Curse',
    icon: '💀',
    color: 'rgba(236, 72, 153, 0.15)',
  },
  {
    id: 'speculation',
    label: 'Speculation',
    icon: '🌀',
    color: 'rgba(218, 165, 32, 0.15)',
  },
  {
    id: 'coming-soon',
    label: 'Coming Soon',
    icon: '⏳',
    color: 'rgba(100, 100, 100, 0.15)',
  },
];

const ACTION_GRADIENTS: Record<string, string[]> = {
  alliance: ['rgba(59, 130, 246, 0.4)', 'rgba(37, 99, 235, 0.2)', 'rgba(59, 130, 246, 0.1)'],
  battle: ['rgba(220, 38, 38, 0.4)', 'rgba(185, 28, 28, 0.2)', 'rgba(220, 38, 38, 0.1)'],
  prophecy: ['rgba(147, 51, 234, 0.4)', 'rgba(126, 34, 206, 0.2)', 'rgba(147, 51, 234, 0.1)'],
  curse: ['rgba(236, 72, 153, 0.4)', 'rgba(219, 39, 119, 0.2)', 'rgba(236, 72, 153, 0.1)'],
  speculation: ['rgba(218, 165, 32, 0.4)', 'rgba(184, 134, 11, 0.2)', 'rgba(218, 165, 32, 0.1)'],
  'coming-soon': ['rgba(100, 100, 100, 0.4)', 'rgba(80, 80, 80, 0.2)', 'rgba(100, 100, 100, 0.1)'],
};

export default function ArenaGrid({ members, currentUserId, onQuestSelect, onSpeculationSelect }: ArenaGridProps) {
  const [showMemberSelect, setShowMemberSelect] = useState(false);
  const [selectedQuestType, setSelectedQuestType] = useState<QuestType | null>(null);

  const handleActionPress = (action: ArenaAction) => {
    if (action.id === 'coming-soon') {
      // Do nothing for coming soon
      return;
    }

    if (action.id === 'speculation') {
      onSpeculationSelect();
      return;
    }

    // For alliance, battle, prophecy, curse - show member selector
    setSelectedQuestType(action.id as QuestType);
    setShowMemberSelect(true);
  };

  const handleMemberSelect = (member: GroupMemberWithProfile) => {
    if (selectedQuestType) {
      onQuestSelect(selectedQuestType, member);
    }
    setShowMemberSelect(false);
    setSelectedQuestType(null);
  };

  const handleCloseMemberSelect = () => {
    setShowMemberSelect(false);
    setSelectedQuestType(null);
  };

  // Filter out current user from member selection
  const selectableMembers = members.filter(m => m.user_id !== currentUserId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>The Arena</Text>
        <Text style={styles.subtitle}>Make predictions, or duel your group members</Text>
      </View>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          <View style={styles.grid}>
            {ARENA_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.gridItem}
                onPress={() => handleActionPress(action)}
                activeOpacity={action.id === 'coming-soon' ? 1 : 0.7}
                disabled={action.id === 'coming-soon'}
              >
                <LinearGradient
                  colors={ACTION_GRADIENTS[action.id] as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gridItemGradient}
                >
                  <BlurView intensity={10} tint="dark" style={styles.gridItemBlur}>
                    <View style={styles.gridItemContent}>
                      <Text style={[
                        styles.gridItemIcon,
                        action.id === 'coming-soon' && styles.comingSoonIcon
                      ]}>
                        {action.icon}
                      </Text>
                      <Text style={[
                        styles.gridItemLabel,
                        action.id === 'coming-soon' && styles.comingSoonLabel
                      ]}>
                        {action.label}
                      </Text>
                    </View>
                  </BlurView>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BlurView>

      {/* Member Selection Modal */}
      <Modal
        visible={showMemberSelect}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseMemberSelect}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseMemberSelect}>
          <Pressable style={styles.memberModalContent} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={40} tint="dark" style={styles.memberModalBlur}>
              <View style={styles.memberModalInner}>
                <View style={styles.memberModalHeader}>
                  <Text style={styles.memberModalTitle}>Select a Member</Text>
                  <TouchableOpacity onPress={handleCloseMemberSelect} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={28} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.membersList}>
                  {selectableMembers.map((member) => {
                    const displayName = member.profile.username || member.profile.email.split('@')[0] || 'user';
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={styles.memberItem}
                        onPress={() => handleMemberSelect(member)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.memberName}>{displayName}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </BlurView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  gradient: {
    padding: 16,
    backgroundColor: colors.glassLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.paddingSmall,
  },
  gridItem: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.paddingSmall,
  },
  gridItemGradient: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  gridItemBlur: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridItemContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.paddingMedium,
  },
  gridItemIcon: {
    fontSize: 42,
    marginBottom: spacing.paddingSmall,
  },
  gridItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  comingSoonIcon: {
    opacity: 0.5,
  },
  comingSoonLabel: {
    opacity: 0.5,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberModalContent: {
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  memberModalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  memberModalInner: {
    backgroundColor: colors.glassLight,
    padding: spacing.paddingXl,
  },
  memberModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.paddingXl,
  },
  memberModalTitle: {
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
  membersList: {
    gap: spacing.paddingMedium,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.paddingMedium,
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
