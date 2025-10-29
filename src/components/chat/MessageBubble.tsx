import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MessageWithProfile } from '../../types/chat';
import { colors } from '../../utils/colors';

interface MessageBubbleProps {
  message: MessageWithProfile;
  isOwnMessage: boolean;
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const displayName = message.profile.full_name || message.profile.email.split('@')[0];
  const formattedTime = new Date(message.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
      {!isOwnMessage && (
        <Text style={styles.senderName}>{displayName}</Text>
      )}

      <BlurView intensity={20} tint="dark" style={styles.bubbleBlur}>
        <LinearGradient
          colors={
            isOwnMessage
              ? [colors.primaryStart + '80', colors.primaryEnd + '80']
              : [colors.glassLight, colors.glassDark]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.bubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text style={styles.messageText}>{message.content}</Text>
          <Text style={styles.timestamp}>{formattedTime}</Text>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    marginLeft: 12,
  },
  bubbleBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bubble: {
    padding: 12,
    paddingBottom: 6,
  },
  ownMessageBubble: {
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    alignSelf: 'flex-end',
  },
});
