/**
 * Booking Message Service (Task 15.1)
 * 
 * Implements messaging between teachers and venues for booking-related communication
 * 
 * **Validates: Requirements 14.5, 14.6, 14.7, 14.8, 14.9, 14.10**
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export type SenderRole = 'teacher' | 'venue';
export type DeliveryStatus = 'pending' | 'sent' | 'failed';

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: SenderRole;
  message: string;
  parent_message_id?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size_bytes?: number;
  read_at?: string;
  read_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageNotification {
  id: string;
  message_id: string;
  recipient_id: string;
  recipient_email: string;
  sent_at?: string;
  delivery_status: DeliveryStatus;
  error_message?: string;
  created_at: string;
}

export interface CreateMessageInput {
  booking_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: SenderRole;
  message: string;
  parent_message_id?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size_bytes?: number;
}

export interface MessageThread {
  message: BookingMessage;
  replies: BookingMessage[];
}

export interface MessageStats {
  total_messages: number;
  unread_count: number;
  last_message_at?: string;
  last_sender_name?: string;
}

// =====================================================
// SERVICE
// =====================================================

export class BookingMessageService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Send a message
   */
  async sendMessage(input: CreateMessageInput): Promise<BookingMessage> {
    const { data, error } = await this.supabase
      .from('booking_messages')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all messages for a booking
   */
  async getMessages(bookingId: string): Promise<BookingMessage[]> {
    const { data, error } = await this.supabase
      .from('booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get message threads (messages with their replies)
   */
  async getMessageThreads(bookingId: string): Promise<MessageThread[]> {
    const messages = await this.getMessages(bookingId);
    
    // Separate root messages and replies
    const rootMessages = messages.filter(m => !m.parent_message_id);
    const replies = messages.filter(m => m.parent_message_id);
    
    // Build threads
    return rootMessages.map(message => ({
      message,
      replies: replies.filter(r => r.parent_message_id === message.id),
    }));
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<BookingMessage | null> {
    const { data, error } = await this.supabase
      .from('booking_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<BookingMessage> {
    const { data, error } = await this.supabase
      .from('booking_messages')
      .update({
        read_at: new Date().toISOString(),
        read_by: userId,
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mark all messages in a booking as read
   */
  async markAllAsRead(bookingId: string, userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('mark_booking_messages_read', {
        p_booking_id: bookingId,
        p_user_id: userId,
      });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Get unread message count for a booking
   */
  async getUnreadCount(bookingId: string, userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_unread_message_count', {
        p_booking_id: bookingId,
        p_user_id: userId,
      });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Get message statistics for a booking
   */
  async getMessageStats(bookingId: string, userId: string): Promise<MessageStats> {
    const messages = await this.getMessages(bookingId);
    const unreadCount = await this.getUnreadCount(bookingId, userId);
    
    const lastMessage = messages[messages.length - 1];
    
    return {
      total_messages: messages.length,
      unread_count: unreadCount,
      last_message_at: lastMessage?.created_at,
      last_sender_name: lastMessage?.sender_name,
    };
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications(): Promise<MessageNotification[]> {
    const { data, error } = await this.supabase
      .from('message_notifications')
      .select('*')
      .eq('delivery_status', 'pending')
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('message_notifications')
      .update({
        sent_at: new Date().toISOString(),
        delivery_status: 'sent',
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Mark notification as failed
   */
  async markNotificationFailed(notificationId: string, errorMessage: string): Promise<void> {
    const { error } = await this.supabase
      .from('message_notifications')
      .update({
        delivery_status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * Get message history for a user (across all bookings)
   */
  async getUserMessageHistory(userId: string, limit: number = 50): Promise<BookingMessage[]> {
    const { data, error } = await this.supabase
      .from('booking_messages')
      .select('*')
      .or(`sender_id.eq.${userId},read_by.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Search messages
   */
  async searchMessages(bookingId: string, query: string): Promise<BookingMessage[]> {
    const { data, error } = await this.supabase
      .from('booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .ilike('message', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Delete a message (soft delete by setting message to "[deleted]")
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from('booking_messages')
      .update({
        message: '[Message deleted]',
        attachment_url: null,
        attachment_name: null,
        attachment_size_bytes: null,
      })
      .eq('id', messageId);

    if (error) throw error;
  }
}
