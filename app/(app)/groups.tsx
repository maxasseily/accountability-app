import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '../../src/components/ui/GradientBackground';
import Button from '../../src/components/ui/Button';
import { colors } from '../../src/utils/colors';

export default function GroupsScreen() {
  const handleCreateGroup = () => {
    // TODO: Implement create group functionality
    console.log('Create Group pressed');
  };

  const handleJoinGroup = () => {
    // TODO: Implement join group functionality
    console.log('Join Group pressed');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <Text style={styles.title}>Groups</Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            variant="primary"
          />
          <Button
            title="Join Group"
            onPress={handleJoinGroup}
            variant="outline"
          />
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
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  buttonContainer: {
    gap: 16,
  },
});
