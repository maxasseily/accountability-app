import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { GroupMemberWithProfile } from '../../types/groups';
import { getLatestPhotoForUser, type DailyPhoto } from '../../utils/dailyPhoto';
import { useGoal } from '../../context/GoalContext';
import type { UserGoal } from '../../types/goals';
import type { QuestType, ArenaQuest } from '../../types/arena';
import { sendArenaQuestRequest, calculateOdds, calculatePotentialPayout, checkExistingQuest, getPendingMojoStakes } from '../../utils/arenaQuests';
import { useGroup } from '../../context/GroupContext';
import { getOrCreateUserStatistics, getUserStatistics } from '../../lib/statistics';
import { useAuth } from '../../context/AuthContext';
import { getSubActivityConfig } from '../../utils/goalConfig';

interface ArenaMemberListProps {
  members: GroupMemberWithProfile[];
  currentUserId: string;
  refreshToken: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

interface MemberItemProps {
  member: GroupMemberWithProfile;
  isCurrentUser: boolean;
  onPhotoPress: (photo: DailyPhoto, memberName: string) => void;
  onMemberPress: (member: GroupMemberWithProfile) => void;
  refreshToken: number;
}

interface ArenaAction {
  id: QuestType;
  label: string;
  icon: string;
  description: string;
  color: string;
  confirmTitle: string;
  confirmDescription?: string;
}

const ARENA_ACTIONS: ArenaAction[] = [
  {
    id: 'alliance',
    label: 'Alliance',
    icon: '🤝',
    description: 'Form an alliance for mutual support',
    color: 'rgba(59, 130, 246, 0.15)', // Deep blue tinge (reduced for gradient overlay)
    confirmTitle: 'Send an alliance request?',
    confirmDescription: 'If you and your alliance mate both honour your goals for the week, you will both receive a mojo bonus! However, don\'t let each other down, or you will shame the alliance and lose mojo instead!'
  },
  {
    id: 'battle',
    label: 'Battle',
    icon: '⚔️',
    description: 'Challenge them to a friendly competition',
    color: 'rgba(220, 38, 38, 0.15)', // Deep red tinge
    confirmTitle: 'Send a battle challenge?',
    confirmDescription: 'You and your battle partner are locking horns! Whoever logs more sessions towards reaching their goal will receive a big Mojo reward! But be warned, whoever loses will be docked Mojo instead. Game on!'
  },
  {
    id: 'prophecy',
    label: 'Prophecy',
    icon: '🔮',
    description: 'Make a prediction about their progress',
    color: 'rgba(147, 51, 234, 0.15)', // Deep purple tinge
    confirmTitle: 'Send a prophecy request?'
  },
  {
    id: 'curse',
    label: 'Curse',
    icon: '💀',
    description: 'Cast a playful curse',
    color: 'rgba(236, 72, 153, 0.15)', // Electric pink tinge
    confirmTitle: 'Send a curse request?'
  },
];

// Gradient colors for each action type
const ACTION_GRADIENTS: Record<string, string[]> = {
  alliance: ['rgba(59, 130, 246, 0.4)', 'rgba(37, 99, 235, 0.2)', 'rgba(59, 130, 246, 0.1)'],
  battle: ['rgba(220, 38, 38, 0.4)', 'rgba(185, 28, 28, 0.2)', 'rgba(220, 38, 38, 0.1)'],
  prophecy: ['rgba(147, 51, 234, 0.4)', 'rgba(126, 34, 206, 0.2)', 'rgba(147, 51, 234, 0.1)'],
  curse: ['rgba(236, 72, 153, 0.4)', 'rgba(219, 39, 119, 0.2)', 'rgba(236, 72, 153, 0.1)'],
};

function MemberItem({ member, isCurrentUser, onPhotoPress, onMemberPress, refreshToken }: MemberItemProps) {
  const { profile } = member;
  const displayName = profile.full_name || profile.email.split('@')[0] || 'User';
  const [latestPhoto, setLatestPhoto] = useState<DailyPhoto | null>(null);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);
  const [memberGoal, setMemberGoal] = useState<UserGoal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const { getUserGoal } = useGoal();

