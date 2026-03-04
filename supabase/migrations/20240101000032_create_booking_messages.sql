-- =====================================================
-- BOOKING MESSAGES SYSTEM (Task 15.1)
-- =====================================================
-- 
-- Implements messaging between teachers and venues for booking-related communication
-- 
-- **Validates: Requirements 14.5, 14.6, 14.7, 14.8, 14.9, 14.10**

-- Create booking_messages table
CREATE TABLE IF NOT EXISTS booking_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
  
  -- Sender information
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('teacher', 'venue')),
  
  -- Message content
  message TEXT NOT NULL,
  
  -- Threading
  parent_message_id UUID REFERENCES booking_messages(id) ON DELETE SET NULL,
  
  -- Attachments
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size_bytes INTEGER,
  
  -- Status
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_booking_messages_booking ON booking_messages(booking_id, created_at DESC);
CREATE INDEX idx_booking_messages_sender ON booking_messages(sender_id);
CREATE INDEX idx_booking_messages_parent ON booking_messages(parent_message_id);
CREATE INDEX idx_booking_messages_unread ON booking_messages(booking_id, read_at) WHERE read_at IS NULL;

-- Create updated_at trigger
CREATE TRIGGER update_booking_messages_updated_at
  BEFORE UPDATE ON booking_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create message_notifications table for tracking email notifications
CREATE TABLE IF NOT EXISTS message_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES booking_messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_email TEXT NOT NULL,
  
  -- Notification status
  sent_at TIMESTAMPTZ,
  delivery_status TEXT CHECK (delivery_status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_notifications_message ON message_notifications(message_id);
CREATE INDEX idx_message_notifications_recipient ON message_notifications(recipient_id);
CREATE INDEX idx_message_notifications_status ON message_notifications(delivery_status) WHERE delivery_status = 'pending';

-- RLS Policies
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_notifications ENABLE ROW LEVEL SECURITY;

-- Teachers can view messages for their bookings
CREATE POLICY booking_messages_teacher_select ON booking_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venue_bookings vb
      JOIN trips t ON t.id = vb.trip_id
      WHERE vb.id = booking_messages.booking_id
        AND t.teacher_id = auth.uid()
    )
  );

-- Venue employees can view messages for their venue's bookings
CREATE POLICY booking_messages_venue_select ON booking_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venue_bookings vb
      JOIN venue_users vu ON vu.venue_id = vb.venue_id
      WHERE vb.id = booking_messages.booking_id
        AND vu.user_id = auth.uid()
    )
  );

-- Teachers can send messages for their bookings
CREATE POLICY booking_messages_teacher_insert ON booking_messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'teacher'
    AND EXISTS (
      SELECT 1 FROM venue_bookings vb
      JOIN trips t ON t.id = vb.trip_id
      WHERE vb.id = booking_id
        AND t.teacher_id = auth.uid()
    )
  );

-- Venue employees can send messages for their venue's bookings
CREATE POLICY booking_messages_venue_insert ON booking_messages
  FOR INSERT
  WITH CHECK (
    sender_role = 'venue'
    AND EXISTS (
      SELECT 1 FROM venue_bookings vb
      JOIN venue_users vu ON vu.venue_id = vb.venue_id
      WHERE vb.id = booking_id
        AND vu.user_id = auth.uid()
    )
  );

-- Users can mark their own messages as read
CREATE POLICY booking_messages_update_read ON booking_messages
  FOR UPDATE
  USING (true)
  WITH CHECK (read_by = auth.uid());

-- Message notifications policies
CREATE POLICY message_notifications_select ON message_notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY message_notifications_insert ON message_notifications
  FOR INSERT
  WITH CHECK (true); -- System can create notifications

-- Function to get unread message count for a booking
CREATE OR REPLACE FUNCTION get_unread_message_count(p_booking_id UUID, p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM booking_messages
  WHERE booking_id = p_booking_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
  
  RETURN v_count;
END;
$$;

-- Function to mark all messages as read for a booking
CREATE OR REPLACE FUNCTION mark_booking_messages_read(p_booking_id UUID, p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE booking_messages
  SET read_at = NOW(),
      read_by = p_user_id
  WHERE booking_id = p_booking_id
    AND sender_id != p_user_id
    AND read_at IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Trigger to create notification when message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recipient_id UUID;
  v_recipient_email TEXT;
  v_sender_role TEXT;
BEGIN
  -- Determine recipient based on sender role
  IF NEW.sender_role = 'teacher' THEN
    -- Send to venue employees
    FOR v_recipient_id, v_recipient_email IN
      SELECT vu.user_id, u.email
      FROM venue_bookings vb
      JOIN venue_users vu ON vu.venue_id = vb.venue_id
      JOIN auth.users u ON u.id = vu.user_id
      WHERE vb.id = NEW.booking_id
        AND vu.user_id != NEW.sender_id
    LOOP
      INSERT INTO message_notifications (message_id, recipient_id, recipient_email, delivery_status)
      VALUES (NEW.id, v_recipient_id, v_recipient_email, 'pending');
    END LOOP;
  ELSE
    -- Send to teacher
    SELECT t.user_id, u.email
    INTO v_recipient_id, v_recipient_email
    FROM venue_bookings vb
    JOIN trips tr ON tr.id = vb.trip_id
    JOIN teachers t ON t.id = tr.teacher_id
    JOIN auth.users u ON u.id = t.user_id
    WHERE vb.id = NEW.booking_id;
    
    IF v_recipient_id IS NOT NULL THEN
      INSERT INTO message_notifications (message_id, recipient_id, recipient_email, delivery_status)
      VALUES (NEW.id, v_recipient_id, v_recipient_email, 'pending');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_message_notification_trigger
  AFTER INSERT ON booking_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Comments
COMMENT ON TABLE booking_messages IS 'Messages between teachers and venues for booking-related communication';
COMMENT ON TABLE message_notifications IS 'Email notification tracking for booking messages';
COMMENT ON FUNCTION get_unread_message_count IS 'Returns count of unread messages for a booking and user';
COMMENT ON FUNCTION mark_booking_messages_read IS 'Marks all unread messages as read for a booking and user';
