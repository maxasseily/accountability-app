import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useState } from 'react';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { ArenaQuestWithProfiles } from '../../types/arena';
import { getAcceptedQuestsForGroup, formatQuestDisplay } from '../../utils/arenaQuests';

interface QuestsSectionProps {
  groupId: string;
  currentUserId: string;
  refreshToken: number;
}

export default function QuestsSection({ groupId, currentUserId, refreshToken }: QuestsSectionProps) {
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
                <View key={quest.id} style={styles.questItem}>
                  <Text style={styles.questIcon}>
                    {quest.quest_type === 'alliance' && '🤝'}
                    {quest.quest_type === 'battle' && '⚔️'}
                    {quest.quest_type === 'prophecy' && '🔮'}
                    {quest.quest_type === 'curse' && '💀'}
                  </Text>
                  <Text style={styles.questText}>
                    {formatQuestDisplay(quest, currentUserId)}
                  </Text>
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
  questItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.paddingSmall,
    paddingHorizontal: spacing.paddingMedium,
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  questIcon: {
    fontSize: 24,
    marginRight: spacing.paddingMedium,
  },
  questText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
