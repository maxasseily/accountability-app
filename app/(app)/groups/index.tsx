import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import GroupCard from '../../../src/components/groups/GroupCard';
import MemberList from '../../../src/components/groups/MemberList';
import NoGroupState from '../../../src/components/groups/NoGroupState';
import { colors } from '../../../src/utils/colors';
import { useGroup } from '../../../src/context/GroupContext';
import { useAuth } from '../../../src/context/AuthContext';

export default function GroupsScreen() {
  const { group, isLoading, leaveGroup } = useGroup();
  const { user } = useAuth();

  const handleLeaveGroup = () => {
    Alert.alert(
      'Warning, you are leaving the group. Are you sure you want to do this?',
      '',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to leave group');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <StatusBar style="light" hidden={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Groups</Text>

        {group && user ? (
          <>
            <GroupCard group={group} onLeaveGroup={handleLeaveGroup} />
            <MemberList members={group.members} currentUserId={user.id} />
          </>
        ) : (
          <NoGroupState />
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
});
