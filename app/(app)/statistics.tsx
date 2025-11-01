import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Svg, Polyline, Line, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { useGoal } from '../../src/context/GoalContext';
import { colors } from '../../src/utils/colors';
import { spacing } from '../../src/utils/spacing';

// Generate fake credibility data for the last 30 days
const generateFakeData = () => {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate credibility score (0-100) with some variation
    // Start low and trend upward with some randomness
    const baseScore = 30 + (29 - i) * 2;
    const randomVariation = Math.random() * 15 - 7.5;
    const credibility = Math.min(100, Math.max(0, baseScore + randomVariation));

    data.push({
      day: i === 0 ? 'Today' : `${i}d ago`,
      dayNumber: 29 - i,
      credibility: Math.round(credibility),
    });
  }

  return data;
};

const fakeData = generateFakeData();
const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 96;
const CHART_HEIGHT = 200;
const PADDING = { top: 10, bottom: 30, left: 40, right: 10 };

// Simple chart component using SVG
const SimpleLineChart = ({ data }: { data: any[] }) => {
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

export default function StatisticsScreen() {
  const { goal, hasGoal, getProgress } = useGoal();
  const progress = getProgress();

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Chart Section */}
          <View style={styles.chartSection}>
            <Text style={styles.title}>Credibility Over Time</Text>
            <Text style={styles.subtitle}>Last 30 Days</Text>

            <View style={styles.chartContainer}>
              <SimpleLineChart data={fakeData} />
            </View>

            {/* Current Score Display */}
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Current Credibility</Text>
              <Text style={styles.scoreValue}>{fakeData[fakeData.length - 1].credibility}</Text>
              <Text style={styles.scoreSubtext}>out of 100</Text>
            </View>
          </View>

          {/* Weekly Goal Progress Section */}
          {hasGoal && goal && progress && (
            <View style={styles.goalProgressSection}>
              <Text style={styles.sectionTitle}>Weekly Goal Progress</Text>

              <View style={styles.goalProgressCard}>
                <View style={styles.goalProgressHeader}>
                  <View style={styles.goalInfoContainer}>
                    <Ionicons name="fitness" size={28} color={colors.accent} />
                    <View>
                      <Text style={styles.goalType}>Running Goal</Text>
                      <Text style={styles.goalFrequency}>{goal.frequency}x per week</Text>
                    </View>
                  </View>

                  <View style={styles.progressBadge}>
                    <Text style={styles.progressBadgeText}>
                      {progress.completed}/{progress.total}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarSection}>
                  <View style={styles.progressBarBackground}>
                    <LinearGradient
                      colors={[colors.accent, colors.accentGlow]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.progressBarFill,
                        { width: `${progress.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {Math.round(progress.percentage)}%
                  </Text>
                </View>

                {/* Status Message */}
                <View style={styles.statusSection}>
                  <Ionicons
                    name={progress.completed === progress.total ? "checkmark-circle" : "time-outline"}
                    size={20}
                    color={progress.completed === progress.total ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[
                    styles.statusText,
                    progress.completed === progress.total && styles.statusTextComplete
                  ]}>
                    {progress.completed === progress.total
                      ? "Goal completed this week!"
                      : `${progress.total - progress.completed} more to reach your goal`}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Section */}
          {!hasGoal && (
            <View style={styles.bottomSection}>
              <Ionicons name="flag-outline" size={48} color={colors.textMuted} />
              <Text style={styles.placeholderText}>Set a goal to track your progress</Text>
            </View>
          )}
        </ScrollView>
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
    paddingTop: spacing.screenPaddingTop,
    paddingBottom: spacing.screenPaddingBottom,
  },
  chartSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
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
  goalProgressSection: {
    marginBottom: 32,
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
});
