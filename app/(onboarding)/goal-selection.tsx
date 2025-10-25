import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';

export default function GoalSelectionScreen() {
  const handleSelectRunning = () => {
    router.push('/(onboarding)/frequency-selection');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Goal</Text>
        <Text style={styles.subtitle}>What would you like to achieve?</Text>

        <View style={styles.optionsContainer}>
          {/* Running Option - Active */}
          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleSelectRunning}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="fitness" size={48} color={colors.accent} />
            </View>
            <Text style={styles.optionTitle}>Running</Text>
            <Text style={styles.optionDescription}>
              Track your running goals and progress
            </Text>
          </TouchableOpacity>

          {/* Coming Soon Option - Disabled */}
          <View style={[styles.optionCard, styles.disabledCard]}>
            <View style={styles.iconContainer}>
              <Ionicons name="hourglass-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.optionTitle, styles.disabledText]}>Coming Soon</Text>
            <Text style={[styles.optionDescription, styles.disabledText]}>
              More goals will be available soon
            </Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>SOON</Text>
            </View>
          </View>
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 48,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
  },
  disabledCard: {
    opacity: 0.5,
    borderColor: colors.textMuted,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.glassDark,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  disabledText: {
    color: colors.textMuted,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.textMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.backgroundStart,
    letterSpacing: 1,
  },
});
