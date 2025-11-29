import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '../../src/components/ui/GradientBackground';
import AuthCard from '../../src/components/auth/AuthCard';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateUsername,
  getPasswordStrength,
} from '../../src/utils/validation';
import { colors } from '../../src/utils/colors';

export default function SignupScreen() {
  const { signup, checkUsernameAvailability } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSignup = async () => {
    // Validate inputs
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        username: usernameError || '',
        email: emailError || '',
        password: passwordError || '',
        confirmPassword: confirmPasswordError || '',
      });
      return;
    }

    // Check username availability
    setCheckingUsername(true);
    try {
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        setErrors({
          username: 'Username is already taken',
          email: '',
          password: '',
          confirmPassword: '',
        });
        setCheckingUsername(false);
        return;
      }
    } catch (error) {
      console.error('Error checking username:', error);
      Alert.alert('Error', 'Failed to verify username availability. Please try again.');
      setCheckingUsername(false);
      return;
    }
    setCheckingUsername(false);

    setErrors({ username: '', email: '', password: '', confirmPassword: '' });
    setLoading(true);

    try {
      await signup(username, email, password);
      // Navigate to onboarding after successful signup
      router.replace('/(onboarding)/activity-selection');
    } catch (error: any) {
      Alert.alert(
        'Signup Failed',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (!password) return colors.textMuted;
    if (passwordStrength.strength === 'weak') return colors.error;
    if (passwordStrength.strength === 'medium') return colors.warning;
    return colors.success;
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us today</Text>
          </View>

          <AuthCard>
            <Input
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              autoCapitalize="none"
              autoComplete="username"
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              textContentType="oneTimeCode"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
            />

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${(passwordStrength.score / 5) * 100}%`,
                        backgroundColor: getStrengthColor(),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                  {passwordStrength.strength.charAt(0).toUpperCase() +
                    passwordStrength.strength.slice(1)}
                </Text>
              </View>
            )}

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              textContentType="oneTimeCode"
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
            />

            <Button
              title="Sign Up"
              onPress={handleSignup}
              loading={loading || checkingUsername}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  strengthContainer: {
    marginBottom: 20,
  },
  strengthBar: {
    height: 4,
    backgroundColor: colors.glassLight,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
