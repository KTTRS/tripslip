-- Migration: Create webhook_events table for Stripe webhook logging
-- Description: Logs all webhook events from Stripe for monitoring and debugging
-- Requirements: Task 6 - Fix Stripe Webhook Event Handling

-- =====================================================
-- WEBHOOK EVENTS TABLE
-- =====================================================

CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event ID
  event_type TEXT NOT NULL, -- e.g., 'payment_intent.succeeded'
  status TEXT NOT NULL CHECK (status IN ('handled', 'unhandled', 'error')),
  payload JSONB NOT NULL, -- Full event payload
  error_message TEXT, -- Error message if status is 'error'
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for querying by event type
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);

-- Index for querying by status
CREATE INDEX idx_webhook_events_status ON webhook_events(status);

-- Index for querying unhandled events
CREATE INDEX idx_webhook_events_unhandled ON webhook_events(status, event_type) 
WHERE status = 'unhandled';

-- Index for querying by created_at for cleanup jobs
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- Index for querying by Stripe event ID
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events (admin/monitoring only)
CREATE POLICY "Service role can manage webhook events"
  ON webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE webhook_events IS 'Logs all Stripe webhook events for monitoring and debugging';
COMMENT ON COLUMN webhook_events.event_id IS 'Unique Stripe event ID';
COMMENT ON COLUMN webhook_events.event_type IS 'Type of webhook event (e.g., payment_intent.succeeded)';
COMMENT ON COLUMN webhook_events.status IS 'Processing status: handled, unhandled, or error';
COMMENT ON COLUMN webhook_events.payload IS 'Full JSON payload from Stripe';
COMMENT ON COLUMN webhook_events.error_message IS 'Error message if processing failed';
COMMENT ON COLUMN webhook_events.processed_at IS 'When the webhook was processed';
