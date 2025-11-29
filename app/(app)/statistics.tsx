import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Modal, Animated, Switch, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Svg, Polyline, Line, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { useGoal } from '../../src/context/GoalContext';
import { useAuth } from '../../src/context/AuthContext';
import { useGroup } from '../../src/context/GroupContext';
import { getOrCreateUserStatistics, getGroupMemberStats, type GroupMemberStats } from '../../src/lib/statistics';
import { getSubActivityConfig } from '../../src/utils/goalConfig';
import { colors } from '../../src/utils/colors';
import { spacing } from '../../src/utils/spacing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { RANK_LADDER, getUserRank, isInWarningZone, getMinCredibilityToMaintainRank } from '../../src/types/ranks';
import { upgradeUserRank, checkCanUpgradeRank } from '../../src/lib/ranks';
import type { UserStatistics } from '../../src/types/statistics';
import BadgeGrid from '../../src/components/badges/BadgeGrid';

// Generate fake credibility data for different time periods
const generateCredibilityData = (period: TimePeriod) => {
  const data = [];
  const today = new Date();
  let days = 7;

  if (period === 'month') days = 30;
  if (period === 'sixMonth') days = 180;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate credibility score (0-100) with some variation
    const baseScore = 30 + ((days - 1 - i) / days) * 50;
    const randomVariation = Math.random() * 15 - 7.5;
    const credibility = Math.min(100, Math.max(0, baseScore + randomVariation));

    data.push({
      date: date,
      credibility: Math.round(credibility),
    });
  }

  return data;
};

// Generate fake goal completion data
const generateGoalCompletionData = (period: TimePeriod, frequency: number) => {
  const data = [];
  let days = 7;
  let goalTotal = frequency;

  if (period === 'month') {
    days = 30;
    goalTotal = frequency * 4; // Assuming weekly frequency
  }
  if (period === 'sixMonth') {
    days = 180;
    goalTotal = frequency * 26; // Assuming weekly frequency
  }

  let completed = 0;
  for (let i = 0; i < days; i++) {
    // Randomly complete goals (70% chance)
    if (Math.random() > 0.3 && completed < goalTotal) {
      completed++;
    }
    data.push({
      day: i + 1,
      completed: completed,
    });
  }

  return { data, goalTotal };
};

const formatMojo = (value: number) => {
  const fixed = value.toFixed(2);
  return Number(fixed).toString();
};

const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 96;
const CHART_HEIGHT = 200;
const PADDING = { top: 10, bottom: 30, left: 40, right: 10 };

// Status ladder data
const STATUS_LADDER = [
  { id: 6, name: 'Veteran', minScore: 90, icon: 'crown', color: colors.accent },
  { id: 5, name: 'Expert', minScore: 75, icon: 'star', color: '#FFD700' },
  { id: 4, name: 'Advanced', minScore: 60, icon: 'trophy', color: '#C0C0C0' },
  { id: 3, name: 'Intermediate', minScore: 45, icon: 'medal', color: '#CD7F32' },
  { id: 2, name: 'Beginner', minScore: 25, icon: 'flag', color: colors.textSecondary },
  { id: 1, name: 'Noob', minScore: 0, icon: 'egg-easter', color: colors.textMuted },
];

// Max group size constant
const MAX_GROUP_SIZE = 6;

type TimePeriod = 'week' | 'month' | 'sixMonth';
type ViewMode = 'personal' | 'group';
type PersonalTab = 'data' | 'rank' | 'badges';

// Helper function to get current status
const getCurrentStatus = (score: number) => {
  for (let i = 0; i < STATUS_LADDER.length; i++) {
    if (score >= STATUS_LADDER[i].minScore) {
      return STATUS_LADDER[i];
    }
  }
  return STATUS_LADDER[STATUS_LADDER.length - 1];
};


