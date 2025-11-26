// BadgeGrid component - displays all badges in a grid layout with category sections

import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../utils/colors';
import { useState, useEffect } from 'react';
import BadgeCard from './BadgeCard';
import type { BadgeWithStatus, BadgeCategory } from '../../types/badges';
import { getBadgesWithStatus } from '../../lib/badges';

interface BadgeGridProps {
  userId: string;
}

const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  streak: 'Streak Badges',
  quest: 'Quest Badges',
  mojo: 'Mojo Badges',
  milestone: 'Milestone Badges',
  special: 'Special Badges',
};

const CATEGORY_ORDER: BadgeCategory[] = ['streak', 'quest', 'mojo', 'milestone', 'special'];

export default function BadgeGrid({ userId }: BadgeGridProps) {
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    setIsLoading(true);
    try {
      const badgesData = await getBadgesWithStatus(userId);
      setBadges(badgesData);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<BadgeCategory, BadgeWithStatus[]>);

  // Count earned badges
  const earnedCount = badges.filter((b) => b.isEarned).length;

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Badges</Text>
        <Text style={styles.headerSubtitle}>
          {earnedCount} / {badges.length} earned
        </Text>
      </View>

      {/* Badge categories */}
      {CATEGORY_ORDER.map((category) => {
        const categoryBadges = badgesByCategory[category];
        if (!categoryBadges || categoryBadges.length === 0) return null;

        return (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</Text>
            <View style={styles.badgeGrid}>
              {categoryBadges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
});
