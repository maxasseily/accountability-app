import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBackground from '../../src/components/ui/GradientBackground';
import { colors } from '../../src/utils/colors';

type QuestType = 'alliance' | 'battle' | 'prophecy' | 'curse';

interface QuestInfo {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
}

const questTypes: Record<QuestType, QuestInfo> = {
  alliance: {
    icon: 'people',
    title: 'Alliances',
    description:
      'You and your teammates will go back to back and support each other to complete your goals for the week! If you both complete your goals, you will get double mojo and hella credibility!',
    gradient: [colors.success, '#00b894'],
  },
  battle: {
    icon: 'flash',
    title: 'Battle',
    description:
      'You and your teammates can go head to head and compete for who will do more to reach or surpass their goal for the week! Whoever wins will get a healthy boost of mojo, whoever loses may not be so lucky...',
    gradient: [colors.error, '#e74c3c'],
  },
  prophecy: {
    icon: 'eye',
    title: 'Prophecy',
    description:
      'If you think your group members have got their goal in the bag, you can show your support by prophesying their successes! If you prophesyse correctly, depending on how credible this group member is, you will get some mojo rewards for believing in them!',
    gradient: [colors.accent, colors.accentGlow],
  },
  curse: {
    icon: 'skull',
    title: 'Curse',
    description:
      'If you think your group members are too ambitious with their goals, you can stump up some mojo to prey on their downfall. Depending on how credible this group member is, you will get some mojo rewards for calling their bluff!',
    gradient: ['#9b59b6', '#8e44ad'],
  },
};

export default function QuestTypesIntroScreen() {
  const handleContinue = () => {
    router.replace('/(app)/home');
  };

  const renderQuestCard = (type: QuestType, info: QuestInfo) => (
    <View key={type} style={styles.questCard}>
      <View style={styles.questHeader}>
        <LinearGradient colors={info.gradient} style={styles.questIconGradient}>
          <Ionicons name={info.icon} size={32} color={colors.textPrimary} />
        </LinearGradient>
        <Text style={styles.questTitle}>{info.title}</Text>
      </View>
      <Text style={styles.questDescription}>{info.description}</Text>
    </View>
  );

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Quest Types</Text>
        <Text style={styles.subtitle}>
          Four ways to challenge yourself and others
        </Text>

        <View style={styles.questsContainer}>
          {(Object.keys(questTypes) as QuestType[]).map((type) =>
            renderQuestCard(type, questTypes[type])
          )}
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
            <Text style={styles.buttonText}>Get Started</Text>
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
  questsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  questCard: {
    backgroundColor: colors.glassLight,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    padding: 20,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  questIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  questTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  questDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
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