// Toggle button component
const ToggleButton = ({
  options,
  selected,
  onSelect
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) => {
  return (
    <View style={styles.toggleContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.toggleButton,
            selected === option.value && styles.toggleButtonActive,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              selected === option.value && styles.toggleButtonTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Compact toggle component for charts
const CompactToggle = ({
  options,
  selected,
  onSelect
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) => {
  return (
    <View style={styles.compactToggleContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.compactToggleButton,
            selected === option.value && styles.compactToggleButtonActive,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.compactToggleText,
              selected === option.value && styles.compactToggleTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};


// Credibility line chart with x-axis
const CredibilityLineChart = ({ data, period }: { data: any[]; period: TimePeriod }) => {
  const maxValue = 100;
  const minValue = 0;
  const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  // Convert data points to SVG coordinates
  const points = data
    .map((point, index) => {
      const x = PADDING.left + (index / (data.length - 1)) * chartWidth;
      const y = PADDING.top + chartHeight - ((point.credibility - minValue) / (maxValue - minValue)) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // Format x-axis labels based on period
  const getXAxisLabels = () => {
    if (period === 'week') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (period === 'month') {
      return ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    } else {
      return ['Month 1', 'Month 3', 'Month 6'];
    }
  };

  const xAxisLabels = getXAxisLabels();

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((value) => {
        const y = PADDING.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        return (
          <Line
            key={value}
            x1={PADDING.left}
            y1={y}
            x2={CHART_WIDTH - PADDING.right}
            y2={y}
            stroke={colors.glassBorder}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        );
      })}

      {/* Y-axis labels */}
      {[0, 25, 50, 75, 100].map((value) => {
        const y = PADDING.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        return (
          <SvgText
            key={`label-${value}`}
            x={PADDING.left - 10}
            y={y + 4}
            fill={colors.textMuted}
            fontSize="10"
            textAnchor="end"
          >
            {value}
          </SvgText>
        );
      })}

      {/* X-axis labels */}
      {xAxisLabels.map((label, index) => {
        const x = PADDING.left + (index / (xAxisLabels.length - 1)) * chartWidth;
        return (
          <SvgText
            key={`x-${index}`}
            x={x}
            y={CHART_HEIGHT - 10}
            fill={colors.textMuted}
            fontSize="10"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        );
      })}

      {/* Line chart */}
      <Polyline
        points={points}
        fill="none"
        stroke={colors.accent}
        strokeWidth="3"
      />
    </Svg>
  );
};

// Rank Ladder View Component
const RankLadderView = ({
  statistics,
  isLoading,
  onRankUpgrade,
}: {
  statistics: UserStatistics | null;
  isLoading: boolean;
  onRankUpgrade: () => void;
}) => {
  const { user } = useAuth();
  const [upgradingToRank, setUpgradingToRank] = useState<number | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  if (isLoading || !statistics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const currentRank = getUserRank(statistics.userRank);
  const userCredibility = statistics.credibility;
  const userMojo = statistics.mojo;
  const inWarning = isInWarningZone(statistics.userRank, userCredibility);
  const minToMaintain = getMinCredibilityToMaintainRank(statistics.userRank);

  const handleUpgradePress = (rankId: number) => {
    setUpgradingToRank(rankId);
    setShowUpgradeConfirm(true);
    setUpgradeError(null);
  };

  const handleConfirmUpgrade = async () => {
    if (!user || !upgradingToRank) return;

    setShowUpgradeConfirm(false);

    try {
      const result = await upgradeUserRank(user.id, upgradingToRank);

      if (result.success) {
        // Refresh statistics
        onRankUpgrade();
        setUpgradingToRank(null);
      } else {
        setUpgradeError(result.errorMessage || 'Failed to upgrade rank');
      }
    } catch (error) {
      setUpgradeError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <View>
      {/* Warning Banner */}
      {inWarning && (
        <View style={styles.warningBanner}>
          <MaterialCommunityIcons name="alert" size={24} color={colors.warning} />
          <Text style={styles.warningText}>
            Warning! Your credibility is below {currentRank.minCredibility}. If it drops below {minToMaintain}, you will be demoted and will need to repurchase this rank with mojo.
          </Text>
        </View>
      )}

      {/* Current Rank Display */}
      <View style={styles.currentRankCard}>
        <Text style={styles.currentRankLabel}>Your Current Rank</Text>
        <View style={styles.currentRankDisplay}>
          <MaterialCommunityIcons name={currentRank.icon as any} size={48} color={currentRank.color} />
          <Text style={[styles.currentRankName, { color: currentRank.color }]}>{currentRank.name}</Text>
        </View>
        <View style={styles.currentRankStats}>
          <View style={styles.rankStatItem}>
            <Text style={styles.rankStatLabel}>Credibility</Text>
            <Text style={styles.rankStatValue}>{userCredibility}</Text>
          </View>
          <View style={styles.rankStatItem}>
            <Text style={styles.rankStatLabel}>Mojo</Text>
            <Text style={styles.rankStatValue}>{formatMojo(userMojo)}</Text>
          </View>
        </View>
      </View>

      {/* Error Message */}
      {upgradeError && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={24} color={colors.error} />
          <Text style={styles.errorText}>{upgradeError}</Text>
        </View>
      )}

      {/* Rank Ladder */}
      <Text style={styles.rankLadderTitle}>Rank Progression</Text>
      <View style={styles.rankLadderContainer}>
        {RANK_LADDER.map((rank, index) => {
          const isCurrentRank = rank.id === statistics.userRank;
          const isUnlocked = statistics.userRank >= rank.id;
          const isNextRank = rank.id === statistics.userRank + 1;
          const upgradeCheck = isNextRank
            ? checkCanUpgradeRank(statistics.userRank, userCredibility, userMojo)
            : null;

          return (
            <View
              key={rank.id}
              style={[
                styles.rankLadderItem,
                isCurrentRank && styles.rankLadderItemCurrent,
              ]}
            >
              <View style={[
                styles.rankLadderLeft,
                !isUnlocked && styles.rankLadderContentLocked,
              ]}>
                <MaterialCommunityIcons
                  name={rank.icon as any}
                  size={40}
                  color={isUnlocked ? rank.color : colors.textMuted}
                  style={!isUnlocked && styles.iconLocked}
                />
                <View style={styles.rankLadderInfo}>
                  <Text
                    style={[
                      styles.rankLadderName,
                      isCurrentRank && styles.rankLadderNameCurrent,
                      !isUnlocked && styles.rankLadderNameLocked,
                    ]}
                  >
                    {rank.name}
                  </Text>
                  <Text style={styles.rankLadderRequirements}>
                    {rank.minCredibility} Credibility • {rank.mojoCost} Mojo
                  </Text>
                </View>
              </View>

              {isCurrentRank && (
                <View style={styles.currentRankBadge}>
                  <Text style={styles.currentRankBadgeText}>CURRENT</Text>
                </View>
              )}

              {isNextRank && upgradeCheck && (
                <>
                  {upgradeCheck.canUpgrade ? (
                    <TouchableOpacity
                      style={styles.upgradeButton}
                      onPress={() => handleUpgradePress(rank.id)}
                    >
                      <Text style={styles.upgradeButtonText}>UPGRADE?</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.lockedBadge}>
                      <MaterialCommunityIcons name="lock" size={20} color={colors.textMuted} />
                    </View>
                  )}
                  {upgradeCheck.message && !upgradeCheck.canUpgrade && (
                    <Text style={styles.upgradeMessage}>{upgradeCheck.message}</Text>
                  )}
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* Upgrade Confirmation Modal */}
      <Modal
        visible={showUpgradeConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpgradeConfirm(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUpgradeConfirm(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Rank Upgrade</Text>
              <TouchableOpacity onPress={() => setShowUpgradeConfirm(false)}>
                <MaterialCommunityIcons name="close-circle" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {upgradingToRank && (
                <>
                  <Text style={styles.confirmText}>
                    Are you sure you want to upgrade to {RANK_LADDER.find(r => r.id === upgradingToRank)?.name}?
                  </Text>
                  <Text style={styles.confirmSubtext}>
                    It will cost you {RANK_LADDER.find(r => r.id === upgradingToRank)?.mojoCost} mojo, but you will be infinitely more respected!
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowUpgradeConfirm(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleConfirmUpgrade}
                    >
                      <LinearGradient
                        colors={[colors.accent, colors.accentGlow]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.confirmButtonGradient}
                      >
                        <Text style={styles.confirmButtonText}>Upgrade!</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Cumulative bar chart for goal progress
const GoalProgressBarChart = ({ data, goalTotal }: { data: any[]; goalTotal: number }) => {
  const maxValue = goalTotal * 1.2; // Add 20% headroom
  const chartWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const chartHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const barWidth = Math.min(chartWidth / data.length - 4, 20);

  // Calculate goal line position
  const goalLineY = PADDING.top + chartHeight - (goalTotal / maxValue) * chartHeight;

  return (
    <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
      {/* Grid lines */}
      {[0, Math.round(goalTotal / 2), goalTotal, Math.round(goalTotal * 1.2)].map((value, index) => {
        const y = PADDING.top + chartHeight - (value / maxValue) * chartHeight;
        return (
          <Line
            key={`grid-${index}`}
            x1={PADDING.left}
            y1={y}
            x2={CHART_WIDTH - PADDING.right}
            y2={y}
            stroke={colors.glassBorder}
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        );
      })}

      {/* Y-axis labels */}
      {[0, Math.round(goalTotal / 2), goalTotal, Math.round(goalTotal * 1.2)].map((value, index) => {
        const y = PADDING.top + chartHeight - (value / maxValue) * chartHeight;
        return (
          <SvgText
            key={`label-${index}`}
            x={PADDING.left - 10}
            y={y + 4}
            fill={colors.textMuted}
            fontSize="10"
            textAnchor="end"
          >
            {value}
          </SvgText>
        );
      })}

      {/* Dotted goal line */}
      <Line
        x1={PADDING.left}
        y1={goalLineY}
        x2={CHART_WIDTH - PADDING.right}
        y2={goalLineY}
        stroke={colors.accent}
        strokeWidth="2"
        strokeDasharray="5,5"
      />

      {/* Bars */}
      {data.map((point, index) => {
        const x = PADDING.left + (index / (data.length - 1)) * chartWidth - barWidth / 2;
        const barHeight = (point.completed / maxValue) * chartHeight;
        const y = PADDING.top + chartHeight - barHeight;

        return (
          <Line
            key={index}
            x1={x + barWidth / 2}
            y1={y}
            x2={x + barWidth / 2}
            y2={PADDING.top + chartHeight}
            stroke={colors.accent}
            strokeWidth={barWidth}
            strokeOpacity="0.8"
          />
        );
      })}
    </Svg>
  );
};

export default function StatisticsScreen() {
  const { user } = useAuth();
  const { goal, hasGoal } = useGoal();
  const { group, isInGroup } = useGroup();
  const insets = useSafeAreaInsets();

  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [personalTab, setPersonalTab] = useState<PersonalTab>('data');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [showCredibilityInfo, setShowCredibilityInfo] = useState(false);
  const [showStatusLadder, setShowStatusLadder] = useState(false);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [groupMemberStats, setGroupMemberStats] = useState<GroupMemberStats[]>([]);
  const [isGroupStatsLoading, setIsGroupStatsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Generate data based on selected periods
  const [credibilityData, setCredibilityData] = useState(() => generateCredibilityData('week'));

  const loadStatistics = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    if (!user) {
      setStatistics(null);
      setIsStatsLoading(false);
      return;
    }

    setIsStatsLoading(true);

    try {
      const result = await getOrCreateUserStatistics(user.id);
      if (!isMountedRef.current) {
        return;
      }
      setStatistics(result);
    } catch (error) {
      console.error('Error loading statistics:', error);
      if (!isMountedRef.current) {
        return;
      }
      setStatistics(null);
    } finally {
      if (!isMountedRef.current) {
        return;
      }
      setIsStatsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [loadStatistics])
  );

  const loadGroupMemberStats = useCallback(async () => {
    if (!group || !user) {
      setGroupMemberStats([]);
      setIsGroupStatsLoading(false);
      return;
    }

    setIsGroupStatsLoading(true);
    try {
      const members = await getGroupMemberStats(group.id, user.id);
      if (!isMountedRef.current) return;
      setGroupMemberStats(members);
    } catch (error) {
      console.error('Error loading group member stats:', error);
      if (!isMountedRef.current) return;
      setGroupMemberStats([]);
    } finally {
      if (!isMountedRef.current) return;
      setIsGroupStatsLoading(false);
    }
  }, [group, user]);

  useEffect(() => {
    if (viewMode === 'group' && isInGroup) {
      loadGroupMemberStats();
    }
  }, [viewMode, isInGroup, loadGroupMemberStats]);

  useEffect(() => {
    setCredibilityData(() => {
      const data = generateCredibilityData(timePeriod);
      if (statistics?.credibility !== undefined && data.length > 0) {
        const updated = [...data];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          credibility: statistics.credibility,
        };
        return updated;
      }
      return data;
    });
  }, [timePeriod, statistics?.credibility]);

  const currentScore =
    statistics?.credibility ?? (credibilityData.length ? credibilityData[credibilityData.length - 1].credibility : 0);
  const currentStatus = useMemo(() => getCurrentStatus(currentScore), [currentScore]);

  const goalData = hasGoal && goal ? generateGoalCompletionData(timePeriod, goal.frequency) : null;

  const groupAverageScore = useMemo(() => {
    if (groupMemberStats.length === 0) return 0;
    return Math.round(
      groupMemberStats.reduce((sum, m) => sum + m.credibility, 0) / groupMemberStats.length
    );
  }, [groupMemberStats]);

  const groupName = group?.name || 'Your Group';
  const groupCapacity = {
    current: group?.member_count || 0,
    max: MAX_GROUP_SIZE,
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: spacing.screenPaddingTopCompact + insets.top },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* View Mode Toggle - Native Switch */}
          <View style={styles.headerSection}>
            <View style={styles.switchWrapper}>
              <Text style={[styles.switchSideLabel, viewMode === 'personal' && styles.switchSideLabelActive]}>
                Personal
              </Text>
              <Switch
                value={viewMode === 'group'}
                onValueChange={(value) => setViewMode(value ? 'group' : 'personal')}
                trackColor={{ false: colors.accent, true: colors.accent }}
                thumbColor={colors.textPrimary}
                ios_backgroundColor={colors.accent}
              />
              <Text style={[styles.switchSideLabel, viewMode === 'group' && styles.switchSideLabelActive]}>
                Group
              </Text>
            </View>
          </View>

          {viewMode === 'personal' ? (
            <>
              {/* Page Title */}
              <Text style={styles.pageTitle}>Personal Stats</Text>

              {/* Personal Tab Navigation */}
              <View style={styles.personalTabContainer}>
                <TouchableOpacity
                  style={[styles.personalTab, personalTab === 'data' && styles.personalTabActive]}
                  onPress={() => setPersonalTab('data')}
                >
                  <Text style={[styles.personalTabText, personalTab === 'data' && styles.personalTabTextActive]}>
                    Data
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.personalTab, personalTab === 'rank' && styles.personalTabActive]}
                  onPress={() => setPersonalTab('rank')}
                >
                  <Text style={[styles.personalTabText, personalTab === 'rank' && styles.personalTabTextActive]}>
                    Rank
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.personalTab, personalTab === 'badges' && styles.personalTabActive]}
                  onPress={() => setPersonalTab('badges')}
                >
                  <Text style={[styles.personalTabText, personalTab === 'badges' && styles.personalTabTextActive]}>
                    Badges
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Data Tab Content */}
              {personalTab === 'data' && (
                <>
                  {/* Stats Section */}
                  <View style={styles.statsSection}>
                    <Text style={styles.sectionSubtitle}>{user?.username}'s Stats</Text>

                    {/* Row 1: Credibility and Mojo */}
                    <View style={styles.statSummaryRow}>
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(6, 182, 212, 0.4)', 'rgba(6, 182, 212, 0.2)', 'rgba(6, 182, 212, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statCardLabel}>Credibility</Text>
                        {isStatsLoading ? (
                          <ActivityIndicator color={colors.accent} size="small" />
                        ) : (
                          <Text style={styles.statCardValue}>{statistics?.credibility ?? 50}</Text>
                        )}
                      </LinearGradient>
                    </View>
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 149, 0, 0.4)', 'rgba(255, 149, 0, 0.2)', 'rgba(255, 149, 0, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statCardLabel}>Mojo</Text>
                        {isStatsLoading ? (
                          <ActivityIndicator color={colors.accent} size="small" />
                        ) : (
                          <Text style={styles.statCardValue}>{statistics ? formatMojo(statistics.mojo) : '0'}</Text>
                        )}
                      </LinearGradient>
                    </View>
                  </View>

                  {/* Row 2: Goals Logged and Friends */}
                  <View style={styles.statSummaryRow}>
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 0, 110, 0.4)', 'rgba(255, 0, 110, 0.2)', 'rgba(255, 0, 110, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statCardLabel}>Goals Logged</Text>
                        {isStatsLoading ? (
                          <ActivityIndicator color={colors.accent} size="small" />
                        ) : (
                          <Text style={styles.statCardValue}>{statistics?.lifetimeGoalsLogged ?? 0}</Text>
                        )}
                      </LinearGradient>
                    </View>
                    <View style={styles.statCardWrapper}>
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.statCard}
                      >
                        <Text style={styles.statCardLabel}>Friends</Text>
                        {isStatsLoading ? (
                          <ActivityIndicator color={colors.accent} size="small" />
                        ) : (
                          <Text style={styles.statCardValue}>{statistics?.friendCount ?? 0}</Text>
                        )}
                      </LinearGradient>
                    </View>
                  </View>
                  </View>

                  {/* Credibility Over Time Chart */}
                  <View style={styles.chartSection}>
                    <View style={styles.sectionHeaderWithToggle}>
                      <Text style={styles.sectionSubtitle}>Credibility Over Time</Text>
                      <CompactToggle
                        options={[
                          { value: 'week', label: 'W' },
                          { value: 'month', label: 'M' },
                          { value: 'sixMonth', label: '6M' },
                        ]}
                        selected={timePeriod}
                        onSelect={(value) => setTimePeriod(value as TimePeriod)}
                      />
                    </View>
                    <View style={styles.chartContainer}>
                      <CredibilityLineChart data={credibilityData} period={timePeriod} />
                    </View>
                  </View>

                  {/* Goal Progress Bar Chart */}
                  {hasGoal && goal && goalData && (
                    <View style={styles.chartSection}>
                      <View style={styles.sectionHeaderWithToggle}>
                        <Text style={styles.sectionSubtitle}>Goal Progress</Text>
                        <CompactToggle
                          options={[
                            { value: 'week', label: 'W' },
                            { value: 'month', label: 'M' },
                            { value: 'sixMonth', label: '6M' },
                          ]}
                          selected={timePeriod}
                          onSelect={(value) => setTimePeriod(value as TimePeriod)}
                        />
                      </View>
                      <View style={styles.chartContainer}>
                        <GoalProgressBarChart data={goalData.data} goalTotal={goalData.goalTotal} />
                      </View>
                      <View style={styles.goalProgressInfo}>
                        <Text style={styles.goalProgressText}>
                          {goalData.data[goalData.data.length - 1].completed} / {goalData.goalTotal} completed
                        </Text>
                      </View>
                    </View>
                  )}

                </>
              )}

              {/* Rank Tab Content */}
              {personalTab === 'rank' && (
                <RankLadderView
                  statistics={statistics}
                  isLoading={isStatsLoading}
                  onRankUpgrade={loadStatistics}
                />
              )}

              {/* Badges Tab Content */}
              {personalTab === 'badges' && user && (
                <BadgeGrid userId={user.id} />
              )}
            </>
          ) : (
            <>
              {/* Group Stats View */}
              <View style={styles.chartSection}>
                <Text style={styles.title}>{groupName}</Text>
                <Text style={styles.subtitle}>Group Statistics</Text>

                {/* Time Period Toggle */}
                <View style={styles.timePeriodToggleContainer}>
                  <ToggleButton
                    options={[
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                      { value: 'sixMonth', label: '6 Months' },
                    ]}
                    selected={timePeriod}
                    onSelect={(value) => setTimePeriod(value as TimePeriod)}
                  />
                </View>

                {/* Group Credibility Score */}
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Group Average Credibility</Text>
                  <Text style={styles.scoreValue}>{groupAverageScore}</Text>
                  <Text style={styles.scoreSubtext}>out of 100</Text>
                </View>
              </View>

              {/* Group Capacity */}
              <View style={styles.capacityBox}>
                <View style={styles.capacityHeader}>
                  <MaterialCommunityIcons name="account-group" size={28} color={colors.accent} />
                  <View style={styles.capacityTextContainer}>
                    <Text style={styles.capacityLabel}>Group Capacity</Text>
                    <Text style={styles.capacityValue}>
                      {groupCapacity.current} / {groupCapacity.max} members
                    </Text>
                  </View>
                </View>
                <View style={styles.capacityBarBackground}>
                  <LinearGradient
                    colors={[colors.accent, colors.accentGlow]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.capacityBarFill,
                      { width: `${(groupCapacity.current / groupCapacity.max) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Leaderboard */}
              <View style={styles.leaderboardSection}>
                <Text style={styles.sectionTitle}>Leaderboard</Text>
                {isGroupStatsLoading ? (
                  <View style={styles.leaderboardCard}>
                    <ActivityIndicator color={colors.accent} style={{ padding: 20 }} />
                  </View>
                ) : groupMemberStats.length > 0 ? (
                  <View style={styles.leaderboardCard}>
                    {groupMemberStats.map((member, index) => {
                      const memberRank = getUserRank(member.userRank);
                      const displayName = member.isCurrentUser ? 'You' : (member.username || 'Unknown');
                      return (
                        <View
                          key={member.userId}
                          style={[
                            styles.leaderboardItem,
                            index !== groupMemberStats.length - 1 && styles.leaderboardItemBorder,
                            member.isCurrentUser && styles.leaderboardItemHighlight,
                          ]}
                        >
                          <View style={styles.leaderboardLeft}>
                            <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                            <MaterialCommunityIcons
                              name={memberRank.icon as any}
                              size={32}
                              color={memberRank.color}
                              style={{ marginRight: 8 }}
                            />
                            <View style={styles.leaderboardInfo}>
                              <Text style={[
                                styles.leaderboardName,
                                member.isCurrentUser && styles.leaderboardNameYou,
                              ]}>
                                {displayName}
                              </Text>
                              <Text style={styles.leaderboardRankName}>{memberRank.name}</Text>
                            </View>
                          </View>
                          <View style={styles.leaderboardRight}>
                            <Text style={styles.leaderboardScore}>{member.credibility}</Text>
                            <MaterialCommunityIcons
                              name={getSubActivityConfig(member.subActivity)?.icon as any || 'flag'}
                              size={24}
                              color={colors.accent}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.leaderboardCard}>
                    <Text style={styles.emptyStateText}>Join a group to enter a leaderboard!</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Bottom Section */}
          {!hasGoal && viewMode === 'personal' && (
            <View style={styles.bottomSection}>
              <MaterialCommunityIcons name="flag-outline" size={48} color={colors.textMuted} />
              <Text style={styles.placeholderText}>Set a goal to track your progress</Text>
            </View>
          )}
        </ScrollView>

        {/* Credibility Info Modal */}
        <Modal
          visible={showCredibilityInfo}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCredibilityInfo(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCredibilityInfo(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>How to Improve Your Credibility</Text>
                <TouchableOpacity onPress={() => setShowCredibilityInfo(false)}>
                  <MaterialCommunityIcons name="close-circle" size={28} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
                  <Text style={styles.infoText}>Complete your goals consistently every week</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
                  <Text style={styles.infoText}>Upload proof of completion for your activities</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
                  <Text style={styles.infoText}>Maintain streaks by staying active daily</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
                  <Text style={styles.infoText}>Engage with your accountability group members</Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
                  <Text style={styles.infoText}>Avoid missing scheduled activities</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Status Ladder Modal */}
        <Modal
          visible={showStatusLadder}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStatusLadder(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStatusLadder(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Status Ladder</Text>
                <TouchableOpacity onPress={() => setShowStatusLadder(false)}>
                  <MaterialCommunityIcons name="close-circle" size={28} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                {STATUS_LADDER.map((status, index) => (
                  <View
                    key={status.id}
                    style={[
                      styles.statusLadderItem,
                      status.name === currentStatus.name && styles.statusLadderItemActive,
                      index !== STATUS_LADDER.length - 1 && styles.statusLadderItemBorder,
                    ]}
                  >
                    <View style={styles.statusLadderLeft}>
                      <MaterialCommunityIcons name={status.icon as any} size={32} color={status.color} />
                      <View>
                        <Text style={[
                          styles.statusLadderName,
                          status.name === currentStatus.name && styles.statusLadderNameActive,
                        ]}>
                          {status.name}
                        </Text>
                        <Text style={styles.statusLadderScore}>
                          {status.minScore}+ points
                        </Text>
                      </View>
                    </View>
                    {status.name === currentStatus.name && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.screenPaddingBottom,
  },
  headerSection: {
    marginBottom: 24,
  },
  switchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  switchSideLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 80,
    textAlign: 'center',
  },
  switchSideLabelActive: {
    color: colors.accent,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 24,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  credibilityScoreSection: {
    marginBottom: 24,
  },
  sectionHeaderWithInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  statsSection: {
    marginBottom: 32,
  },
  infoButtonSmall: {
    padding: 4,
  },
  credibilityScoreCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 32,
    alignItems: 'center',
  },
  statSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginBottom: 24,
  },
  statCardWrapper: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 90,
  },
  statCardFull: {
    width: '100%',
  },
  statCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  largeScoreValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.accent,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  scoreOutOf: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 8,
  },
  compactToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glassLight,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  compactToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
    minWidth: 36,
    alignItems: 'center',
  },
  compactToggleButtonActive: {
    backgroundColor: colors.accent,
  },
  compactToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compactToggleTextActive: {
    color: colors.textPrimary,
  },
  goalProgressInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glassLight,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.accent,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleButtonTextActive: {
    color: colors.textPrimary,
  },
  chartSection: {
    marginBottom: 32,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoButton: {
    padding: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 0,
  },
  timePeriodToggleContainer: {
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 12,
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 24,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.accent,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  scoreSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  bottomSection: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 20,
    marginBottom: 24,
  },
  statusBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusBoxLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statusBoxValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  goalProgressSection: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  goalProgressCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 20,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  goalFrequency: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  progressBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  progressBarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: colors.glassDark,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  statusText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  statusTextComplete: {
    color: colors.accent,
    fontWeight: '600',
  },
  // Group view styles
  capacityBox: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 20,
    marginBottom: 24,
  },
  capacityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  capacityTextContainer: {
    flex: 1,
  },
  capacityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  capacityBarBackground: {
    height: 8,
    backgroundColor: colors.glassDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  leaderboardSection: {
    marginBottom: 32,
  },
  leaderboardCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leaderboardItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  leaderboardItemHighlight: {
    backgroundColor: colors.glassDark,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMuted,
    width: 36,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  leaderboardNameYou: {
    color: colors.accent,
  },
  leaderboardRankName: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  leaderboardScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    minWidth: 40,
    textAlign: 'right',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.backgroundStart,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  statusLadderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statusLadderItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  statusLadderItemActive: {
    backgroundColor: colors.glassDark,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  statusLadderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusLadderName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statusLadderNameActive: {
    color: colors.accent,
  },
  statusLadderScore: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  currentBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    padding: 20,
  },
  // Personal tabs
  personalTabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glassLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  personalTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  personalTabActive: {
    backgroundColor: colors.accent,
  },
  personalTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  personalTabTextActive: {
    color: colors.textPrimary,
  },
  // Coming soon
  comingSoonContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  // Rank ladder styles
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  currentRankCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  currentRankLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  currentRankDisplay: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  currentRankName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  currentRankStats: {
    flexDirection: 'row',
    gap: 32,
  },
  rankStatItem: {
    alignItems: 'center',
  },
  rankStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rankStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  rankLadderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  rankLadderContainer: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  rankLadderItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  rankLadderItemCurrent: {
    backgroundColor: colors.glassDark,
  },
  rankLadderItemLocked: {
    opacity: 0.5,
  },
  rankLadderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  rankLadderContentLocked: {
    opacity: 0.5,
  },
  rankLadderInfo: {
    flex: 1,
  },
  rankLadderName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  rankLadderNameCurrent: {
    color: colors.accent,
  },
  rankLadderNameLocked: {
    color: colors.textMuted,
  },
  rankLadderRequirements: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  iconLocked: {
    opacity: 0.3,
  },
  currentRankBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  currentRankBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  lockedBadge: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  upgradeMessage: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  confirmText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
  },
  confirmButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
