-- Migration: Enhance logging tables with cleanup jobs
-- Description: Adds cleanup functions for rate_limits, email_logs, and sms_logs
-- Requirements: Task 22 - Create Logging Tables
-- Note: The tables themselves already exist in previous migrations:
--   - rate_limits: 20240101000011
--   - email_logs, sms_logs: 20240101000045
-- This migration adds comprehensive cleanup jobs and indexes

-- =====================================================
-- CLEANUP FUNCTIONS
-- =====================================================

-- Enhanced cleanup function for rate_limits (keep last 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE created_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for email_logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function for sms_logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_sms_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sms_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Master cleanup function to run all cleanup jobs
CREATE OR REPLACE FUNCTION cleanup_all_logs()
RETURNS TABLE(
  table_name TEXT,
  rows_deleted INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'rate_limits'::TEXT, cleanup_old_rate_limits();
  
  RETURN QUERY
  SELECT 'email_logs'::TEXT, cleanup_old_email_logs();
  
  RETURN QUERY
  SELECT 'sms_logs'::TEXT, cleanup_old_sms_logs();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Add composite index for rate limit cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
  ON rate_limits(created_at) 
  WHERE created_at < NOW() - INTERVAL '1 hour';

-- Add composite index for email log cleanup queries
CREATE INDEX IF NOT EXISTS idx_email_logs_cleanup 
  ON email_logs(created_at) 
  WHERE created_at < NOW() - INTERVAL '90 days';

-- Add composite index for sms log cleanup queries
CREATE INDEX IF NOT EXISTS idx_sms_logs_cleanup 
  ON sms_logs(created_at) 
  WHERE created_at < NOW() - INTERVAL '90 days';

-- =====================================================
-- STATISTICS AND MONITORING
-- =====================================================

-- Function to get logging statistics
CREATE OR REPLACE FUNCTION get_logging_statistics()
RETURNS TABLE(
  table_name TEXT,
  total_rows BIGINT,
  rows_last_24h BIGINT,
  rows_last_7d BIGINT,
  oldest_record TIMESTAMPTZ,
  newest_record TIMESTAMPTZ
) AS $$
BEGIN
  -- Rate limits statistics
  RETURN QUERY
  SELECT 
    'rate_limits'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    MIN(created_at),
    MAX(created_at)
  FROM rate_limits;
  
  -- Email logs statistics
  RETURN QUERY
  SELECT 
    'email_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    MIN(created_at),
    MAX(created_at)
  FROM email_logs;
  
  -- SMS logs statistics
  RETURN QUERY
  SELECT 
    'sms_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::BIGINT,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT,
    MIN(created_at),
    MAX(created_at)
  FROM sms_logs;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION cleanup_old_rate_limits() IS 'Deletes rate limit records older than 1 hour. Returns count of deleted rows.';
COMMENT ON FUNCTION cleanup_old_email_logs() IS 'Deletes email log records older than 90 days. Returns count of deleted rows.';
COMMENT ON FUNCTION cleanup_old_sms_logs() IS 'Deletes SMS log records older than 90 days. Returns count of deleted rows.';
COMMENT ON FUNCTION cleanup_all_logs() IS 'Runs all cleanup jobs and returns summary of deleted rows per table.';
COMMENT ON FUNCTION get_logging_statistics() IS 'Returns statistics about logging tables including row counts and date ranges.';

-- =====================================================
-- USAGE NOTES
-- =====================================================

-- To manually run cleanup jobs:
-- SELECT * FROM cleanup_all_logs();

-- To view logging statistics:
-- SELECT * FROM get_logging_statistics();

-- For production, schedule cleanup_all_logs() to run daily using:
-- 1. pg_cron extension (if available)
-- 2. External cron job calling Supabase Edge Function
-- 3. GitHub Actions scheduled workflow
-- 4. Cloud scheduler (AWS EventBridge, GCP Cloud Scheduler, etc.)

-- Example pg_cron setup (requires pg_cron extension):
-- SELECT cron.schedule('cleanup-logs-daily', '0 2 * * *', 'SELECT cleanup_all_logs()');
