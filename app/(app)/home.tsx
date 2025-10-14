import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/utils/colors';

export default function HomeScreen() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

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

        <View style={styles.content}>
          <Text style={styles.homeText}>Home screen</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
});
