import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';
import { getSubActivitiesForActivity, getActivityConfig } from '../../src/utils/goalConfig';
import { ActivityType, SubActivity } from '../../src/types/goals';

export default function GoalSelectionScreen() {
  const params = useLocalSearchParams();
  const activity = params.activity as ActivityType;

  // Get the activity config and sub-activities
  const activityConfig = getActivityConfig(activity);
  const subActivities = getSubActivitiesForActivity(activity);

  const handleSelectSubActivity = (subActivityId: SubActivity) => {
    router.push({
      pathname: '/(onboarding)/frequency-selection',
      params: { activity, subActivity: subActivityId },
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{activityConfig?.name} Goals</Text>
        <Text style={styles.subtitle}>Choose your specific goal</Text>

        <View style={styles.optionsContainer}>
          {subActivities.map((subActivity) => (
            <TouchableOpacity
              key={subActivity.id}
              style={styles.optionCard}
              onPress={() => handleSelectSubActivity(subActivity.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={subActivity.icon as any} size={48} color={colors.accent} />
              </View>
              <Text style={styles.optionTitle}>{subActivity.name}</Text>
              <Text style={styles.optionDescription}>
                {subActivity.description}
              </Text>
            </TouchableOpacity>
          ))}
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
});
