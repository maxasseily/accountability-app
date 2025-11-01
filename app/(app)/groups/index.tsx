import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import GroupHeader from '../../../src/components/groups/GroupHeader';
import MemberList from '../../../src/components/groups/MemberList';
import GroupChatButton from '../../../src/components/groups/GroupChatButton';
import GroupAccessInfo from '../../../src/components/groups/GroupAccessInfo';
import NoGroupState from '../../../src/components/groups/NoGroupState';
import { colors } from '../../../src/utils/colors';
import { spacing } from '../../../src/utils/spacing';
import { useGroup } from '../../../src/context/GroupContext';
import { useAuth } from '../../../src/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback, useState } from 'react';

export default function GroupsScreen() {
  const { group, isLoading, leaveGroup, refreshGroup } = useGroup();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshGroup();
      setRefreshToken((prev) => prev + 1);
    } catch (error) {
      console.error('Error refreshing group:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshGroup]);

  if (isLoading && !isRefreshing) {
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: spacing.screenPaddingTopCompact + insets.top },
        ]}
      >
        {group && user ? (
          <>
            <GroupHeader
              groupName={group.name}
              memberCount={group.member_count}
            />
            <MemberList
              members={group.members}
              currentUserId={user.id}
              refreshToken={refreshToken}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
            <GroupChatButton />
            <GroupAccessInfo
              groupName={group.name}
              accessCode={group.access_code}
              onLeaveGroup={handleLeaveGroup}
            />
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
    paddingTop: spacing.screenPaddingTopCompact,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.screenPaddingBottom,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
