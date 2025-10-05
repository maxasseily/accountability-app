import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import GradientBackground from '../../src/components/ui/GradientBackground';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/utils/colors';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{user?.name || 'User'}!</Text>
          <Text style={styles.emailText}>{user?.email}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎯 Accountability Dashboard</Text>
            <Text style={styles.cardDescription}>
              Your accountability journey starts here. Track your goals, build habits,
              and stay accountable.
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Days Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
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
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  emailText: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 40,
  },
  card: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.glassLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingTop: 24,
  },
});
