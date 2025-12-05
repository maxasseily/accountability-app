import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { colors } from '../../utils/colors';
import { REACTION_EMOJIS, ReactionType, ReactionCounts } from '../../types/feed';
import { toggleReaction, getPostReactionCounts, getUserReactionsForPost, getPostReactionsWithUsers } from '../../lib/reactions';

interface ReactionBarProps {
  postId: string;
}

export default function ReactionBar({ postId }: ReactionBarProps) {
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({});
  const [userReactions, setUserReactions] = useState<ReactionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showReactorsModal, setShowReactorsModal] = useState(false);
  const [selectedReactionType, setSelectedReactionType] = useState<ReactionType | null>(null);
  const [reactorsWithProfiles, setReactorsWithProfiles] = useState<any[]>([]);

  // Load initial reaction data
  useEffect(() => {
    loadReactions();
  }, [postId]);

  const loadReactions = async () => {
    try {
      const [counts, userRxns] = await Promise.all([
        getPostReactionCounts(postId),
        getUserReactionsForPost(postId),
      ]);
      setReactionCounts(counts);
      setUserReactions(userRxns);
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  };

  const handleReactionPress = async (reactionType: ReactionType) => {
    setIsLoading(true);
    try {
      await toggleReaction(postId, reactionType);
      // Reload reactions after toggle
      await loadReactions();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasUserReacted = (reactionType: ReactionType): boolean => {
    return userReactions.includes(reactionType);
  };

  const getCount = (reactionType: ReactionType): number => {
    return reactionCounts[reactionType] || 0;
  };

  const handleLongPress = async (reactionType: ReactionType) => {
    const count = getCount(reactionType);
    if (count === 0) return;

    try {
      const reactionsWithUsers = await getPostReactionsWithUsers(postId);
      const filtered = reactionsWithUsers.filter(r => r.reaction_type === reactionType);
      setReactorsWithProfiles(filtered);
      setSelectedReactionType(reactionType);
      setShowReactorsModal(true);
    } catch (error) {
      console.error('Error loading reactors:', error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {REACTION_EMOJIS.map((reaction) => {
          const count = getCount(reaction.type);
          const isActive = hasUserReacted(reaction.type);
          const showCount = count > 0;

          return (
            <TouchableOpacity
              key={reaction.type}
              style={[
                styles.reactionButton,
                isActive && styles.reactionButtonActive,
              ]}
              onPress={() => handleReactionPress(reaction.type)}
              onLongPress={() => handleLongPress(reaction.type)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={[styles.emoji, isActive && styles.emojiActive]}>
                {reaction.emoji}
              </Text>
              {showCount && (
                <Text style={[styles.count, isActive && styles.countActive]}>
                  {count}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
        {isLoading && (
          <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
        )}
      </View>

      {/* Reactors Modal */}
      <Modal
        visible={showReactorsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReactorsModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowReactorsModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>
              {selectedReactionType && REACTION_EMOJIS.find(e => e.type === selectedReactionType)?.emoji} Reactions
            </Text>
            {reactorsWithProfiles.map((reactor, index) => (
              <Text key={index} style={styles.reactorName}>
                {reactor.profile?.username || 'Unknown User'}
              </Text>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  reactionButtonActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  reactionButtonDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 18,
  },
  emojiActive: {
    // Add a slight scale effect in the future if needed
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  countActive: {
    color: colors.accent,
  },
  loader: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundStart,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: colors.accent,
    padding: 20,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  reactorName: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingVertical: 6,
    textAlign: 'center',
  },
});
