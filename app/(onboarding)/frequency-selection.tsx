import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';
import { useGoal } from '../../src/context/GoalContext';
import { useState } from 'react';
import { ActivityType, SubActivity } from '../../src/types/goals';
import { getSubActivityConfig } from '../../src/utils/goalConfig';

type FrequencyOption = 2 | 3 | 4;

export default function FrequencySelectionScreen() {
  const params = useLocalSearchParams();
  const activity = params.activity as ActivityType;
  const subActivity = params.subActivity as SubActivity;

  const { setGoal } = useGoal();
  const [isLoading, setIsLoading] = useState(false);

  const subActivityConfig = getSubActivityConfig(subActivity);

  const handleSelectFrequency = async (frequency: FrequencyOption) => {
    if (frequency !== 3) return; // Only 3x/week is enabled

    try {
      setIsLoading(true);
      await setGoal(activity, subActivity, frequency);
      router.push({
        pathname: '/(onboarding)/goal-confirmation',
        params: { activity, subActivity, frequency: frequency.toString() },
      });
    } catch (error) {
      console.error('Error setting goal:', error);
      alert('Failed to set goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const frequencies: { value: FrequencyOption; enabled: boolean }[] = [
    { value: 2, enabled: false },
    { value: 3, enabled: true },
    { value: 4, enabled: false },
  ];

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>How Often?</Text>
        <Text style={styles.subtitle}>Choose your weekly {subActivityConfig?.actionNoun} frequency</Text>

        <View style={styles.optionsContainer}>
          {frequencies.map(({ value, enabled }) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.frequencyCard,
                !enabled && styles.disabledCard,
              ]}
              onPress={() => handleSelectFrequency(value)}
              disabled={!enabled || isLoading}
              activeOpacity={0.8}
            >
              <View style={styles.frequencyContent}>
                <Text style={[styles.frequencyNumber, !enabled && styles.disabledText]}>
                  {value}
                </Text>
                <Text style={[styles.frequencyLabel, !enabled && styles.disabledText]}>
                  times/week
                </Text>
              </View>
              {!enabled && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>SOON</Text>
                </View>
              )}
              {enabled && (
                <View style={styles.checkmarkContainer}>
                  <MaterialCommunityIcons name="check-circle" size={32} color={colors.accent} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.hint}>
          More frequency options coming soon!
        </Text>
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
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
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
    gap: 16,
    marginBottom: 24,
  },
  frequencyCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 24,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledCard: {
    opacity: 0.5,
    borderColor: colors.glassBorder,
  },
  frequencyContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  frequencyNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.accent,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  frequencyLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  disabledText: {
    color: colors.textMuted,
  },
  comingSoonBadge: {
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
  checkmarkContainer: {
    marginRight: 8,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
