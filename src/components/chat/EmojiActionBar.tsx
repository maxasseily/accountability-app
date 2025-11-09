import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../utils/colors';

interface EmojiActionBarProps {
  onEmojiPress: (emojiType: 'lock' | 'mayday' | 'rally') => void;
  disabled?: boolean;
}

export function EmojiActionBar({ onEmojiPress, disabled = false }: EmojiActionBarProps) {
  const emojis = [
    { type: 'lock' as const, emoji: '🔒', label: 'Lock In' },
    { type: 'mayday' as const, emoji: '‼️', label: 'Mayday' },
    { type: 'rally' as const, emoji: '📣', label: 'Rally' },
  ];

  const handlePress = (type: 'lock' | 'mayday' | 'rally') => {
    if (disabled) {
      return;
    }

    try {
      onEmojiPress(type);
    } catch (error) {
      console.error('Error calling onEmojiPress:', error);
      Alert.alert('Error', 'Failed to send emoji action');
    }
  };

  return (
    <BlurView intensity={70} tint="dark" style={styles.container}>
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.15)', 'rgba(118, 75, 162, 0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientOverlay}
      >
        <View style={styles.emojisContainer}>
          {emojis.map((item) => (
            <Pressable
              key={item.type}
              onPress={() => handlePress(item.type)}
              disabled={disabled}
              style={({ pressed }) => [
                styles.emojiButton,
                pressed && styles.emojiButtonPressed,
                disabled && styles.emojiButtonDisabled,
              ]}
            >
              <Text style={styles.emojiText}>{item.emoji}</Text>
              <Text style={styles.labelText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </LinearGradient>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  gradientOverlay: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emojisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  emojiButton: {
    padding: 8,
    alignItems: 'center',
    opacity: 1,
  },
  emojiButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  emojiButtonDisabled: {
    opacity: 0.3,
  },
  emojiText: {
    fontSize: 36,
    marginBottom: 4,
  },
  labelText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
