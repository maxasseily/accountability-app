import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { ArenaQuestWithProfiles, QuestType } from '../../types/arena';
import { getAcceptedQuestsForGroup, getAcceptedSpeculationsForGroup, formatQuestDisplay, resolveSpeculationQuest } from '../../utils/arenaQuests';

// Gradient colors for each quest type
const QUEST_GRADIENTS: Record<QuestType, string[]> = {
  alliance: ['rgba(59, 130, 246, 0.4)', 'rgba(37, 99, 235, 0.2)', 'rgba(59, 130, 246, 0.1)'],
  battle: ['rgba(220, 38, 38, 0.4)', 'rgba(185, 28, 28, 0.2)', 'rgba(220, 38, 38, 0.1)'],
  prophecy: ['rgba(147, 51, 234, 0.4)', 'rgba(126, 34, 206, 0.2)', 'rgba(147, 51, 234, 0.1)'],
  curse: ['rgba(236, 72, 153, 0.4)', 'rgba(219, 39, 119, 0.2)', 'rgba(236, 72, 153, 0.1)'],
  speculation: ['rgba(218, 165, 32, 0.4)', 'rgba(184, 134, 11, 0.2)', 'rgba(218, 165, 32, 0.1)'],
};

interface OngoingQuestsCardProps {
  groupId: string;
  currentUserId: string;
  refreshToken: number;
  onRefresh: () => void;
}

export default function OngoingQuestsCard({ groupId, currentUserId, refreshToken, onRefresh }: OngoingQuestsCardProps) {
  const [quests, setQuests] = useState<ArenaQuestWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpeculation, setSelectedSpeculation] = useState<ArenaQuestWithProfiles | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const loadQuests = useCallback(async () => {
    try {
      setIsLoading(true);
      const [acceptedQuests, acceptedSpeculations] = await Promise.all([
        getAcceptedQuestsForGroup(groupId),
        getAcceptedSpeculationsForGroup(groupId),
      ]);
      // Combine quests and speculations
      setQuests([...acceptedQuests, ...acceptedSpeculations]);
    } catch (error) {
      console.error('Error loading ongoing quests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests, refreshToken]);

  const handleOpenResolveModal = (speculation: ArenaQuestWithProfiles) => {
    setSelectedSpeculation(speculation);
    setShowResolveModal(true);
  };

  const handleCloseResolveModal = () => {
    setShowResolveModal(false);
    setSelectedSpeculation(null);
  };

  const handleResolveSpeculation = async (result: boolean) => {
    if (!selectedSpeculation) return;

    try {
      setIsResolving(true);
      await resolveSpeculationQuest(selectedSpeculation.id, result);
      handleCloseResolveModal();
      loadQuests();
      onRefresh();
    } catch (error) {
      console.error('Error resolving speculation:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const canResolveSpeculation = (quest: ArenaQuestWithProfiles): boolean => {
    if (quest.quest_type !== 'speculation') return false;
    // User must not be a participant
    return currentUserId !== quest.sender_id && currentUserId !== quest.speculation_accepter_id;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ongoing Quests</Text>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : quests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No ongoing quests</Text>
            </View>
          ) : (
            <View style={styles.questsList}>
              {quests.map((quest) => {
                const canResolve = canResolveSpeculation(quest);
                return (
                  <View key={quest.id} style={styles.questItemWrapper}>
                    <LinearGradient
                      colors={QUEST_GRADIENTS[quest.quest_type] as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.questGradient}
                    >
                      <BlurView intensity={10} tint="dark" style={styles.questBlur}>
                        <View style={styles.questItem}>
                          <Text style={styles.questText}>
                            {formatQuestDisplay(quest)}
                          </Text>
                          {canResolve && (
                            <TouchableOpacity
                              style={styles.resolveButton}
                              onPress={() => handleOpenResolveModal(quest)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.resolveButtonText}>Resolve</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </BlurView>
                    </LinearGradient>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </BlurView>

      {/* Resolve Speculation Modal */}
      <Modal
        visible={showResolveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseResolveModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseResolveModal}>
          <Pressable style={styles.resolveModalContent} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={40} tint="dark" style={styles.resolveModalBlur}>
              <View style={styles.resolveModalInner}>
                <Text style={styles.modalIcon}>⚖️</Text>
                <Text style={styles.modalTitle}>Resolve Speculation</Text>
                {selectedSpeculation && (
                  <>
                    <Text style={styles.resolveDescription}>
                      "{selectedSpeculation.speculation_description}"
                    </Text>
                    <Text style={styles.resolveQuestion}>Did this happen?</Text>
                    <View style={styles.resolveButtons}>
                      <TouchableOpacity
                        style={[styles.resolveOptionButton, styles.resolveYesButton]}
                        onPress={() => handleResolveSpeculation(true)}
                        disabled={isResolving}
                        activeOpacity={0.7}
                      >
                        {isResolving ? (
                          <ActivityIndicator size="small" color={colors.textPrimary} />
                        ) : (
                          <Text style={styles.resolveOptionText}>Yes</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.resolveOptionButton, styles.resolveNoButton]}
                        onPress={() => handleResolveSpeculation(false)}
                        disabled={isResolving}
                        activeOpacity={0.7}
                      >
                        {isResolving ? (
                          <ActivityIndicator size="small" color={colors.textPrimary} />
                        ) : (
                          <Text style={styles.resolveOptionText}>No</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
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
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  questsList: {
    gap: spacing.paddingMedium,
  },
  questItemWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  questGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  questBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  questItem: {
    paddingVertical: spacing.paddingSmall,
    paddingHorizontal: spacing.paddingMedium,
  },
  questText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  resolveButton: {
    backgroundColor: '#DAA520',
    paddingVertical: spacing.paddingSmall,
    paddingHorizontal: spacing.paddingMedium,
    borderRadius: 8,
    marginTop: spacing.paddingSmall,
    alignItems: 'center',
  },
  resolveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.backgroundStart,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resolveModalContent: {
    width: '85%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  resolveModalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  resolveModalInner: {
    backgroundColor: colors.glassLight,
    padding: spacing.paddingXl,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: spacing.paddingMedium,
    textAlign: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.paddingXs,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  resolveDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.paddingLarge,
  },
  resolveQuestion: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.paddingLarge,
  },
  resolveButtons: {
    flexDirection: 'row',
    gap: spacing.paddingMedium,
    width: '100%',
  },
  resolveOptionButton: {
    flex: 1,
    paddingVertical: spacing.paddingLarge,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveYesButton: {
    backgroundColor: '#10b981',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  resolveNoButton: {
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  resolveOptionText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
