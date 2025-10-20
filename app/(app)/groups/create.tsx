import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { colors } from '../../../src/utils/colors';
import { useGroup } from '../../../src/context/GroupContext';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createGroup } = useGroup();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      setLoading(true);
      await createGroup(groupName.trim());
      Alert.alert(
        'Success!',
        'Your group has been created. Share the access code with your friends!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
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
              <Text style={styles.title}>Create Group</Text>
              <Text style={styles.subtitle}>
                Start your own accountability group and invite up to 5 friends
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Group Name"
                value={groupName}
                onChangeText={setGroupName}
                placeholder="e.g., Workout Warriors, Study Squad"
                autoCapitalize="words"
                maxLength={50}
                autoFocus={false}
              />

              <Text style={styles.infoText}>
                After creating the group, you'll receive a unique access code to share with others.
              </Text>
            </View>

            <View style={styles.buttons}>
              <Button
                title="Create Group"
                onPress={handleCreateGroup}
                loading={loading}
                disabled={!groupName.trim()}
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
    gap: 20,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  buttons: {
    gap: 12,
  },
});
