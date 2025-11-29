import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Pressable, TextInput, TouchableOpacity, Text, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import GroupHeader from '../../../src/components/groups/GroupHeader';
import MemberList from '../../../src/components/groups/MemberList';
import GroupChatButton from '../../../src/components/groups/GroupChatButton';
import GroupAccessInfo from '../../../src/components/groups/GroupAccessInfo';
import NoGroupState from '../../../src/components/groups/NoGroupState';
import ArenaGrid from '../../../src/components/arena/ArenaGrid';
import OngoingQuestsCard from '../../../src/components/arena/OngoingQuestsCard';
import PendingQuestsCard from '../../../src/components/arena/PendingQuestsCard';
import CompletedQuestsCard from '../../../src/components/arena/CompletedQuestsCard';
import { colors } from '../../../src/utils/colors';
import { spacing } from '../../../src/utils/spacing';
import { useGroup } from '../../../src/context/GroupContext';
import { useAuth } from '../../../src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';
import type { GroupMemberWithProfile } from '../../../src/types/groups';
import type { QuestType, ArenaQuest } from '../../../src/types/arena';
import { sendArenaQuestRequest, calculateOdds, checkExistingQuest, getPendingMojoStakes, hasAlreadyCompletedGoal, isTooLateForCurse } from '../../../src/utils/arenaQuests';
import { getOrCreateUserStatistics, getUserStatistics } from '../../../src/lib/statistics';
import { useGoal } from '../../../src/context/GoalContext';
import type { UserGoal } from '../../../src/types/goals';

interface ArenaAction {
  id: QuestType;
  label: string;
  confirmTitle: string;
  confirmDescription?: string;
}

const ARENA_ACTION_INFO: Partial<Record<QuestType, ArenaAction>> = {
  alliance: {
    id: 'alliance',
    label: 'Alliance',
    confirmTitle: 'Send an alliance request?',
    confirmDescription: 'If you and your alliance mate both honour your goals for the week, you will both receive a mojo bonus! However, don\'t let each other down, or you will shame the alliance and lose mojo instead!'
  },
  battle: {
    id: 'battle',
    label: 'Battle',
    confirmTitle: 'Send a battle challenge?',
    confirmDescription: 'You and your battle partner are locking horns! Whoever logs more sessions towards reaching their goal will receive a big Mojo reward! But be warned, whoever loses will be docked Mojo instead. Game on!'
  },
  prophecy: {
    id: 'prophecy',
    label: 'Prophecy',
    confirmTitle: 'Place your prophecy?',
    confirmDescription: 'Your prophecy will be placed immediately. If they complete their weekly goal, you win! Otherwise, you lose your stake.'
  },
  curse: {
    id: 'curse',
    label: 'Curse',
    confirmTitle: 'Place your curse?',
    confirmDescription: 'Your curse will be placed immediately. If they fail to complete their weekly goal, you win! Otherwise, you lose your stake.'
  },
};

