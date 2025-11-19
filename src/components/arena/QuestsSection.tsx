import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { ArenaQuestWithProfiles, QuestType } from '../../types/arena';
import { getAcceptedQuestsForGroup, formatQuestDisplay } from '../../utils/arenaQuests';

// Gradient colors for each quest type (same as ArenaMemberList)
const QUEST_GRADIENTS: Record<QuestType, string[]> = {
  alliance: ['rgba(59, 130, 246, 0.4)', 'rgba(37, 99, 235, 0.2)', 'rgba(59, 130, 246, 0.1)'],
  battle: ['rgba(220, 38, 38, 0.4)', 'rgba(185, 28, 28, 0.2)', 'rgba(220, 38, 38, 0.1)'],
  prophecy: ['rgba(147, 51, 234, 0.4)', 'rgba(126, 34, 206, 0.2)', 'rgba(147, 51, 234, 0.1)'],
  curse: ['rgba(236, 72, 153, 0.4)', 'rgba(219, 39, 119, 0.2)', 'rgba(236, 72, 153, 0.1)'],
  speculation: ['rgba(218, 165, 32, 0.4)', 'rgba(184, 134, 11, 0.2)', 'rgba(218, 165, 32, 0.1)'], // Golden
};

interface QuestsSectionProps {
  groupId: string;
  refreshToken: number;
}

export default function QuestsSection({ groupId, refreshToken }: QuestsSectionProps) {
  const [quests, setQuests] = useState<ArenaQuestWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadQuests = useCallback(async () => {
    try {
      setIsLoading(true);
      const acceptedQuests = await getAcceptedQuestsForGroup(groupId);
      setQuests(acceptedQuests);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests, refreshToken]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quests</Text>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : quests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No ongoing quests - send your group members a challenge!</Text>
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
                        <Text style={styles.questText}>
                          {formatQuestDisplay(quest)}
                        </Text>
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
  questText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
