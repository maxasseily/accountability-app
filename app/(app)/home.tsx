import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { useAuth } from '../../src/context/AuthContext';
import { useGoal } from '../../src/context/GoalContext';
import { colors } from '../../src/utils/colors';

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const { goal, hasGoal, isLoading, getProgress, incrementProgress, canLogToday } = useGoal();
  const [isLoggingRun, setIsLoggingRun] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSetGoal = () => {
    router.push('/(onboarding)/goal-selection');
  };

  const handleChangeGoal = () => {
    router.push('/(onboarding)/goal-selection');
  };

  const handleLogRun = async () => {
    if (!canLogToday()) {
      Alert.alert('Already Logged', 'You have already logged a run today! Come back tomorrow.');
      return;
    }

    try {
      setIsLoggingRun(true);
      await incrementProgress();
      Alert.alert('Success!', 'Run logged successfully! Keep up the great work!');
    } catch (error) {
      console.error('Error logging run:', error);
      if (error instanceof Error && error.message === 'Already logged a run today') {
        Alert.alert('Already Logged', 'You have already logged a run today!');
      } else {
        Alert.alert('Error', 'Failed to log run. Please try again.');
      }
    } finally {
      setIsLoggingRun(false);
    }
  };

  const progress = getProgress();
  const canLog = canLogToday();

  if (isLoading) {
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
      <View style={styles.container}>
        {/* Logout Button - Top Right */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={28} color={colors.textPrimary} />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.nameText}>{user?.name}!</Text>
          </View>

          {hasGoal && goal && progress ? (
            /* Show Goal Progress */
            <>
              {/* Current Goal Card */}
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleContainer}>
                    <Ionicons name="fitness" size={32} color={colors.accent} />
                    <View>
                      <Text style={styles.goalLabel}>Your Goal</Text>
                      <Text style={styles.goalTitle}>
                        Run {goal.frequency}x per week
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>This Week's Progress</Text>
                    <Text style={styles.progressText}>
                      {progress.completed}/{progress.total} runs
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarContainer}>
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
                    <Text style={styles.percentageText}>
                      {Math.round(progress.percentage)}%
                    </Text>
                  </View>

                  {/* Progress Indicators */}
                  <View style={styles.progressIndicators}>
                    {Array.from({ length: goal.frequency }).map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.progressDot,
                          index < progress.completed && styles.progressDotCompleted,
                        ]}
                      >
                        {index < progress.completed && (
                          <Ionicons name="checkmark" size={16} color={colors.textPrimary} />
                        )}
                      </View>
                    ))}
                  </View>

                  {/* Log Run Button */}
                  <TouchableOpacity
                    style={[styles.logRunButton, !canLog && styles.logRunButtonDisabled]}
                    onPress={handleLogRun}
                    disabled={!canLog || isLoggingRun}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={canLog ? [colors.accent, colors.accentGlow] : [colors.glassDark, colors.glassDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.logRunGradient}
                    >
                      {isLoggingRun ? (
                        <ActivityIndicator size="small" color={colors.textPrimary} />
                      ) : (
                        <>
                          <Ionicons
                            name={canLog ? "checkmark-circle" : "checkmark-done-circle"}
                            size={24}
                            color={colors.textPrimary}
                          />
                          <Text style={styles.logRunText}>
                            {canLog ? 'Log Run' : 'Logged Today!'}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Change Goal Button */}
                <TouchableOpacity
                  style={styles.changeGoalButton}
                  onPress={handleChangeGoal}
                  activeOpacity={0.7}
                >
                  <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.changeGoalText}>Change Goal</Text>
                </TouchableOpacity>
              </View>

              {/* Motivational Message */}
              <View style={styles.motivationCard}>
                <Ionicons name="flame" size={32} color={colors.accent} />
                <Text style={styles.motivationText}>
                  {progress.completed === progress.total
                    ? "Amazing! You've crushed your goal this week!"
                    : progress.completed > 0
                    ? `Keep it up! ${progress.total - progress.completed} more to go!`
                    : "Let's get started! Your first run awaits!"}
                </Text>
              </View>
            </>
          ) : (
            /* Show Set Goal CTA */
            <View style={styles.noGoalCard}>
              <Ionicons name="flag-outline" size={64} color={colors.accent} />
              <Text style={styles.noGoalTitle}>Set Your Goal</Text>
              <Text style={styles.noGoalText}>
                Start your journey by setting a weekly running goal
              </Text>
              <TouchableOpacity
                style={styles.setGoalButton}
                onPress={handleSetGoal}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.accent, colors.accentGlow]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.setGoalGradient}
                >
                  <Text style={styles.setGoalButtonText}>Set Your Goal</Text>
                  <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
                </LinearGradient>
              </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoutButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glassLight,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  goalCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    padding: 24,
    marginBottom: 20,
  },
  goalHeader: {
    marginBottom: 24,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  goalLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  progressSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: colors.glassDark,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'right',
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassDark,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotCompleted: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  logRunButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  logRunButtonDisabled: {
    opacity: 0.6,
  },
  logRunGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  logRunText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  changeGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  changeGoalText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  motivationCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  motivationText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 24,
  },
  noGoalCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    padding: 40,
    alignItems: 'center',
  },
  noGoalTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  noGoalText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  setGoalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  setGoalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  setGoalButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
