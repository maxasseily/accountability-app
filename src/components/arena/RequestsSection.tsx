import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { ArenaQuestWithProfiles } from '../../types/arena';
import { getPendingQuestsForUser, respondToArenaQuest } from '../../utils/arenaQuests';

interface RequestsSectionProps {
  currentUserId: string;
  refreshToken: number;
  onRefresh: () => void;
}

export default function RequestsSection({ currentUserId, refreshToken, onRefresh }: RequestsSectionProps) {
  const [requests, setRequests] = useState<ArenaQuestWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingToId, setRespondingToId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const pendingRequests = await getPendingQuestsForUser(currentUserId);
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests, refreshToken]);

  const handleRespond = async (questId: string, accept: boolean) => {
    try {
      setRespondingToId(questId);
      await respondToArenaQuest(questId, accept);

      // Remove the request from the list
      setRequests((prev) => prev.filter((req) => req.id !== questId));

      // Refresh parent to update quests list if accepted
      onRefresh();
    } catch (error) {
      console.error('Error responding to quest:', error);
    } finally {
      setRespondingToId(null);
    }
  };

  const getRequestIcon = (questType: string) => {
    switch (questType) {
      case 'alliance':
        return '🤝';
      case 'battle':
        return '⚔️';
      case 'prophecy':
        return '🔮';
      case 'curse':
        return '💀';
      default:
        return '❓';
    }
  };

  const getRequestText = (request: ArenaQuestWithProfiles, isSender: boolean) => {
    if (isSender) {
      // Sent request - show who we're waiting for
      const receiverName =
        request.receiver_profile.full_name ||
        request.receiver_profile.email.split('@')[0];

      switch (request.quest_type) {
        case 'alliance':
          return `Waiting for ${receiverName} to accept alliance`;
        case 'battle':
          return `Waiting for ${receiverName} to accept battle`;
        case 'prophecy':
          return `Waiting for ${receiverName} to accept prophecy`;
        case 'curse':
          return `Waiting for ${receiverName} to accept curse`;
        default:
          return `Waiting for ${receiverName} to respond`;
      }
    } else {
      // Received request - show who sent it
      const senderName =
        request.sender_profile.full_name ||
        request.sender_profile.email.split('@')[0];

      switch (request.quest_type) {
        case 'alliance':
          return `${senderName} wants to form an alliance`;
        case 'battle':
          return `${senderName} challenges you to battle`;
        case 'prophecy':
          return `${senderName} wants to make a prophecy`;
        case 'curse':
          return `${senderName} wants to curse you`;
        default:
          return `${senderName} sent you a request`;
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Requests</Text>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pending requests</Text>
            </View>
          ) : (
            <View style={styles.requestsList}>
              {requests.map((request) => {
                const isSender = request.sender_id === currentUserId;
                return (
                  <View key={request.id} style={styles.requestItem}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestIcon}>
                        {isSender ? '⏳' : getRequestIcon(request.quest_type)}
                      </Text>
                      <Text style={styles.requestText}>{getRequestText(request, isSender)}</Text>
                    </View>

                    {!isSender && (
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleRespond(request.id, false)}
                          disabled={respondingToId === request.id}
                          activeOpacity={0.7}
                        >
                          {respondingToId === request.id ? (
                            <ActivityIndicator size="small" color={colors.textSecondary} />
                          ) : (
                            <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleRespond(request.id, true)}
                          disabled={respondingToId === request.id}
                          activeOpacity={0.7}
                        >
                          {respondingToId === request.id ? (
                            <ActivityIndicator size="small" color={colors.backgroundStart} />
                          ) : (
                            <MaterialCommunityIcons name="check" size={20} color={colors.backgroundStart} />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
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
  requestsList: {
    gap: spacing.paddingMedium,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.paddingSmall,
    paddingHorizontal: spacing.paddingMedium,
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.paddingMedium,
  },
  requestIcon: {
    fontSize: 24,
    marginRight: spacing.paddingMedium,
  },
  requestText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.paddingSmall,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectButton: {
    backgroundColor: colors.glassDark,
    borderColor: colors.glassBorder,
  },
  acceptButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
