import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';

export default function CredibilityMojoIntroScreen() {
  const handleContinue = () => {
    router.push('/(onboarding)/quest-types-intro');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Journey Begins</Text>
        <Text style={styles.subtitle}>Understand your power metrics</Text>

        {/* Credibility Score Card */}
        <View style={styles.metricCard}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[colors.accent, colors.accentGlow]}
              style={styles.iconGradient}
            >
              <Ionicons name="shield-checkmark" size={48} color={colors.textPrimary} />
            </LinearGradient>
          </View>

          <Text style={styles.metricTitle}>Credibility Score</Text>

          <Text style={styles.metricDescription}>
            Credibility score is a metric to show how true you are to your word!
            You've always wanted to get better at your goals, now is your time to
            prove to yourself you can do it!
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>
                Improve by completing goals consistently
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>
                Join a group for further perks
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>
                High scores unlock better rankings
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>
                Command clout over group members
              </Text>
            </View>
          </View>
        </View>

        {/* Mojo Card */}
        <View style={styles.metricCard}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[colors.warning, '#ff9500']}
              style={styles.iconGradient}
            >
              <Ionicons name="flame" size={48} color={colors.textPrimary} />
            </LinearGradient>
          </View>

          <Text style={styles.metricTitle}>Mojo</Text>

          <Text style={styles.metricDescription}>
            Mojo is your credibility currency! You will gain mojo by working
            towards your goals!
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <Ionicons name="trophy" size={20} color={colors.warning} />
              <Text style={styles.benefitText}>
                Earn extra mojo through group quests
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="people" size={20} color={colors.warning} />
              <Text style={styles.benefitText}>
                Team up and face off with group members
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="cash" size={20} color={colors.warning} />
              <Text style={styles.benefitText}>
                Bet mojo on teammates' success
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="trending-down" size={20} color={colors.warning} />
              <Text style={styles.benefitText}>
                Or prey on their downfall if you dare
              </Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentGlow]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={24} color={colors.textPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    marginBottom: 32,
    textAlign: 'center',
  },
  metricCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    padding: 24,
    marginBottom: 20,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  metricTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  metricDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsContainer: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
});