export default function GroupsScreen() {
  const { group, isLoading, leaveGroup, refreshGroup } = useGroup();
  const { user } = useAuth();
  const { getUserGoal } = useGoal();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  // Quest creation modal state
  const [selectedAction, setSelectedAction] = useState<ArenaAction | null>(null);
  const [pendingQuestMember, setPendingQuestMember] = useState<GroupMemberWithProfile | null>(null);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [showSpeculationModal, setShowSpeculationModal] = useState(false);

  // Mojo stake state
  const [mojoStake, setMojoStake] = useState<string>('');
  const [userMojo, setUserMojo] = useState<number>(0);
  const [pendingMojoStakes, setPendingMojoStakes] = useState<number>(0);
  const [memberCredibility, setMemberCredibility] = useState<number>(50);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Existing quest tracking
  const [existingQuests, setExistingQuests] = useState<Map<string, ArenaQuest>>(new Map());

  // Member goal state for validation
  const [memberGoal, setMemberGoal] = useState<UserGoal | null>(null);

  // Speculation creation state
  const [speculationDescription, setSpeculationDescription] = useState('');
  const [speculationOdds, setSpeculationOdds] = useState('');
  const [speculationMojoStake, setSpeculationMojoStake] = useState('');
  const [speculationCreatorSide, setSpeculationCreatorSide] = useState<boolean | null>(null);
  const [isCreatingSpeculation, setIsCreatingSpeculation] = useState(false);
  const [isLoadingSpeculationMojo, setIsLoadingSpeculationMojo] = useState(false);

  const handleLeaveGroup = () => {
    Alert.alert(
      'Warning, you are leaving the group. Are you sure you want to do this?',
      '',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshGroup();
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      console.error('Error refreshing group:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshGroup]);

  const handleQuestSelect = async (questType: QuestType, targetMember: GroupMemberWithProfile) => {
    if (!user || !group) return;

    const action = ARENA_ACTION_INFO[questType];
    if (!action) return;

    // Check if an identical quest already exists
    const existingQuest = await checkExistingQuest(
      group.id,
      user.id,
      targetMember.user_id,
      questType
    );

    // Update existing quests map
    const questKey = `${targetMember.user_id}-${questType}`;
    const newMap = new Map(existingQuests);
    if (existingQuest) {
      newMap.set(questKey, existingQuest);
    } else {
      newMap.delete(questKey);
    }
    setExistingQuests(newMap);

    // Store the member for the quest request
    setPendingQuestMember(targetMember);
    setSelectedAction(action);

    // For prophecy/curse, fetch statistics and goal
    if (questType === 'prophecy' || questType === 'curse') {
      setIsLoadingStats(true);
      try {
        // Fetch user's mojo (create if doesn't exist)
        const userStats = await getOrCreateUserStatistics(user.id);
        setUserMojo(userStats.mojo);

        // Fetch pending mojo stakes
        const pendingStakes = await getPendingMojoStakes(user.id);
        setPendingMojoStakes(pendingStakes);

        // Fetch member's credibility
        const memberStats = await getUserStatistics(targetMember.user_id);
        setMemberCredibility(memberStats?.credibility ?? 50);

        // Fetch member's goal for validation
        const goal = await getUserGoal(targetMember.user_id);
        setMemberGoal(goal);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setMemberCredibility(50);
        setPendingMojoStakes(0);
        setMemberGoal(null);
      } finally {
        setIsLoadingStats(false);
      }
    }
  };

  const handleSpeculationSelect = async () => {
    if (!user) return;

    setShowSpeculationModal(true);
    setIsLoadingSpeculationMojo(true);

    // Fetch user's mojo
    try {
      const stats = await getOrCreateUserStatistics(user.id);
      setUserMojo(stats.mojo);
    } catch (error) {
      console.error('Error fetching user mojo:', error);
      setUserMojo(0);
    } finally {
      setIsLoadingSpeculationMojo(false);
    }
  };

  const handleCloseSpeculationModal = () => {
    setShowSpeculationModal(false);
    setSpeculationDescription('');
    setSpeculationOdds('');
    setSpeculationMojoStake('');
    setSpeculationCreatorSide(null);
  };

  const handleCreateSpeculation = async () => {
    const trimmedDescription = speculationDescription.trim();

    // Validation
    if (!user || !group || !trimmedDescription || trimmedDescription.length < 5 || !speculationOdds || !speculationMojoStake || speculationCreatorSide === null) {
      if (trimmedDescription && trimmedDescription.length < 5) {
        Alert.alert('Invalid Description', 'Speculation description must be at least 5 characters long.');
      }
      return;
    }

    try {
      setIsCreatingSpeculation(true);
      const { createSpeculationQuest } = await import('../../../src/utils/arenaQuests');
      await createSpeculationQuest(
        group.id,
        trimmedDescription,
        speculationCreatorSide,
        parseFloat(speculationOdds),
        parseInt(speculationMojoStake)
      );
      handleCloseSpeculationModal();
      handleRefresh();
    } catch (error) {
      console.error('Error creating speculation:', error);

      // Check for specific error messages
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('3 active speculation quests')) {
        Alert.alert(
          'Speculation Limit Reached',
          'You can only have up to 3 active speculation quests at a time. Wait for one to be accepted or resolved before creating a new one.'
        );
      } else if (errorMessage.includes('Insufficient mojo')) {
        Alert.alert('Insufficient Mojo', 'You don\'t have enough mojo to create this speculation.');
      } else {
        Alert.alert('Error', 'Failed to create speculation. Please try again.');
      }
    } finally {
      setIsCreatingSpeculation(false);
    }
  };

  const handleCloseConfirmModal = () => {
    setSelectedAction(null);
    setPendingQuestMember(null);
    setMojoStake('');
    setMemberGoal(null);
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
      handleRefresh();
    } catch (error) {
      console.error('Error sending quest request:', error);
      Alert.alert('Error', 'Failed to send quest request. Please try again.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  if (isLoading && !isRefreshing) {
    return (
      <GradientBackground>
        <StatusBar style="light" hidden={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: spacing.screenPaddingTopCompact + insets.top },
        ]}
      >
        {group && user ? (
          <>
            <GroupHeader
              groupName={group.name}
              memberCount={group.member_count}
            />
            <MemberList
              members={group.members}
              currentUserId={user.id}
              refreshToken={refreshToken}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            <GroupChatButton />

            {/* Arena Section */}
            <ArenaGrid
              members={group.members}
              currentUserId={user.id}
              onQuestSelect={handleQuestSelect}
              onSpeculationSelect={handleSpeculationSelect}
            />

            <OngoingQuestsCard
              groupId={group.id}
              currentUserId={user.id}
              refreshToken={refreshToken}
              onRefresh={handleRefresh}
            />

            <PendingQuestsCard
              groupId={group.id}
              currentUserId={user.id}
              refreshToken={refreshToken}
              onRefresh={handleRefresh}
            />

            <CompletedQuestsCard
              groupId={group.id}
              currentUserId={user.id}
              refreshToken={refreshToken}
            />

            <GroupAccessInfo
              groupName={group.name}
              accessCode={group.access_code}
              onLeaveGroup={handleLeaveGroup}
            />
          </>
        ) : (
          <NoGroupState />
        )}
      </ScrollView>

      {/* Quest Confirmation Modal */}
      {selectedAction && pendingQuestMember && (
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
                  {(() => {
                    const pendingMemberName = pendingQuestMember.profile.username || pendingQuestMember.profile.email.split('@')[0] || 'User';
                    const isProphecyOrCurse = selectedAction.id === 'prophecy' || selectedAction.id === 'curse';
                    const stake = parseInt(mojoStake) || 0;
                    const odds = isProphecyOrCurse ? calculateOdds(selectedAction.id, memberCredibility) : 0;
                    const potentialWinnings = isProphecyOrCurse ? Math.round(stake * odds) : 0;
                    const availableMojo = userMojo - pendingMojoStakes;
                    const isValidStake = stake > 0 && stake <= availableMojo;

                    // Check if there's an existing quest
                    const questKey = `${pendingQuestMember.user_id}-${selectedAction.id}`;
                    const existingQuest = existingQuests.get(questKey);

                    // Validation warnings
                    let warningMessage: string | null = null;
                    if (memberGoal && !existingQuest) {
                      if (selectedAction.id === 'prophecy' && hasAlreadyCompletedGoal(memberGoal.currentProgress, memberGoal.frequency)) {
                        warningMessage = `${pendingMemberName} has already completed their weekly goal (${memberGoal.currentProgress}/${memberGoal.frequency}). You would automatically win - there's no pride in cheating Mojo!`;
                      } else if (selectedAction.id === 'curse' && isTooLateForCurse(memberGoal.currentProgress, memberGoal.frequency)) {
                        warningMessage = `It's too late in the week for ${pendingMemberName} to complete their goal (${memberGoal.currentProgress}/${memberGoal.frequency}). You would automatically win - there's no pride in cheating Mojo!`;
                      }
                    }

                    return (
                      <>
                        <Text style={styles.confirmIcon}>{selectedAction.id === 'alliance' ? '🤝' : selectedAction.id === 'battle' ? '⚔️' : selectedAction.id === 'prophecy' ? '🔮' : '💀'}</Text>
                        <Text style={styles.confirmTitle}>{selectedAction.confirmTitle}</Text>
                        {selectedAction.confirmDescription && (
                          <Text style={styles.confirmDescription}>{selectedAction.confirmDescription}</Text>
                        )}
                        <Text style={styles.confirmSubtitle}>
                          {selectedAction.label} with {pendingMemberName}
                        </Text>

                        {existingQuest && (
                          <View style={styles.warningContainer}>
                            <MaterialCommunityIcons name="information" size={24} color="#f59e0b" />
                            <Text style={styles.warningText}>
                              You already have {existingQuest.status === 'pending' ? 'a pending' : 'an accepted'}{' '}
                              {selectedAction.label.toLowerCase()} with {pendingMemberName}.
                            </Text>
                          </View>
                        )}

                        {warningMessage && !existingQuest && (
                          <View style={styles.warningContainer}>
                            <MaterialCommunityIcons name="alert" size={24} color="#f59e0b" />
                            <Text style={styles.warningText}>{warningMessage}</Text>
                          </View>
                        )}

                        {isProphecyOrCurse && !existingQuest && !warningMessage && (
                          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                                        <Text style={styles.bettingLabel}>Potential Profit:</Text>
                                        <Text style={[styles.bettingValue, styles.winValue]}>
                                          +{potentialWinnings} mojo
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
                          </TouchableWithoutFeedback>
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
                              (existingQuest || warningMessage) && styles.sendButtonDisabled
                            ]}
                            onPress={handleConfirmAction}
                            activeOpacity={0.7}
                            disabled={
                              isSendingRequest ||
                              existingQuest !== undefined ||
                              warningMessage !== null ||
                              (isProphecyOrCurse && (!isValidStake || isLoadingStats))
                            }
                          >
                            {isSendingRequest ? (
                              <ActivityIndicator size="small" color={colors.backgroundStart} />
                            ) : (
                              <Text style={styles.sendButtonText}>
                                {selectedAction.id === 'prophecy' ? 'Deliver Prophecy' :
                                  selectedAction.id === 'curse' ? 'Deliver Curse' :
                                    'Send Request'}
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </BlurView>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Speculation Creation Modal */}
      {showSpeculationModal && group && user && (
        <Modal
          visible={showSpeculationModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseSpeculationModal}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCloseSpeculationModal}>
            <Pressable style={styles.speculationCreateModalContent} onPress={(e) => e.stopPropagation()}>
              <BlurView intensity={40} tint="dark" style={styles.speculationCreateModalBlur}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <ScrollView
                    style={styles.speculationCreateModalScroll}
                    contentContainerStyle={styles.speculationCreateModalInner}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={styles.confirmIcon}>🌀</Text>
                    <Text style={styles.confirmTitle}>Create Speculation</Text>
                    <Text style={styles.confirmDescription}>Make a custom bet with your group</Text>

                    {/* Description Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>What are you betting on?</Text>
                      <TextInput
                        style={styles.speculationDescriptionInput}
                        value={speculationDescription}
                        onChangeText={setSpeculationDescription}
                        placeholder="e.g., Bob won't score a goal in his next five games!"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        maxLength={200}
                      />
                      <View style={styles.charCountRow}>
                        <Text style={styles.charCount}>{speculationDescription.length}/200</Text>
                        {speculationDescription.length > 0 && speculationDescription.length < 5 && (
                          <Text style={styles.inputError}>Must be at least 5 characters</Text>
                        )}
                      </View>
                    </View>

                    {/* Creator Side Selection */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Which side are you on?</Text>
                      <View style={styles.sideButtonsRow}>
                        <TouchableOpacity
                          style={[styles.sideButton, speculationCreatorSide === true && styles.sideButtonSelected]}
                          onPress={() => setSpeculationCreatorSide(true)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.sideButtonText, speculationCreatorSide === true && styles.sideButtonTextSelected]}>
                            FOR
                          </Text>
                          <Text style={styles.sideButtonSubtext}>It will happen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.sideButton, speculationCreatorSide === false && styles.sideButtonSelected]}
                          onPress={() => setSpeculationCreatorSide(false)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.sideButtonText, speculationCreatorSide === false && styles.sideButtonTextSelected]}>
                            AGAINST
                          </Text>
                          <Text style={styles.sideButtonSubtext}>It won't happen</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Odds Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Odds (multiplier)</Text>
                      <TextInput
                        style={styles.mojoInput}
                        value={speculationOdds}
                        onChangeText={setSpeculationOdds}
                        placeholder="e.g., 2.5"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.inputHint}>Higher odds = higher payout if you win</Text>
                    </View>

                    {/* Mojo Stake Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        Mojo Stake {isLoadingSpeculationMojo ? '(Loading...)' : `(Available: ${Math.floor(userMojo)})`}
                      </Text>
                      <TextInput
                        style={styles.mojoInput}
                        value={speculationMojoStake}
                        onChangeText={setSpeculationMojoStake}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="number-pad"
                        editable={!isLoadingSpeculationMojo}
                      />
                    </View>

                    {/* Potential Payout */}
                    {(() => {
                      const stake = parseInt(speculationMojoStake) || 0;
                      const odds = parseFloat(speculationOdds) || 0;
                      const isValidStake = stake > 0 && stake <= userMojo;
                      const isValidOdds = odds > 0;
                      const potentialProfit = isValidStake && isValidOdds ? Math.round(stake * odds) : 0;

                      return isValidStake && isValidOdds ? (
                        <View style={styles.payoutInfo}>
                          <Text style={styles.bettingLabel}>Potential Profit:</Text>
                          <Text style={styles.payoutValue}>+{potentialProfit} mojo</Text>
                        </View>
                      ) : null;
                    })()}

                    <View style={styles.confirmButtons}>
                      <TouchableOpacity
                        style={[styles.confirmButton, styles.cancelButton]}
                        onPress={handleCloseSpeculationModal}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.confirmButton,
                          styles.sendButton,
                          (speculationDescription.trim().length < 5 ||
                            !speculationOdds ||
                            !speculationMojoStake ||
                            speculationCreatorSide === null ||
                            parseInt(speculationMojoStake) <= 0 ||
                            parseInt(speculationMojoStake) > userMojo ||
                            parseFloat(speculationOdds) <= 0) && styles.sendButtonDisabled
                        ]}
                        onPress={handleCreateSpeculation}
                        disabled={
                          isCreatingSpeculation ||
                          speculationDescription.trim().length < 5 ||
                          !speculationOdds ||
                          !speculationMojoStake ||
                          speculationCreatorSide === null ||
                          parseInt(speculationMojoStake) <= 0 ||
                          parseInt(speculationMojoStake) > userMojo ||
                          parseFloat(speculationOdds) <= 0
                        }
                        activeOpacity={0.7}
                      >
                        {isCreatingSpeculation ? (
                          <ActivityIndicator size="small" color={colors.backgroundStart} />
                        ) : (
                          <Text style={styles.sendButtonText}>Create</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </TouchableWithoutFeedback>
              </BlurView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: spacing.screenPaddingTopCompact,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.screenPaddingBottom,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    width: '100%',
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
    color: '#10b981',
  },
  lossValue: {
    color: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '600',
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
  speculationCreateModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  speculationCreateModalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  speculationCreateModalScroll: {
    maxHeight: '100%',
  },
  speculationCreateModalInner: {
    backgroundColor: colors.glassLight,
    padding: spacing.paddingXl,
  },
  speculationDescriptionInput: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: spacing.paddingMedium,
    paddingHorizontal: spacing.paddingMedium,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.paddingXs,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  inputError: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  sideButtonsRow: {
    flexDirection: 'row',
    gap: spacing.paddingMedium,
  },
  sideButton: {
    flex: 1,
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: spacing.paddingMedium,
    alignItems: 'center',
  },
  sideButtonSelected: {
    borderColor: '#DAA520',
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
  },
  sideButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sideButtonTextSelected: {
    color: '#DAA520',
  },
  sideButtonSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  inputHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.paddingXs,
  },
  payoutInfo: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 12,
    padding: spacing.paddingMedium,
    marginBottom: spacing.paddingLarge,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
});
