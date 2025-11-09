// Supabase client functions for chat/messaging
import { supabase } from './supabase';
import type { Message, MessageWithProfile } from '../types/chat';

const MESSAGES_PER_PAGE = 50;

/**
 * Send a message to a group
 * @param groupId - ID of the group
 * @param content - Message content
 * @returns The created message
 */
export async function sendMessage(groupId: string, content: string): Promise<Message> {
  const { data, error } = await supabase.rpc('send_message', {
    p_group_id: groupId,
    p_content: content,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as Message;
}

/**
 * Send an emoji action message to a group
 * @param groupId - ID of the group
 * @param emojiType - Type of emoji action ('lock', 'mayday', or 'rally')
 * @returns The created message
 */
export async function sendEmojiAction(
  groupId: string,
  emojiType: 'lock' | 'mayday' | 'rally'
): Promise<Message> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'Someone';

  // Generate message content based on emoji type
  const messages = {
    lock: `${displayName} is locking in`,
    mayday: `Mayday!! ${displayName} needs motivation!`,
    rally: `${displayName} is rallying the troops - go get 'em`,
  };

  const { data, error } = await supabase.rpc('send_emoji_action', {
    p_group_id: groupId,
    p_content: messages[emojiType],
    p_emoji_type: emojiType,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as Message;
}

/**
 * Get messages for a group (paginated)
 * @param groupId - ID of the group
 * @param page - Page number (0-indexed)
 * @param pageSize - Number of messages per page
 * @returns Array of messages with profile data
 */
export async function getMessages(
  groupId: string,
  page: number = 0,
  pageSize: number = MESSAGES_PER_PAGE
): Promise<MessageWithProfile[]> {
  const offset = page * pageSize;

  const { data, error } = await supabase.rpc('get_messages', {
    p_group_id: groupId,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) {
    throw new Error(error.message);
  }

  // The function returns messages in ascending order (oldest first)
  return (data as MessageWithProfile[]) || [];
}

/**
 * Delete a message (user can only delete their own messages)
 * @param messageId - ID of the message to delete
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', messageId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Update a message (user can only update their own messages)
 * @param messageId - ID of the message to update
 * @param newContent - New message content
 */
export async function updateMessage(messageId: string, newContent: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ content: newContent.trim() })
    .eq('id', messageId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Subscribe to new messages in a group
 * @param groupId - ID of the group to subscribe to
 * @param callback - Function to call when a new message arrives
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  groupId: string,
  callback: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`group-${groupId}-messages`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    channel.unsubscribe();
  };
}

/**
 * Subscribe to message updates/deletes in a group
 * @param groupId - ID of the group to subscribe to
 * @param onUpdate - Function to call when a message is updated
 * @param onDelete - Function to call when a message is deleted
 * @returns Unsubscribe function
 */
export function subscribeToMessageChanges(
  groupId: string,
  onUpdate: (message: Message) => void,
  onDelete: (messageId: string) => void
): () => void {
  const channel = supabase
    .channel(`group-${groupId}-message-changes`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        onUpdate(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        onDelete(payload.old.id);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    channel.unsubscribe();
  };
}
