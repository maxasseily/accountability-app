import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../utils/colors';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <BlurView intensity={70} tint="dark" style={styles.container}>
        <LinearGradient
          colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientOverlay}
        >
          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={5000}
              editable={!disabled}
              returnKeyType="default"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              keyboardAppearance="dark"
            />
            {canSend ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[colors.secondaryStart, colors.secondaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  <MaterialCommunityIcons name="send" size={16} color={colors.textPrimary} />
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={[styles.sendButton, styles.sendButtonDisabled]}>
                <MaterialCommunityIcons name="send" size={16} color={colors.textMuted} />
              </View>
            )}
          </View>
        </LinearGradient>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  gradientOverlay: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassDark,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 44,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 8,
    elevation: 0,
  },
  inputContainerFocused: {
    borderColor: colors.accent,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 80,
    paddingVertical: 2,
    paddingRight: 8,
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondaryStart,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.3,
  },
});
