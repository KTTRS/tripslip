-- =====================================================
-- VENUE ANALYTICS MATERIALIZED VIEW
-- =====================================================
-- Migration: 20240101000027_create_venue_analytics_view.sql
-- Description: Create materialized view for venue analytics to improve dashboard performance
-- Requirements: 20.1, 20.2

-- Create materialized view for venue analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS venue_analytics_summary AS
SELECT 
  v.id AS venue_id,
  v.name AS venue_name,
  COUNT(DISTINCT vb.id) AS total_bookings,
  COUNT(DISTINCT vb.id) FILTER (WHERE vb.status = 'completed') AS completed_bookings,
  COUNT(DISTINCT vb.id) FILTER (WHERE vb.status = 'cancelled') AS cancelled_bookings,
  SUM(vb.paid_cents) FILTER (WHERE vb.status IN ('confirmed', 'completed')) AS total_revenue_cents,
  AVG(vb.student_count) FILTER (WHERE vb.status IN ('confirmed', 'completed')) AS avg_group_size,
  v.rating AS current_rating,
  v.review_count,
  -- Profile views placeholder (to be tracked by application)
  0 AS profile_views,
  -- Calculate booking conversion rate (placeholder until profile views are tracked)
  0 AS conversion_rate_percent
FROM venues v
LEFT JOIN venue_bookings vb ON v.id = vb.venue_id
GROUP BY v.id, v.name, v.rating, v.review_count;

-- Create unique index for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_venue_analytics_venue ON venue_analytics_summary(venue_id);

-- Create index for sorting by popular metrics
CREATE INDEX IF NOT EXISTS idx_venue_analytics_bookings ON venue_analytics_summary(total_bookings DESC);
CREATE INDEX IF NOT EXISTS idx_venue_analytics_revenue ON venue_analytics_summary(total_revenue_cents DESC);

-- Grant access to authenticated users
GRANT SELECT ON venue_analytics_summary TO authenticated;

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_venue_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY venue_analytics_summary;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION refresh_venue_analytics() TO authenticated;

-- Add comment
COMMENT ON MATERIALIZED VIEW venue_analytics_summary IS 
  'Pre-computed venue analytics for dashboard performance. Refresh periodically using refresh_venue_analytics() function.';
