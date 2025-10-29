import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, router } from 'expo-router';
import GradientBackground from '../../../src/components/ui/GradientBackground';
import { MessageList } from '../../../src/components/chat/MessageList';
import { MessageInput } from '../../../src/components/chat/MessageInput';
import { colors } from '../../../src/utils/colors';
import { useAuth } from '../../../src/context/AuthContext';
import { useGroup } from '../../../src/context/GroupContext';
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
} from '../../../src/lib/chat';
import type { MessageWithProfile, Message } from '../../../src/types/chat';

export default function ChatScreen() {
  const { user } = useAuth();
  const { group, isInGroup } = useGroup();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if not in a group
  useEffect(() => {
    if (!isInGroup) {
      Alert.alert('Error', 'You must be in a group to access chat');
      router.back();
    }
  }, [isInGroup]);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!group?.id) return;

    try {
      setIsLoading(true);
      const loadedMessages = await getMessages(group.id);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [group?.id]);

  // Refresh messages (pull to refresh)
  const handleRefresh = useCallback(async () => {
    if (!group?.id) return;

    try {
      setIsRefreshing(true);
      const loadedMessages = await getMessages(group.id);
      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [group?.id]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!group?.id) return;

    loadMessages();

    // Subscribe to new messages
    const unsubscribe = subscribeToMessages(group.id, async (newMessage: Message) => {
      // Reload all messages to get the new one with profile data
      try {
        const fullMessages = await getMessages(group.id);
        setMessages(fullMessages);
      } catch (error) {
        console.error('Error fetching new message:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [group?.id, loadMessages]);

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!group?.id || !user?.id) return;

    try {
      setIsSending(true);
      await sendMessage(group.id, content);
      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!user || !group) {
    return null;
  }

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: () => (
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{group.name}</Text>
              <Text style={styles.headerSubtitle}>
                {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
              </Text>
            </View>
          ),
          headerTintColor: colors.textPrimary,
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.messagesContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <MessageList
              messages={messages}
              currentUserId={user.id}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
            />
          )}
        </View>

        <MessageInput onSend={handleSendMessage} disabled={isSending} />
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