  // Load the member's latest photo
  const loadPhoto = useCallback(async () => {
    try {
      setIsLoadingPhoto(true);
      const photo = await getLatestPhotoForUser(member.user_id);
      setLatestPhoto(photo);
    } catch (error) {
      console.error('Error loading member photo:', error);
    } finally {
      setIsLoadingPhoto(false);
    }
  }, [member.user_id]);

  // Load the member's goal
  const loadGoal = useCallback(async () => {
    try {
      setIsLoadingGoal(true);
      const goal = await getUserGoal(member.user_id);
      setMemberGoal(goal);
    } catch (error) {
      console.error('Error loading member goal:', error);
    } finally {
      setIsLoadingGoal(false);
    }
  }, [member.user_id, getUserGoal]);

  // Load photo and goal on mount or when refresh is triggered
  useEffect(() => {
    loadPhoto();
    loadGoal();
  }, [loadPhoto, loadGoal, refreshToken]);

  return (
    <TouchableOpacity
      style={styles.memberItem}
      onPress={() => !isCurrentUser && onMemberPress(member)}
      disabled={isCurrentUser}
      activeOpacity={0.7}
    >
      {/* Daily Photo */}
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => latestPhoto && onPhotoPress(latestPhoto, displayName)}
        disabled={!latestPhoto}
        activeOpacity={0.7}
      >
        {isLoadingPhoto ? (
          <View style={styles.photoPlaceholder}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : latestPhoto ? (
          <Image
            source={{ uri: latestPhoto.photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>📷</Text>
          </View>
        )}
        {isCurrentUser && (
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>YOU</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{displayName}</Text>
        {profile.rank && (
          <Text style={styles.memberRank}>{profile.rank}</Text>
        )}
      </View>

      {/* Goal Progress */}
      <View style={styles.goalProgressContainer}>
        {isLoadingGoal ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : memberGoal ? (
          <View style={styles.goalProgressContent}>
            <MaterialCommunityIcons
              name={getSubActivityConfig(memberGoal.subActivity)?.icon as any}
              size={16}
              color={colors.accent}
            />
            <Text style={styles.goalProgressText}>
              {memberGoal.currentProgress}/{memberGoal.frequency}
            </Text>
          </View>
        ) : (
          <Text style={styles.noGoalText}>No goal set</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ArenaMemberList({ members, currentUserId, refreshToken, onRefresh, isRefreshing }: ArenaMemberListProps) {
  const { group } = useGroup();
  const { user } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<{ photo: DailyPhoto; name: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<GroupMemberWithProfile | null>(null);
  const [selectedAction, setSelectedAction] = useState<ArenaAction | null>(null);
  const [pendingQuestMember, setPendingQuestMember] = useState<GroupMemberWithProfile | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  // Mojo stake state
  const [mojoStake, setMojoStake] = useState<string>('');
  const [userMojo, setUserMojo] = useState<number>(0);
  const [pendingMojoStakes, setPendingMojoStakes] = useState<number>(0);
  const [memberCredibility, setMemberCredibility] = useState<number>(50);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Existing quest tracking
  const [existingQuests, setExistingQuests] = useState<Map<string, ArenaQuest>>(new Map());

  const handlePhotoPress = (photo: DailyPhoto, memberName: string) => {
    setSelectedPhoto({ photo, name: memberName });
  };

  const handleClosePhotoModal = () => {
    setSelectedPhoto(null);
  };

  const handleMemberPress = (member: GroupMemberWithProfile) => {
    setSelectedMember(member);
  };

  const handleCloseArenaModal = () => {
    setSelectedMember(null);
  };

  const handleActionPress = async (action: ArenaAction) => {
    if (!selectedMember || !user || !group) return;

    // Capture member reference before nulling it
    const member = selectedMember;

    // Check if an identical quest already exists
    const existingQuest = await checkExistingQuest(
      group.id,
      user.id,
      member.user_id,
      action.id
    );

    // Update existing quests map
    const questKey = `${member.user_id}-${action.id}`;
    const newMap = new Map(existingQuests);
    if (existingQuest) {
      newMap.set(questKey, existingQuest);
    } else {
      newMap.delete(questKey); // Clear any old entry
    }
    setExistingQuests(newMap);

    // Store the member for the quest request
    setPendingQuestMember(member);
    setSelectedAction(action);

    // Close the arena modal immediately so confirmation modal appears on top
    setSelectedMember(null);

    // For prophecy/curse, fetch statistics after closing modal
    if (action.id === 'prophecy' || action.id === 'curse') {
      setIsLoadingStats(true);
      try {
        // Fetch user's mojo (create if doesn't exist)
        const userStats = await getOrCreateUserStatistics(user.id);
        setUserMojo(userStats.mojo);

        // Fetch pending mojo stakes (mojo already committed to pending quests)
        const pendingStakes = await getPendingMojoStakes(user.id);
        setPendingMojoStakes(pendingStakes);

        // Fetch member's credibility (read-only, don't create)
        const memberStats = await getUserStatistics(member.user_id);
        setMemberCredibility(memberStats?.credibility ?? 50);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Set defaults on error
        setMemberCredibility(50);
        setPendingMojoStakes(0);
      } finally {
        setIsLoadingStats(false);
      }
    }
  };

  const handleCloseConfirmModal = () => {
    setSelectedAction(null);
    setPendingQuestMember(null);
    setMojoStake('');
    // Clear existing quest info when closing
    if (pendingQuestMember && selectedAction) {
      const questKey = `${pendingQuestMember.user_id}-${selectedAction.id}`;
      const newMap = new Map(existingQuests);
      newMap.delete(questKey);
      setExistingQuests(newMap);
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedAction || !pendingQuestMember || !group) return;

    try {
      setIsSendingRequest(true);

      // Parse mojo stake for prophecy/curse (whole numbers only)
      const stake = (selectedAction.id === 'prophecy' || selectedAction.id === 'curse')
        ? parseInt(mojoStake) || 0
        : 0;

      // Send the quest request
      await sendArenaQuestRequest(
        group.id,
        pendingQuestMember.user_id,
        selectedAction.id,
        stake
      );

      // Close confirmation modal and clear pending member
      setSelectedAction(null);
      setPendingQuestMember(null);
      setMojoStake('');

      // Refresh the list
      onRefresh();
    } catch (error) {
      console.error('Error sending quest request:', error);
      // TODO: Show error message to user
    } finally {
      setIsSendingRequest(false);
    }
  };

  const memberName = selectedMember?.profile.full_name || selectedMember?.profile.email.split('@')[0] || 'User';
  const pendingMemberName = pendingQuestMember?.profile.full_name || pendingQuestMember?.profile.email.split('@')[0] || 'User';

  // Calculate odds and payout for prophecy/curse (must be before existingQuest check)
  const isProphecyOrCurse = Boolean(selectedAction && (selectedAction.id === 'prophecy' || selectedAction.id === 'curse'));
  const stake = parseInt(mojoStake) || 0;
  const odds = isProphecyOrCurse && selectedAction ? calculateOdds(selectedAction.id, memberCredibility) : 0;
  const potentialPayout = isProphecyOrCurse ? Math.round(calculatePotentialPayout(stake, odds)) : 0;
  const availableMojo = userMojo - pendingMojoStakes;
  const isValidStake = stake > 0 && stake <= availableMojo;

  // Check if there's an existing quest
  const questKey = pendingQuestMember && selectedAction ? `${pendingQuestMember.user_id}-${selectedAction.id}` : null;
  const existingQuest = questKey ? existingQuests.get(questKey) : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Group Members</Text>
        <TouchableOpacity
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
          onPress={onRefresh}
          disabled={isRefreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh group members"
        >
          <MaterialCommunityIcons name="refresh" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemberItem
                member={item}
                isCurrentUser={item.user_id === currentUserId}
                onPhotoPress={handlePhotoPress}
                onMemberPress={handleMemberPress}
                refreshToken={refreshToken}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
          />
        </View>
      </BlurView>

      {/* Photo Enlargement Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePhotoModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleClosePhotoModal}>
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <>
                <Text style={styles.modalTitle}>{selectedPhoto.name}</Text>
                <Image
                  source={{ uri: selectedPhoto.photo.photo_url }}
                  style={styles.enlargedPhoto}
                  resizeMode="contain"
                />
                <Text style={styles.modalDate}>
                  {new Date(selectedPhoto.photo.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Arena Actions Modal */}
      <Modal
        visible={selectedMember !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseArenaModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseArenaModal}>
          <Pressable style={styles.arenaModalContent} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={40} tint="dark" style={styles.arenaModalBlur}>
              <View style={styles.arenaModalInner}>
                {/* Header */}
                <View style={styles.arenaModalHeader}>
                  <Text style={styles.arenaModalTitle}>{memberName}</Text>
                  <TouchableOpacity onPress={handleCloseArenaModal} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={28} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Arena Actions */}
                <View style={styles.arenaActionsContainer}>
                  {ARENA_ACTIONS.map((action) => (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.arenaActionButton}
                      onPress={() => handleActionPress(action)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={ACTION_GRADIENTS[action.id] as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.arenaActionGradient}
                      >
                        <BlurView intensity={10} tint="dark" style={styles.arenaActionBlur}>
                          <View style={styles.arenaActionContent}>
                            <View style={styles.arenaActionInfo}>
                              <Text style={styles.arenaActionIcon}>{action.icon}</Text>
                              <View style={styles.arenaActionText}>
                                <Text style={styles.arenaActionLabel}>{action.label}</Text>
                                <Text style={styles.arenaActionDescription}>{action.description}</Text>
                              </View>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                          </View>
                        </BlurView>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </BlurView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={selectedAction !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseConfirmModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseConfirmModal}>
          <Pressable style={styles.confirmModalContent} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={40} tint="dark" style={styles.confirmModalBlur}>
              <View style={styles.confirmModalInner}>
                {selectedAction && (
                  <>
                    <Text style={styles.confirmIcon}>{selectedAction.icon}</Text>
                    <Text style={styles.confirmTitle}>{selectedAction.confirmTitle}</Text>
                    {selectedAction.confirmDescription && (
                      <Text style={styles.confirmDescription}>{selectedAction.confirmDescription}</Text>
                    )}
                    <Text style={styles.confirmSubtitle}>
                      {selectedAction.label} with {pendingMemberName}
                    </Text>

                    {/* Existing Quest Warning */}
                    {existingQuest && (
                      <View style={styles.warningContainer}>
                        <MaterialCommunityIcons name="information" size={24} color="#f59e0b" />
                        <Text style={styles.warningText}>
                          You already have {existingQuest.status === 'pending' ? 'a pending' : 'an accepted'}{' '}
                          {selectedAction.label.toLowerCase()} with {pendingMemberName}.
                        </Text>
                      </View>
                    )}

                    {/* Mojo Stake Input for Prophecy/Curse */}
                    {isProphecyOrCurse && !existingQuest && (
                      <View style={styles.mojoStakeContainer}>
                        {isLoadingStats ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <>
                            <Text style={styles.mojoStakeLabel}>
                              Available Mojo: {Math.floor(availableMojo)}
                              {pendingMojoStakes > 0 && (
                                <Text style={styles.pendingStakesText}> ({Math.floor(pendingMojoStakes)} staked)</Text>
                              )}
                            </Text>
                            <Text style={styles.credibilityLabel}>
                              {pendingMemberName}'s Credibility: {memberCredibility}
                            </Text>

                            <View style={styles.inputContainer}>
                              <Text style={styles.inputLabel}>Mojo Stake</Text>
                              <TextInput
                                style={styles.mojoInput}
                                value={mojoStake}
                                onChangeText={setMojoStake}
                                placeholder="0"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="number-pad"
                                maxLength={10}
                              />
                            </View>

                            {stake > 0 && (
                              <View style={styles.bettingInfo}>
                                <View style={styles.bettingRow}>
                                  <Text style={styles.bettingLabel}>Odds:</Text>
                                  <Text style={styles.bettingValue}>{odds.toFixed(2)}x</Text>
                                </View>
                                <View style={styles.bettingRow}>
                                  <Text style={styles.bettingLabel}>Potential Win:</Text>
                                  <Text style={[styles.bettingValue, styles.winValue]}>
                                    +{potentialPayout} mojo
                                  </Text>
                                </View>
                                <View style={styles.bettingRow}>
                                  <Text style={styles.bettingLabel}>Potential Loss:</Text>
                                  <Text style={[styles.bettingValue, styles.lossValue]}>
                                    -{stake} mojo
                                  </Text>
                                </View>
                              </View>
                            )}

                            {stake > availableMojo && (
                              <Text style={styles.errorText}>
                                Insufficient mojo! (Available: {Math.floor(availableMojo)})
                              </Text>
                            )}
                          </>
                        )}
                      </View>
                    )}

                    <View style={styles.confirmButtons}>
                      <TouchableOpacity
                        style={[styles.confirmButton, styles.cancelButton]}
                        onPress={handleCloseConfirmModal}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          styles.sendButton,
                          existingQuest && styles.sendButtonDisabled
                        ]}
                        onPress={handleConfirmAction}
                        activeOpacity={0.7}
                        disabled={
                          isSendingRequest ||
                          existingQuest !== undefined ||
                          (isProphecyOrCurse && (!isValidStake || isLoadingStats))
                        }
                      >
                        {isSendingRequest ? (
                          <ActivityIndicator size="small" color={colors.backgroundStart} />
                        ) : (
                          <Text style={styles.sendButtonText}>Send Request</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  photo: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  photoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.glassDark,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 24,
    opacity: 0.5,
  },
  youBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.backgroundStart,
    letterSpacing: 0.5,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  memberRank: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  goalProgressContainer: {
    marginLeft: 12,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  goalProgressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glassDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  noGoalText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: colors.glassBorder,
    marginLeft: 64,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  enlargedPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  modalDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  arenaModalContent: {
    width: '90%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  arenaModalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  arenaModalInner: {
    backgroundColor: colors.glassLight,
    padding: spacing.paddingXl,
  },
  arenaModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.paddingXl,
  },
  arenaModalTitle: {
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
  arenaActionsContainer: {
    gap: spacing.paddingMedium,
  },
  arenaActionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  arenaActionGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  arenaActionBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  arenaActionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.paddingMedium,
  },
  arenaActionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.paddingMedium,
  },
  arenaActionIcon: {
    fontSize: 32,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  arenaActionText: {
    flex: 1,
  },
  arenaActionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  arenaActionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  confirmModalContent: {
    width: '85%',
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  confirmModalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  confirmModalInner: {
    backgroundColor: colors.glassLight,
    padding: spacing.paddingXl,
    alignItems: 'center',
  },
  confirmIcon: {
    fontSize: 64,
    marginBottom: spacing.paddingMedium,
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.paddingXs,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  confirmDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.paddingMedium,
    lineHeight: 20,
    paddingHorizontal: spacing.paddingXs,
  },
  confirmSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.paddingXl,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: spacing.paddingMedium,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.paddingMedium,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sendButton: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.backgroundStart,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.paddingSmall,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 12,
    padding: spacing.paddingMedium,
    marginBottom: spacing.paddingLarge,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#fbbf24',
    fontWeight: '600',
    lineHeight: 18,
  },
  mojoStakeContainer: {
    width: '100%',
    marginBottom: spacing.paddingLarge,
    gap: spacing.paddingSmall,
  },
  mojoStakeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  pendingStakesText: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  credibilityLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.paddingSmall,
  },
  inputContainer: {
    marginVertical: spacing.paddingSmall,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.paddingXs,
    textAlign: 'center',
  },
  mojoInput: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: spacing.paddingMedium,
    paddingHorizontal: spacing.paddingLarge,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  bettingInfo: {
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    padding: spacing.paddingMedium,
    gap: spacing.paddingSmall,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bettingLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bettingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  winValue: {
    color: '#10b981', // Green for wins
  },
  lossValue: {
    color: '#ef4444', // Red for losses
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '600',
  },
});
