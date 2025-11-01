import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, ActionSheetIOS, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { useAuth } from '../../src/context/AuthContext';
import { useGoal } from '../../src/context/GoalContext';
import { colors } from '../../src/utils/colors';
import { spacing } from '../../src/utils/spacing';
import { pickDailyPhoto, takeDailyPhoto, uploadDailyPhoto, getTodayPhoto, requestPermissions, DailyPhoto } from '../../src/utils/dailyPhoto';

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const { goal, hasGoal, isLoading, getProgress, incrementProgress, canLogToday } = useGoal();
  const [isLoggingRun, setIsLoggingRun] = useState(false);
  const [todayPhoto, setTodayPhoto] = useState<DailyPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);

  // Load today's photo on mount
  useEffect(() => {
    loadTodayPhoto();
  }, [user]);

  const loadTodayPhoto = async () => {
    if (!user) {
      setIsLoadingPhoto(false);
      return;
    }

    try {
      const photo = await getTodayPhoto(user.id);
      setTodayPhoto(photo);
    } catch (error) {
      console.error('Error loading today\'s photo:', error);
    } finally {
      setIsLoadingPhoto(false);
    }
  };

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

  const showPhotoOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleUploadPhoto('camera');
          } else if (buttonIndex === 2) {
            handleUploadPhoto('library');
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert(
        'Upload Photo',
        'Choose an option',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Take Photo',
            onPress: () => handleUploadPhoto('camera'),
          },
          {
            text: 'Choose from Library',
            onPress: () => handleUploadPhoto('library'),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleUploadPhoto = async (source: 'camera' | 'library') => {
    if (!user) return;

    try {
      // Request permissions
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Please grant camera and photo library permissions to upload photos.'
        );
        return;
      }

      // Pick or take image based on source
      const image = source === 'camera'
        ? await takeDailyPhoto()
        : await pickDailyPhoto();

      if (!image) return;

      setIsUploading(true);

      // Upload to Supabase
      const uploadedPhoto = await uploadDailyPhoto(user.id, image.uri);

      // Update the photo state
      setTodayPhoto({
        ...uploadedPhoto,
        uploaded_at: new Date().toISOString(),
      });

      // Automatically log a run after photo upload
      if (hasGoal && canLogToday()) {
        try {
          await incrementProgress();
          Alert.alert(
            'Success!',
            'Photo uploaded & run logged! Keep up the great work!'
          );
        } catch (error) {
          console.error('Error logging run:', error);
          // Photo uploaded successfully, but run logging failed
          Alert.alert(
            'Photo Uploaded',
            'Your photo was uploaded, but there was an issue logging your run. You can try logging it manually.'
          );
        }
      } else {
        // Just show photo uploaded (no goal set or already logged today)
        Alert.alert('Success!', 'Photo uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section with Logout Button */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeRow}>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>{user?.name}!</Text>
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Photo Upload Section */}
          <View style={styles.photoCard}>
            <View style={styles.photoHeader}>
              <Ionicons name="camera" size={24} color={colors.accent} />
              <Text style={styles.photoLabel}>Today's Photo</Text>
            </View>

            <TouchableOpacity
              style={styles.imageFrame}
              onPress={showPhotoOptions}
              disabled={isUploading || isLoadingPhoto}
              activeOpacity={0.8}
            >
              {isLoadingPhoto ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator size="large" color={colors.accent} />
                </View>
              ) : todayPhoto ? (
                <Image
                  source={{ uri: `${todayPhoto.photo_url}?t=${todayPhoto.uploaded_at}` }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                  key={todayPhoto.uploaded_at}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderIcon}>📷</Text>
                  <Text style={styles.placeholderText}>Tap to Upload</Text>
                  <Text style={styles.placeholderSubtext}>Required for daily accountability</Text>
                </View>
              )}

              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </TouchableOpacity>

            {todayPhoto && (
              <View style={styles.photoCompleted}>
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                <Text style={styles.photoCompletedText}>Photo uploaded today!</Text>
              </View>
            )}
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
    paddingTop: spacing.screenPaddingTop,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.screenPaddingBottom,
  },
  logoutButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.glassLight,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  welcomeTextContainer: {
    flex: 1,
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
    flexWrap: 'wrap',
  },
  photoCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  photoLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  imageFrame: {
    width: 200,
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassLight,
    padding: 4,
    marginBottom: 12,
  },
  imagePlaceholder: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.glassBorder,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: 12,
  },
  photoCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.glassDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  photoCompletedText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
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
