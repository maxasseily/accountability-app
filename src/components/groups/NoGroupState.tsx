import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';
import Button from '../ui/Button';

export default function NoGroupState() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>👥</Text>
        <Text style={styles.title}>Join an Accountability Group</Text>
        <Text style={styles.subtitle}>
          Team up with up to 5 others to stay accountable and reach your goals together.
        </Text>

        <View style={styles.buttons}>
          <Button
            title="Create Group"
            onPress={() => router.push('/(app)/groups/create')}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="Join with Code"
            onPress={() => router.push('/(app)/groups/join')}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
