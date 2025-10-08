import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import GradientBackground from '../../src/components/ui/GradientBackground';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/utils/colors';
import { pickDailyPhoto, uploadDailyPhoto, getTodayPhoto, requestPermissions, DailyPhoto } from '../../src/utils/dailyPhoto';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [todayPhoto, setTodayPhoto] = useState<DailyPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load today's photo on mount
  useEffect(() => {
    loadTodayPhoto();
  }, [user]);

  const loadTodayPhoto = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const photo = await getTodayPhoto(user.id);
      setTodayPhoto(photo);
    } catch (error) {
      console.error('Error loading today\'s photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
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

      // Pick image
      const image = await pickDailyPhoto();
      if (!image) return;

      setIsUploading(true);

      // Upload to Supabase
      const uploadedPhoto = await uploadDailyPhoto(user.id, image.uri);

      // Clear photo first to force unmount/remount of Image component
      setTodayPhoto(null);

      // Then set new photo after a brief delay
      setTimeout(() => {
        setTodayPhoto({
          ...uploadedPhoto,
          uploaded_at: new Date().toISOString(),
        });
      }, 100);

      Alert.alert('Success', 'Today\'s photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
          {/* Statistics Button - Top Right */}
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => router.push('/(app)/statistics')}
          >
            <Text style={styles.statsButtonText}>📊</Text>
          </TouchableOpacity>

          <View style={styles.content}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>

            <TouchableOpacity
              style={styles.imageFrame}
              onPress={handleUploadPhoto}
              disabled={isUploading}
            >
              {isLoading ? (
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
                  <Text style={styles.placeholderSubtext}>Today's Photo</Text>
                </View>
              )}

              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.rankText}>{user?.rank || 'Beginner'}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Button title="Logout" onPress={handleLogout} variant="outline" />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  statsButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glassLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statsButtonText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  imageFrame: {
    width: 200,
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassLight,
    padding: 4,
    marginBottom: 16,
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
  rankText: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    paddingTop: 24,
  },
});
