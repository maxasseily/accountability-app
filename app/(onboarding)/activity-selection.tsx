import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';
import { ACTIVITIES } from '../../src/utils/goalConfig';
import { ActivityType } from '../../src/types/goals';

export default function ActivitySelectionScreen() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

  const handleSelectActivity = (activityId: ActivityType) => {
    setSelectedActivity(activityId);
    // Navigate to goal-selection with the selected activity
    router.push({
      pathname: '/(onboarding)/goal-selection',
      params: { activity: activityId },
    });
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Path</Text>
        <Text style={styles.subtitle}>What type of goal would you like to set?</Text>

        <View style={styles.optionsContainer}>
          {ACTIVITIES.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => handleSelectActivity(activity.id)}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={activity.icon as any} size={48} color={colors.accent} />
              </View>
              <Text style={styles.activityTitle}>{activity.name}</Text>
              <Text style={styles.activityDescription}>
                {activity.description}
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
  activityCard: {
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
  activityTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
