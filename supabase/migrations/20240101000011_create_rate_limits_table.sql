-- Create rate limits table for API rate limiting
-- Migration: 20240101000011_create_rate_limits_table.sql

CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient rate limit queries
CREATE INDEX idx_rate_limits_identifier_created ON rate_limits(identifier, created_at);

-- Auto-cleanup old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (in production, use pg_cron or external scheduler)
-- For now, this is a manual function that can be called periodically
