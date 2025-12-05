import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image, ActionSheetIOS, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { useAuth } from '../../src/context/AuthContext';
import { useGoal } from '../../src/context/GoalContext';
import { colors } from '../../src/utils/colors';
import { spacing } from '../../src/utils/spacing';
import { pickDailyPhoto, takeDailyPhoto, uploadDailyPhoto, getTodayPhoto, requestPermissions, DailyPhoto } from '../../src/utils/dailyPhoto';
import { getUnreadNotifications, markNotificationAsRead } from '../../src/lib/notifications';
import { getSubActivityConfig, formatGoalText, getLogActionText } from '../../src/utils/goalConfig';

// Get background color based on progress (0-7 logs)
// 0 = dull grey, 1-3 = blue gradient, 4-5 = purple, 6-7 = red
function getProgressColor(completed: number): string {
  if (completed === 0) {
    return 'rgba(100, 100, 100, 0.3)'; // Dull grey
  } else if (completed === 1) {
    return 'rgba(0, 100, 200, 0.3)'; // Light blue
  } else if (completed === 2) {
    return 'rgba(0, 150, 255, 0.4)'; // Medium blue
  } else if (completed === 3) {
    return 'rgba(0, 200, 255, 0.5)'; // Bright blue (cyan)
  } else if (completed === 4) {
    return 'rgba(100, 100, 255, 0.5)'; // Blue-purple
  } else if (completed === 5) {
    return 'rgba(150, 50, 200, 0.5)'; // Purple
  } else if (completed === 6) {
    return 'rgba(200, 50, 100, 0.6)'; // Red-purple
  } else { // 7+
    return 'rgba(255, 50, 50, 0.6)'; // Red
  }
}

