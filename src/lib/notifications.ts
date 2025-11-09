/**
 * Notification database operations
 */

import { supabase } from './supabase';
import type { UserNotification } from '../types/statistics';

// Convert database row to UserNotification
function mapDbToNotification(row: any): UserNotification {
  return {
    id: row.id,
    userId: row.user_id,
    notificationType: row.notification_type,
    title: row.title,
    message: row.message,
    mojoChange: row.mojo_change,
    questId: row.quest_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * Get unread notifications for the current user
 */
export async function getUnreadNotifications(userId: string): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: true }); // Show oldest first (chronological order)

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return (data || []).map(mapDbToNotification);
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}
