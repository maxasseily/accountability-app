import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../utils/colors';

interface GroupHeaderProps {
  groupName: string;
  memberCount: number;
  maxMembers?: number;
}

export default function GroupHeader({ groupName, memberCount, maxMembers = 6 }: GroupHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.groupName}>{groupName}</Text>
      <View style={styles.memberCount}>
        <Text style={styles.memberCountText}>
          {memberCount}/{maxMembers}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  groupName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    textShadowColor: colors.accentGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    flex: 1,
  },
  memberCount: {
    backgroundColor: colors.glassLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  memberCountText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
