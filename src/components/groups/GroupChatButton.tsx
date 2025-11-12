import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../utils/colors';

interface GroupChatButtonProps {
  onPress?: () => void;
}

export default function GroupChatButton({ onPress }: GroupChatButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(app)/groups/chat');
    }
  };

  return (
    <TouchableOpacity
      style={styles.chatButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[colors.primaryStart, colors.primaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.chatGradient}
      >
        <MaterialCommunityIcons name="chat" size={20} color={colors.textPrimary} />
        <Text style={styles.chatButtonText}>Group Chat</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatButton: {
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  chatGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  chatButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
