import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Svg, Polyline, Line, Text as SvgText } from 'react-native-svg';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';

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

          {/* Bottom Half - Reserved for future content */}
          <View style={styles.bottomSection}>
            <Text style={styles.placeholderText}>More stats coming soon...</Text>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 48,
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
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
