import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';
import { spacing } from '../../utils/spacing';
import type { ArenaQuestWithProfiles } from '../../types/arena';
import {
  getPendingSpeculationsForGroup,
  getAcceptedSpeculationsForGroup,
  getResolvedSpeculationsForGroup,
  createSpeculationQuest,
  acceptSpeculationQuest,
  resolveSpeculationQuest,
} from '../../utils/arenaQuests';
import { getOrCreateUserStatistics, getUserStatistics } from '../../lib/statistics';
import { useAuth } from '../../context/AuthContext';

// Golden gradient for speculation
const SPECULATION_GRADIENT = ['rgba(218, 165, 32, 0.4)', 'rgba(184, 134, 11, 0.2)', 'rgba(218, 165, 32, 0.1)'];

interface SpeculationSectionProps {
  groupId: string;
  groupMemberCount: number;
  currentUserId: string;
  refreshToken: number;
  onRefresh: () => void;
}

export default function SpeculationSection({
  groupId,
  groupMemberCount,
  currentUserId,
  refreshToken,
  onRefresh,
}: SpeculationSectionProps) {
  const { user } = useAuth();
  const [pendingSpeculations, setPendingSpeculations] = useState<ArenaQuestWithProfiles[]>([]);
  const [acceptedSpeculations, setAcceptedSpeculations] = useState<ArenaQuestWithProfiles[]>([]);
  const [resolvedSpeculations, setResolvedSpeculations] = useState<ArenaQuestWithProfiles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSpeculation, setSelectedSpeculation] = useState<ArenaQuestWithProfiles | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Create modal state
  const [description, setDescription] = useState('');
  const [odds, setOdds] = useState('');
  const [mojoStake, setMojoStake] = useState('');
  const [creatorSide, setCreatorSide] = useState<boolean | null>(null);
  const [userMojo, setUserMojo] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingMojo, setIsLoadingMojo] = useState(false);

  // Accept/Resolve state
  const [isProcessing, setIsProcessing] = useState(false);

  const loadSpeculations = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pending, accepted, resolved] = await Promise.all([
        getPendingSpeculationsForGroup(groupId),
        getAcceptedSpeculationsForGroup(groupId),
        getResolvedSpeculationsForGroup(groupId),
      ]);
      setPendingSpeculations(pending);
      setAcceptedSpeculations(accepted);
      setResolvedSpeculations(resolved);
    } catch (error) {
      console.error('Error loading speculations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadSpeculations();
  }, [loadSpeculations, refreshToken]);

  const handleOpenCreateModal = async () => {
    if (!user) return;

    // Open modal immediately
    setShowCreateModal(true);
    setIsLoadingMojo(true);

    // Fetch user's mojo
    try {
      const stats = await getOrCreateUserStatistics(user.id);
      setUserMojo(stats.mojo);
    } catch (error) {
      console.error('Error fetching user mojo:', error);
      setUserMojo(0); // Default to 0 if fetch fails
    } finally {
      setIsLoadingMojo(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setDescription('');
    setOdds('');
    setMojoStake('');
    setCreatorSide(null);
  };

  const handleCreateSpeculation = async () => {
    if (!user || !description.trim() || !odds || !mojoStake || creatorSide === null) {
      return;
    }

    try {
      setIsCreating(true);
      await createSpeculationQuest(
        groupId,
        description.trim(),
        creatorSide,
        parseFloat(odds),
        parseInt(mojoStake)
      );
      handleCloseCreateModal();
      loadSpeculations();
      onRefresh();
    } catch (error) {
      console.error('Error creating speculation:', error);
      // TODO: Show error to user
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptSpeculation = async (speculation: ArenaQuestWithProfiles) => {
    if (!user) return;

    try {
      setIsProcessing(true);
      await acceptSpeculationQuest(speculation.id);
      loadSpeculations();
      onRefresh();
    } catch (error) {
      console.error('Error accepting speculation:', error);
      // TODO: Show error to user
    } finally {
      setIsProcessing(false);
    }
  };

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
      setIsProcessing(true);
      await resolveSpeculationQuest(selectedSpeculation.id, result);
      handleCloseResolveModal();
      loadSpeculations();
      onRefresh();
    } catch (error) {
      console.error('Error resolving speculation:', error);
      // TODO: Show error to user
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidStake = parseInt(mojoStake) > 0 && parseInt(mojoStake) <= userMojo;
  const isValidOdds = parseFloat(odds) > 0;
  const canCreate = description.trim().length > 0 && description.trim().length <= 200 && isValidStake && isValidOdds && creatorSide !== null;

  const potentialProfit = isValidStake && isValidOdds ? Math.round(parseInt(mojoStake) * parseFloat(odds)) : 0;

  // Check if user can resolve a speculation (not a participant)
  const canResolve = (speculation: ArenaQuestWithProfiles) => {
    return currentUserId !== speculation.sender_id && currentUserId !== speculation.speculation_accepter_id;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Speculation</Text>
      </View>

      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.gradient}>
          {groupMemberCount < 3 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Speculation requires at least 3 group members. Invite more people to unlock this feature!
              </Text>
            </View>
          ) : (
            <>
              {/* Create Speculation Button */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleOpenCreateModal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={SPECULATION_GRADIENT as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createButtonGradient}
                >
                  <BlurView intensity={10} tint="dark" style={styles.createButtonBlur}>
                    <View style={styles.createButtonContent}>
                      <Text style={styles.createButtonIcon}>🌀</Text>
                      <Text style={styles.createButtonText}>Create Speculation</Text>
                      <MaterialCommunityIcons name="plus" size={24} color={colors.textPrimary} />
                    </View>
                  </BlurView>
                </LinearGradient>
              </TouchableOpacity>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              ) : (
                <>
                  {/* Pending Speculations */}
                  {pendingSpeculations.length > 0 && (
                    <View style={styles.speculationsList}>
                      <Text style={styles.sectionLabel}>Open Offers</Text>
                      {pendingSpeculations.map((speculation) => {
                        const senderName = speculation.sender_profile.username || speculation.sender_profile.email.split('@')[0];
                        const isOwnSpeculation = speculation.sender_id === currentUserId;
                        const sideLabel = speculation.speculation_creator_side ? 'FOR' : 'AGAINST';

                        return (
                          <View key={speculation.id} style={styles.speculationItemWrapper}>
                            <LinearGradient
                              colors={SPECULATION_GRADIENT as any}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.speculationGradient}
                            >
                              <BlurView intensity={10} tint="dark" style={styles.speculationBlur}>
                                <View style={styles.speculationItem}>
                                  <View style={styles.speculationHeader}>
                                    <Text style={styles.speculationCreator}>{senderName}</Text>
                                    <Text style={styles.speculationSide}>{sideLabel}</Text>
                                  </View>
                                  <Text style={styles.speculationDescription}>
                                    "{speculation.speculation_description}"
                                  </Text>
                                  <View style={styles.speculationDetails}>
                                    <Text style={styles.speculationDetail}>
                                      Stake: {speculation.mojo_stake} mojo
                                    </Text>
                                    <Text style={styles.speculationDetail}>
                                      Odds: {speculation.odds?.toFixed(2)}x
                                    </Text>
                                  </View>
                                  {!isOwnSpeculation && (
                                    <TouchableOpacity
                                      style={styles.acceptButton}
                                      onPress={() => handleAcceptSpeculation(speculation)}
                                      disabled={isProcessing}
                                      activeOpacity={0.7}
                                    >
                                      {isProcessing ? (
                                        <ActivityIndicator size="small" color={colors.backgroundStart} />
                                      ) : (
                                        <Text style={styles.acceptButtonText}>Accept Bet</Text>
                                      )}
                                    </TouchableOpacity>
                                  )}
                                  {isOwnSpeculation && (
                                    <Text style={styles.waitingText}>Waiting for someone to accept...</Text>
                                  )}
                                </View>
                              </BlurView>
                            </LinearGradient>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Accepted Speculations */}
                  {acceptedSpeculations.length > 0 && (
                    <View style={styles.speculationsList}>
                      <Text style={styles.sectionLabel}>Ongoing Speculations</Text>
                      {acceptedSpeculations.map((speculation) => {
                        const creatorName = speculation.sender_profile.username || speculation.sender_profile.email.split('@')[0];
                        const accepterName = speculation.receiver_profile.username || speculation.receiver_profile.email.split('@')[0];
                        const sideLabel = speculation.speculation_creator_side ? 'FOR' : 'AGAINST';
                        const canResolveThis = canResolve(speculation);

                        return (
                          <View key={speculation.id} style={styles.speculationItemWrapper}>
                            <LinearGradient
                              colors={SPECULATION_GRADIENT as any}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.speculationGradient}
                            >
                              <BlurView intensity={10} tint="dark" style={styles.speculationBlur}>
                                <View style={styles.speculationItem}>
                                  <View style={styles.participantsRow}>
                                    <Text style={styles.participantText}>
                                      {creatorName} ({sideLabel})
                                    </Text>
                                    <Text style={styles.vsText}>vs</Text>
                                    <Text style={styles.participantText}>
                                      {accepterName} ({speculation.speculation_creator_side ? 'AGAINST' : 'FOR'})
                                    </Text>
                                  </View>
                                  <Text style={styles.speculationDescription}>
                                    "{speculation.speculation_description}"
                                  </Text>
                                  <View style={styles.speculationDetails}>
                                    <Text style={styles.speculationDetail}>
                                      Stake: {speculation.mojo_stake} mojo each
                                    </Text>
                                    <Text style={styles.speculationDetail}>
                                      Total Pot: {(speculation.mojo_stake || 0) * 2} mojo
                                    </Text>
                                  </View>
                                  {canResolveThis && (
                                    <TouchableOpacity
                                      style={styles.resolveButton}
                                      onPress={() => handleOpenResolveModal(speculation)}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.resolveButtonText}>Resolve Speculation</Text>
                                    </TouchableOpacity>
                                  )}
                                  {!canResolveThis && (
                                    <Text style={styles.waitingText}>Waiting for resolution by a third party...</Text>
                                  )}
                                </View>
                              </BlurView>
                            </LinearGradient>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Resolved Speculations */}
                  {resolvedSpeculations.length > 0 && (
                    <View style={styles.speculationsList}>
                      <Text style={styles.sectionLabel}>Recent Results</Text>
                      {resolvedSpeculations.map((speculation) => {
                        const creatorName = speculation.sender_profile.username || speculation.sender_profile.email.split('@')[0];
                        const accepterName = speculation.receiver_profile.username || speculation.receiver_profile.email.split('@')[0];

                        // Determine winner based on result and creator's side
                        const creatorWon = speculation.speculation_result === speculation.speculation_creator_side;
                        const winnerId = creatorWon ? speculation.sender_id : speculation.speculation_accepter_id;
                        const winnerName = creatorWon ? creatorName : accepterName;
                        const loserName = creatorWon ? accepterName : creatorName;

                        const totalPot = (speculation.mojo_stake || 0) * 2;
                        const isUserInvolved = currentUserId === speculation.sender_id || currentUserId === speculation.speculation_accepter_id;
                        const didUserWin = winnerId === currentUserId;

                        const resultLabel = speculation.speculation_result ? 'YES' : 'NO';
                        const resultColor = speculation.speculation_result ? '#10b981' : '#ef4444';

                        return (
                          <View key={speculation.id} style={styles.speculationItemWrapper}>
                            <LinearGradient
                              colors={SPECULATION_GRADIENT as any}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.speculationGradient}
                            >
                              <BlurView intensity={10} tint="dark" style={styles.speculationBlur}>
                                <View style={styles.speculationItem}>
                                  <Text style={styles.speculationDescription}>
                                    "{speculation.speculation_description}"
                                  </Text>
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
                                        <Text style={styles.loserLoss}>-{speculation.mojo_stake} mojo</Text>
                                      </View>
                                    </View>
                                  </View>
                                  {isUserInvolved && (
                                    <View style={[styles.userResultBanner, didUserWin ? styles.userWinBanner : styles.userLossBanner]}>
                                      <Text style={styles.userResultText}>
                                        {didUserWin ? `You won ${totalPot} mojo! 🎉` : `You lost ${speculation.mojo_stake} mojo`}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </BlurView>
                            </LinearGradient>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {pendingSpeculations.length === 0 && acceptedSpeculations.length === 0 && resolvedSpeculations.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        No active speculations. Create a custom bet to get started!
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </BlurView>

      {/* Create Speculation Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseCreateModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseCreateModal}>
          <Pressable style={styles.createModalContent} onPress={(e) => e.stopPropagation()}>
            <BlurView intensity={40} tint="dark" style={styles.createModalBlur}>
              <ScrollView
                style={styles.createModalScroll}
                contentContainerStyle={styles.createModalInner}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalIcon}>🌀</Text>
                <Text style={styles.modalTitle}>Create Speculation</Text>
                <Text style={styles.modalSubtitle}>Make a custom bet with your group</Text>

                {/* Description Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>What are you betting on?</Text>
                  <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="e.g., Bob won't score a goal in his next five games!"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    maxLength={200}
                  />
                  <Text style={styles.charCount}>{description.length}/200</Text>
                </View>

                {/* Creator Side Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Which side are you on?</Text>
                  <View style={styles.sideButtonsRow}>
                    <TouchableOpacity
                      style={[styles.sideButton, creatorSide === true && styles.sideButtonSelected]}
                      onPress={() => setCreatorSide(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.sideButtonText, creatorSide === true && styles.sideButtonTextSelected]}>
                        FOR
                      </Text>
                      <Text style={styles.sideButtonSubtext}>It will happen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sideButton, creatorSide === false && styles.sideButtonSelected]}
                      onPress={() => setCreatorSide(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.sideButtonText, creatorSide === false && styles.sideButtonTextSelected]}>
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
                    style={styles.numberInput}
                    value={odds}
                    onChangeText={setOdds}
                    placeholder="e.g., 2.5"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.inputHint}>Higher odds = higher payout if you win</Text>
                </View>

                {/* Mojo Stake Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Mojo Stake {isLoadingMojo ? '(Loading...)' : `(Available: ${Math.floor(userMojo)})`}
                  </Text>
                  <TextInput
                    style={styles.numberInput}
                    value={mojoStake}
                    onChangeText={setMojoStake}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    editable={!isLoadingMojo}
                  />
                </View>

                {/* Potential Payout */}
                {isValidStake && isValidOdds && (
                  <View style={styles.payoutInfo}>
                    <Text style={styles.payoutLabel}>Potential Profit:</Text>
                    <Text style={styles.payoutValue}>+{potentialProfit} mojo</Text>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseCreateModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.createSubmitButton, !canCreate && styles.createSubmitButtonDisabled]}
                    onPress={handleCreateSpeculation}
                    disabled={!canCreate || isCreating}
                    activeOpacity={0.7}
                  >
                    {isCreating ? (
                      <ActivityIndicator size="small" color={colors.backgroundStart} />
                    ) : (
                      <Text style={styles.createSubmitButtonText}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </BlurView>
          </Pressable>
        </Pressable>
      </Modal>

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
                        disabled={isProcessing}
                        activeOpacity={0.7}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color={colors.textPrimary} />
                        ) : (
                          <Text style={styles.resolveOptionText}>Yes</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.resolveOptionButton, styles.resolveNoButton]}
                        onPress={() => handleResolveSpeculation(false)}
                        disabled={isProcessing}
                        activeOpacity={0.7}
                      >
                        {isProcessing ? (
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
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.paddingMedium,
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  createButtonGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  createButtonBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.paddingMedium,
  },
  createButtonIcon: {
    fontSize: 28,
  },
  createButtonText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.paddingMedium,
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
  speculationsList: {
    gap: spacing.paddingMedium,
    marginTop: spacing.paddingMedium,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.paddingSmall,
  },
  speculationItemWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  speculationGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  speculationBlur: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  speculationItem: {
    padding: spacing.paddingMedium,
  },
  speculationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.paddingSmall,
  },
  speculationCreator: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  speculationSide: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DAA520',
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speculationDescription: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: spacing.paddingSmall,
  },
  speculationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.paddingSmall,
  },
  speculationDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  acceptButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.paddingSmall,
    paddingHorizontal: spacing.paddingMedium,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.paddingSmall,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.backgroundStart,
  },
  waitingText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.paddingSmall,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.paddingSmall,
    gap: spacing.paddingSmall,
  },
  participantText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  resolveButton: {
    backgroundColor: '#DAA520',
    paddingVertical: spacing.paddingSmall,
    paddingHorizontal: spacing.paddingMedium,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.paddingSmall,
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
  createModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  createModalBlur: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.glassBorder,
  },
  createModalScroll: {
    maxHeight: '100%',
  },
  createModalInner: {
    backgroundColor: colors.glassLight,
    padding: spacing.paddingXl,
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
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.paddingXl,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.paddingLarge,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.paddingXs,
  },
  descriptionInput: {
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
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.paddingXs,
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
  numberInput: {
    backgroundColor: colors.glassDark,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 12,
    paddingVertical: spacing.paddingMedium,
    paddingHorizontal: spacing.paddingMedium,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
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
  payoutLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.paddingMedium,
    width: '100%',
  },
  modalButton: {
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
  createSubmitButton: {
    backgroundColor: '#DAA520',
    borderWidth: 1,
    borderColor: '#DAA520',
  },
  createSubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.backgroundStart,
  },
  createSubmitButtonDisabled: {
    opacity: 0.5,
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
