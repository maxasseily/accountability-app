import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../src/utils/colors';
import { spacing } from '../../src/utils/spacing';
import GradientBackground from '../../src/components/ui/GradientBackground';
import ArenaMemberList from '../../src/components/arena/ArenaMemberList';
import QuestsSection from '../../src/components/arena/QuestsSection';
import RequestsSection from '../../src/components/arena/RequestsSection';
import { useGroup } from '../../src/context/GroupContext';
import { useAuth } from '../../src/context/AuthContext';

function NoGroupState() {
  return (
    <View style={styles.noGroupContainer}>
      <BlurView intensity={20} tint="dark" style={styles.noGroupCard}>
        <View style={styles.noGroupContent}>
          <Text style={styles.swordsEmoji}>⚔️</Text>
          <Text style={styles.noGroupText}>Join a group to enter the Arena</Text>
          <Text style={styles.noGroupSubtext}>
            Battle alongside your accountability partners
          </Text>
        </View>
      </BlurView>
    </View>
  );
}

export default function ArenaScreen() {
  const { user } = useAuth();
  const { group, isInGroup, refreshGroup } = useGroup();
  const [refreshToken, setRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshToken((prev) => prev + 1);
    await refreshGroup();
    setIsRefreshing(false);
  };

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: spacing.screenPaddingTopCompact + insets.top },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
        >
          {isInGroup && group && user ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Arena</Text>
                <Text style={styles.subtitle}>Your battle companions</Text>
                <Text style={styles.swordsEmojiSmall}>⚔️</Text>
                <Text style={styles.explainer}>Make predictions, or duel your group members!</Text>
              </View>

              <ArenaMemberList
                members={group.members}
                currentUserId={user.id}
                refreshToken={refreshToken}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />

              <QuestsSection
                groupId={group.id}
                refreshToken={refreshToken}
              />

              <RequestsSection
                currentUserId={user.id}
                refreshToken={refreshToken}
                onRefresh={handleRefresh}
              />
            </>
          ) : (
            <NoGroupState />
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.screenPaddingTopCompact,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.screenPaddingBottom,
  },
  header: {
    marginBottom: spacing.paddingXl,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  swordsEmojiSmall: {
    fontSize: 48,
    textAlign: 'center',
    marginVertical: spacing.paddingMedium,
  },
  explainer: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  noGroupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noGroupCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    width: '100%',
  },
  noGroupContent: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: colors.glassLight,
  },
  swordsEmoji: {
    fontSize: 80,
  },
  noGroupText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.paddingXl,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  noGroupSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.paddingXs,
  },
});
