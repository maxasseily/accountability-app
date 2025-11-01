import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { colors } from '../../../src/utils/colors';
import { useGroup } from '../../../src/context/GroupContext';

export default function JoinGroupScreen() {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinGroup } = useGroup();

  const handleJoinGroup = async () => {
    if (!accessCode.trim()) {
      Alert.alert('Error', 'Please enter an access code');
      return;
    }

    try {
      setLoading(true);
      await joinGroup(accessCode.trim().toUpperCase());
      Alert.alert(
        'Success!',
        'You have joined the group!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join group';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Join Group</Text>
              <Text style={styles.subtitle}>
                Enter the access code shared by your group creator
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Access Code"
                value={accessCode}
                onChangeText={(text) => setAccessCode(text.toUpperCase())}
                placeholder="e.g., A1B2C3D4"
                autoCapitalize="characters"
                maxLength={8}
                autoFocus={false}
                autoCorrect={false}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>How to join:</Text>
                <Text style={styles.infoText}>
                  1. Get the 8-character access code from your group creator
                </Text>
                <Text style={styles.infoText}>
                  2. Enter it above
                </Text>
                <Text style={styles.infoText}>
                  3. You'll instantly join the group (max 6 members)
                </Text>
              </View>
            </View>

            <View style={styles.buttons}>
              <Button
                title="Join Group"
                onPress={handleJoinGroup}
                loading={loading}
                disabled={accessCode.trim().length < 6}
              />
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="outline"
                disabled={loading}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
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
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  infoBox: {
    backgroundColor: colors.glassLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttons: {
    gap: 12,
  },
});
