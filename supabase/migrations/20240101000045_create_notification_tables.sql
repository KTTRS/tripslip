-- Migration: Create notification-related tables for email and SMS
-- Description: Creates tables for notification preferences, email logs, and SMS logs
-- Requirements: 2.1, 2.8, 3.1, 3.7

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true NOT NULL,
  sms_enabled BOOLEAN DEFAULT false NOT NULL,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
  ON notification_preferences(user_id);

-- Create index for SMS opt-in queries
CREATE INDEX IF NOT EXISTS idx_notification_preferences_sms_enabled 
  ON notification_preferences(sms_enabled) WHERE sms_enabled = true;

-- Add RLS policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can access all preferences (for sending notifications)
CREATE POLICY "Service role can access all notification preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  attempts INTEGER DEFAULT 1 NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email 
  ON email_logs(to_email);

CREATE INDEX IF NOT EXISTS idx_email_logs_status 
  ON email_logs(status);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at 
  ON email_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_template_id 
  ON email_logs(template_id);

-- Add RLS policies for email_logs (admin/service role only)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can access email logs"
  ON email_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_phone TEXT NOT NULL,
  message_preview TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  twilio_message_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for sms_logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_to_phone 
  ON sms_logs(to_phone);

CREATE INDEX IF NOT EXISTS idx_sms_logs_status 
  ON sms_logs(status);

CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at 
  ON sms_logs(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_logs_twilio_message_id 
  ON sms_logs(twilio_message_id) WHERE twilio_message_id IS NOT NULL;

-- Add RLS policies for sms_logs (admin/service role only)
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can access sms logs"
  ON sms_logs
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled)
SELECT id, true, false
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE notification_preferences IS 'Stores user notification preferences for email and SMS';
COMMENT ON TABLE email_logs IS 'Logs all email delivery attempts for audit and debugging';
COMMENT ON TABLE sms_logs IS 'Logs all SMS delivery attempts for audit and debugging';

COMMENT ON COLUMN notification_preferences.email_enabled IS 'Whether user has opted in to email notifications';
COMMENT ON COLUMN notification_preferences.sms_enabled IS 'Whether user has opted in to SMS notifications';
COMMENT ON COLUMN notification_preferences.preferences IS 'Additional notification preferences as JSON';

COMMENT ON COLUMN email_logs.attempts IS 'Number of delivery attempts (max 3 with retry logic)';
COMMENT ON COLUMN email_logs.template_id IS 'Email template identifier used for this message';

COMMENT ON COLUMN sms_logs.message_preview IS 'First 100 characters of SMS message for reference';
COMMENT ON COLUMN sms_logs.twilio_message_id IS 'Twilio message SID for tracking delivery status';