// Get border color based on progress
function getProgressBorderColor(completed: number): string {
  if (completed === 0) {
    return 'rgba(150, 150, 150, 0.5)'; // Grey border
  } else if (completed === 1) {
    return 'rgba(0, 150, 255, 0.6)'; // Light blue border
  } else if (completed === 2) {
    return 'rgba(0, 180, 255, 0.7)'; // Medium blue border
  } else if (completed === 3) {
    return 'rgba(0, 212, 255, 0.8)'; // Bright blue (cyan) border
  } else if (completed === 4) {
    return 'rgba(120, 120, 255, 0.8)'; // Blue-purple border
  } else if (completed === 5) {
    return 'rgba(180, 80, 220, 0.8)'; // Purple border
  } else if (completed === 6) {
    return 'rgba(220, 80, 120, 0.8)'; // Red-purple border
  } else { // 7+
    return 'rgba(255, 80, 80, 0.9)'; // Red border
  }
}

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const { goal, hasGoal, isLoading, getProgress, incrementProgress, canLogToday } = useGoal();
  const [isLoggingRun, setIsLoggingRun] = useState(false);
  const [todayPhoto, setTodayPhoto] = useState<DailyPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);
  const insets = useSafeAreaInsets();

  // Load today's photo on mount
  useEffect(() => {
    loadTodayPhoto();
  }, [user]);

  // Check for unread notifications on mount
  useEffect(() => {
    checkForNotifications();
  }, [user]);

  const checkForNotifications = async () => {
    if (!user) return;

    try {
      const notifications = await getUnreadNotifications(user.id);

      // Show notifications one by one
      if (notifications.length > 0) {
        showNotifications(notifications, 0);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const showNotifications = async (notifications: any[], index: number) => {
    if (index >= notifications.length) return;

    const notification = notifications[index];

    Alert.alert(
      notification.title,
      notification.message,
      [
        {
          text: 'OK',
          onPress: async () => {
            // Mark as read
            try {
              await markNotificationAsRead(notification.id);
            } catch (error) {
              console.error('Error marking notification as read:', error);
            }

            // Show next notification after a delay
            if (index + 1 < notifications.length) {
              setTimeout(() => {
                showNotifications(notifications, index + 1);
              }, 300);
            }
          },
        },
      ]
    );
  };

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
    router.push('/(onboarding)/activity-selection');
  };

  const handleChangeGoal = () => {
    router.push('/(onboarding)/activity-selection');
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
          const result = await incrementProgress();

          // Show mojo gained feedback
          const mojoMessage = result.weeklyGoalCompleted
            ? `🎉 Weekly goal completed! +${result.mojoGained} mojo (+5 for logging + 10 bonus!)`
            : `+${result.mojoGained} mojo earned!`;

          // Show main success alert
          const subActivityConfig = getSubActivityConfig(goal!.subActivity);
          Alert.alert(
            'Success!',
            `Photo uploaded & goal logged!\n\n${mojoMessage}\n\nKeep up the great work!`,
            [{
              text: 'OK', onPress: async () => {
                // Check for alliance bonus after main alert is dismissed
                if (result.hasAllianceBonus && user) {
                  // Fetch the alliance notification that was just created
                  try {
                    const notifications = await getUnreadNotifications(user.id);
                    const allianceNotification = notifications.find(n => n.notificationType === 'alliance_success');

                    if (allianceNotification) {
                      setTimeout(() => {
                        Alert.alert(
                          allianceNotification.title,
                          allianceNotification.message,
                          [{
                            text: 'Amazing!', onPress: async () => {
                              // Mark as read
                              try {
                                await markNotificationAsRead(allianceNotification.id);
                              } catch (error) {
                                console.error('Error marking notification as read:', error);
                              }
                            }
                          }]
                        );
                      }, 300);
                    }
                  } catch (error) {
                    console.error('Error fetching alliance notification:', error);
                  }
                }
              }
            }]
          );
        } catch (error) {
          console.error('Error logging goal:', error);
          // Photo uploaded successfully, but goal logging failed
          Alert.alert(
            'Photo Uploaded',
            'Your photo was uploaded, but there was an issue logging your goal. You can try logging it manually.'
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
      Alert.alert('Already Logged', 'You have already logged your goal today! Come back tomorrow.');
      return;
    }

    try {
      setIsLoggingRun(true);
      const result = await incrementProgress();

      // Show mojo gained feedback
      const mojoMessage = result.weeklyGoalCompleted
        ? `🎉 Weekly goal completed! +${result.mojoGained} mojo (+5 for logging + 10 bonus!)`
        : `+${result.mojoGained} mojo earned!`;

      // Show main success alert
      Alert.alert(
        'Success!',
        `Goal logged successfully!\n\n${mojoMessage}\n\nKeep up the great work!`,
        [{
          text: 'OK', onPress: async () => {
            // Check for alliance bonus after main alert is dismissed
            if (result.hasAllianceBonus && user) {
              // Fetch the alliance notification that was just created
              try {
                const notifications = await getUnreadNotifications(user.id);
                const allianceNotification = notifications.find(n => n.notificationType === 'alliance_success');

                if (allianceNotification) {
                  setTimeout(() => {
                    Alert.alert(
                      allianceNotification.title,
                      allianceNotification.message,
                      [{
                        text: 'Amazing!', onPress: async () => {
                          // Mark as read
                          try {
                            await markNotificationAsRead(allianceNotification.id);
                          } catch (error) {
                            console.error('Error marking notification as read:', error);
                          }
                        }
                      }]
                    );
                  }, 300);
                }
              } catch (error) {
                console.error('Error fetching alliance notification:', error);
              }
            }
          }
        }]
      );
    } catch (error) {
      console.error('Error logging goal:', error);
      if (error instanceof Error && error.message === 'Already logged a run today') {
        Alert.alert('Already Logged', 'You have already logged your goal today!');
      } else {
        Alert.alert('Error', 'Failed to log goal. Please try again.');
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: spacing.screenPaddingTopCompact + insets.top },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section with Logout Button */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeRow}>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.greetingLabel}>Welcome back,</Text>
                <Text style={styles.greetingName}>
                  {user?.name ? `${user.name}!` : 'friend!'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons name="logout" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Photo Upload Section */}
          <View style={styles.photoCard}>
            <View style={styles.photoHeader}>
              <MaterialCommunityIcons name="camera" size={24} color={colors.accent} />
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
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.accent} />
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
                    <MaterialCommunityIcons
                      name={getSubActivityConfig(goal.subActivity)?.icon as any}
                      size={32}
                      color={colors.accent}
                    />
                    <View style={styles.goalTextContainer}>
                      <Text style={styles.goalLabel}>Your Goal</Text>
                      <Text style={styles.goalTitle}>
                        {formatGoalText(goal.subActivity, goal.frequency)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>This Week's Progress</Text>
                    <Text style={styles.progressText}>
                      {progress.completed}/{progress.total} completed
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
                          { width: `${Math.min(progress.percentage, 100)}%` },
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
                          <MaterialCommunityIcons name="check" size={16} color={colors.textPrimary} />
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
                          <MaterialCommunityIcons
                            name={canLog ? "check-circle" : "check-all"}
                            size={24}
                            color={colors.textPrimary}
                          />
                          <Text style={styles.logRunText}>
                            {canLog ? `Log ${getLogActionText(goal.subActivity)}` : 'Logged Today!'}
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
                  <MaterialCommunityIcons name="cog-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.changeGoalText}>Change Goal</Text>
                </TouchableOpacity>
              </View>

              {/* Motivational Message */}
              <View style={[
                styles.motivationCard,
                {
                  backgroundColor: getProgressColor(progress.completed),
                  borderColor: getProgressBorderColor(progress.completed),
                }
              ]}>
                <MaterialCommunityIcons name="fire" size={32} color={colors.accent} />
                <Text style={styles.motivationText}>
                  {progress.completed > progress.total
                    ? "You have surpassed your goal this week! You're crushing it!"
                    : progress.completed === progress.total
                      ? "Amazing! You've crushed your goal this week!"
                      : progress.completed > 0
                        ? `Keep it up! ${progress.total - progress.completed} more to go!`
                        : `Let's get started! Your first ${getLogActionText(goal.subActivity).toLowerCase()} awaits!`}
                </Text>
              </View>
            </>
          ) : (
            /* Show Set Goal CTA */
            <View style={styles.noGoalCard}>
              <MaterialCommunityIcons name="flag-outline" size={64} color={colors.accent} />
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
                  <MaterialCommunityIcons name="arrow-right" size={24} color={colors.textPrimary} />
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
    paddingTop: spacing.screenPaddingTopCompact,
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
  greetingLabel: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '700',
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
  goalTextContainer: {
    flex: 1,
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
    flexWrap: 'wrap',
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
