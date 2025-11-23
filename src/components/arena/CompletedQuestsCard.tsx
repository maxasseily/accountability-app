import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { ArenaQuestWithProfiles, QuestType } from '../../types/arena';
import { getCompletedQuestsForGroup, getResolvedSpeculationsForGroup, formatQuestDisplay } from '../../utils/arenaQuests';

// Gradient colors for each quest type
const QUEST_GRADIENTS: Record<QuestType, string[]> = {
  alliance: ['rgba(59, 130, 246, 0.4)', 'rgba(37, 99, 235, 0.2)', 'rgba(59, 130, 246, 0.1)'],
  battle: ['rgba(220, 38, 38, 0.4)', 'rgba(185, 28, 28, 0.2)', 'rgba(220, 38, 38, 0.1)'],
  prophecy: ['rgba(147, 51, 234, 0.4)', 'rgba(126, 34, 206, 0.2)', 'rgba(147, 51, 234, 0.1)'],
  curse: ['rgba(236, 72, 153, 0.4)', 'rgba(219, 39, 119, 0.2)', 'rgba(236, 72, 153, 0.1)'],
  speculation: ['rgba(218, 165, 32, 0.4)', 'rgba(184, 134, 11, 0.2)', 'rgba(218, 165, 32, 0.1)'],
};

interface CompletedQuestsCardProps {
  groupId: string;
  currentUserId: string;
  refreshToken: number;
}

export default function CompletedQuestsCard({ groupId, currentUserId, refreshToken }: CompletedQuestsCardProps) {
  const [quests, setQuests] = useState<ArenaQuestWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuests = useCallback(async () => {
    try {
      setIsLoading(true);
      const [completedQuests, resolvedSpeculations] = await Promise.all([
        getCompletedQuestsForGroup(groupId),
        getResolvedSpeculationsForGroup(groupId),
      ]);
      // Combine completed quests and resolved speculations
      setQuests([...completedQuests, ...resolvedSpeculations]);
    } catch (error) {
      console.error('Error loading completed quests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests, refreshToken]);

  const renderQuestDetails = (quest: ArenaQuestWithProfiles) => {
    // Special rendering for speculation
    if (quest.quest_type === 'speculation') {
      const creatorName = quest.sender_profile.full_name || quest.sender_profile.email.split('@')[0];
      const accepterName = quest.receiver_profile.full_name || quest.receiver_profile.email.split('@')[0];

      // Determine winner based on result and creator's side
      const creatorWon = quest.speculation_result === quest.speculation_creator_side;
      const winnerId = creatorWon ? quest.sender_id : quest.speculation_accepter_id;
      const winnerName = creatorWon ? creatorName : accepterName;
      const loserName = creatorWon ? accepterName : creatorName;

      const totalPot = (quest.mojo_stake || 0) * 2;
      const isUserInvolved = currentUserId === quest.sender_id || currentUserId === quest.speculation_accepter_id;
      const didUserWin = winnerId === currentUserId;

      const resultLabel = quest.speculation_result ? 'YES' : 'NO';
      const resultColor = quest.speculation_result ? '#10b981' : '#ef4444';

      return (
        <>
          <Text style={styles.questDescription}>"{quest.speculation_description}"</Text>
          <View style={[styles.resultBadge, { backgroundColor: `${resultColor}33`, borderColor: `${resultColor}66` }]}>
            <Text style={[styles.resultText, { color: resultColor }]}>
              Result: {resultLabel}
            </Text>
          </View>
          <View style={styles.resultsContainer}>
            <View style={styles.winnerLoserRow}>
              <View style={styles.winnerBox}>
                <Text style={styles.resultBoxLabel}>🏆 Winner</Text>
                <Text style={styles.resultBoxName}>{winnerName}</Text>
                <Text style={styles.winnerPayout}>+{totalPot} mojo</Text>
              </View>
              <View style={styles.loserBox}>
                <Text style={styles.resultBoxLabel}>🤡 Loser</Text>
                <Text style={styles.resultBoxName}>{loserName}</Text>
                <Text style={styles.loserLoss}>-{quest.mojo_stake} mojo</Text>
              </View>
            </View>
          </View>
          {isUserInvolved && (
            <View style={[styles.userResultBanner, didUserWin ? styles.userWinBanner : styles.userLossBanner]}>
              <Text style={styles.userResultText}>
                {didUserWin ? `You won ${totalPot} mojo! 🎉` : `You lost ${quest.mojo_stake} mojo`}
              </Text>
            </View>
          )}
        </>
      );
    }

    // Default rendering for other quest types
    const statusEmoji = quest.prophecy_curse_status === 'won' ? '✅' :
                       quest.prophecy_curse_status === 'lost' ? '❌' :
                       quest.prophecy_curse_status === 'refunded' ? '↩️' : '✔️';

    return (
      <View style={styles.questHeader}>
        <Text style={styles.questText}>
          {formatQuestDisplay(quest)}
        </Text>
        <Text style={styles.statusEmoji}>
          {statusEmoji}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completed Quests</Text>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : quests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No completed quests</Text>
            </View>
          ) : (
            <View style={styles.questsList}>
              {quests.map((quest) => (
                <View key={quest.id} style={styles.questItemWrapper}>
                  <LinearGradient
                    colors={QUEST_GRADIENTS[quest.quest_type] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.questGradient}
                  >
                    <BlurView intensity={10} tint="dark" style={styles.questBlur}>
                      <View style={styles.questItem}>
                        {renderQuestDetails(quest)}
                      </View>
                    </BlurView>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}
        </View>
      </BlurView>
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
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statusEmoji: {
    fontSize: 20,
    marginLeft: spacing.paddingSmall,
  },
  questDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: spacing.paddingSmall,
  },
  resultBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: spacing.paddingSmall,
  },
  resultText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultsContainer: {
    marginVertical: spacing.paddingSmall,
    paddingTop: spacing.paddingSmall,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  winnerLoserRow: {
    flexDirection: 'row',
    gap: spacing.paddingMedium,
    justifyContent: 'space-between',
  },
  winnerBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingVertical: spacing.paddingMedium,
    paddingHorizontal: spacing.paddingSmall,
  },
  loserBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: spacing.paddingMedium,
    paddingHorizontal: spacing.paddingSmall,
  },
  resultBoxLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  resultBoxName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  winnerPayout: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  loserLoss: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ef4444',
  },
  userResultBanner: {
    marginTop: spacing.paddingSmall,
    paddingVertical: spacing.paddingMedium,
    paddingHorizontal: spacing.paddingMedium,
    borderRadius: 8,
    alignItems: 'center',
  },
  userWinBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  userLossBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  userResultText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
