import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import AddFriendsTab from '../../../src/components/friends/AddFriendsTab';
import FriendsListTab from '../../../src/components/friends/FriendsListTab';
import { colors } from '../../../src/utils/colors';
import { spacing } from '../../../src/utils/spacing';

type Tab = 'add' | 'list';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedTab, setSelectedTab] = useState<Tab>('list');

  return (
    <GradientBackground>
      <StatusBar style="light" hidden={true} />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: spacing.screenPaddingTopCompact + insets.top }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Friends</Text>

          {/* Spacer for alignment */}
          <View style={styles.spacer} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'list' && styles.tabActive]}
            onPress={() => setSelectedTab('list')}
          >
            <Text style={[styles.tabText, selectedTab === 'list' && styles.tabTextActive]}>
              Friends List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'add' && styles.tabActive]}
            onPress={() => setSelectedTab('add')}
          >
            <Text style={[styles.tabText, selectedTab === 'add' && styles.tabTextActive]}>
              Add Friends
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.content}>
          {selectedTab === 'add' ? (
            <AddFriendsTab onRequestSent={() => setSelectedTab('list')} />
          ) : (
            <FriendsListTab />
          )}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  spacer: {
    width: 44,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.glassLight,
    borderRadius: 12,
    padding: 4,
    marginHorizontal: spacing.screenPaddingHorizontal,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.screenPaddingBottom,
  },
});
