-- Create supporting tables (notifications, audit_logs)
-- Migration: 20240101000003_create_supporting_tables.sql

-- =====================================================
-- NOTIFICATIONS
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_critical BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_type IN ('venue', 'teacher', 'parent', 'school', 'district')),
  CHECK (channel IN ('email', 'sms', 'in_app')),
  CHECK (status IN ('pending', 'sent', 'failed', 'read'))
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_type TEXT,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_type IN ('venue', 'teacher', 'parent', 'school', 'district', 'system'))
);

-- =====================================================
-- INDEXES FOR SUPPORTING TABLES
-- =====================================================

-- Notification indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_unread ON notifications(user_id, user_type) 
  WHERE read_at IS NULL;
CREATE INDEX idx_notifications_critical ON notifications(is_critical) 
  WHERE is_critical = true;

-- Audit log indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, user_type);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================================================
-- HELPER FUNCTIONS FOR NOTIFICATIONS
-- =====================================================

-- Function to create notification for user
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_user_type TEXT,
  p_channel TEXT,
  p_subject TEXT,
  p_body TEXT,
  p_is_critical BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, user_type, channel, subject, body, is_critical, metadata
  ) VALUES (
    p_user_id, p_user_type, p_channel, p_subject, p_body, p_is_critical, p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET read_at = NOW(), status = 'read'
  WHERE id = notification_id AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUDIT LOG TRIGGER FUNCTION
-- =====================================================

-- Generic audit log trigger function
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (
      user_id, user_type, action, table_name, record_id, before_state
    ) VALUES (
      auth.uid(), 
      COALESCE(current_setting('app.user_type', true), 'system'),
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (
      user_id, user_type, action, table_name, record_id, before_state, after_state
    ) VALUES (
      auth.uid(),
      COALESCE(current_setting('app.user_type', true), 'system'),
      'UPDATE',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (
      user_id, user_type, action, table_name, record_id, after_state
    ) VALUES (
      auth.uid(),
      COALESCE(current_setting('app.user_type', true), 'system'),
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- APPLY AUDIT TRIGGERS TO KEY TABLES
-- =====================================================

-- Audit critical tables
CREATE TRIGGER audit_permission_slips 
  AFTER INSERT OR UPDATE OR DELETE ON permission_slips
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_payments 
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_refunds 
  AFTER INSERT OR UPDATE OR DELETE ON refunds
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

CREATE TRIGGER audit_attendance 
  AFTER INSERT OR UPDATE OR DELETE ON attendance
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
