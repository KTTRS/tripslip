-- Create search functions for venue discovery
-- Migration: 20240101000026_create_search_functions.sql
-- Requirements: 3.2 (Geographic radius search)

-- =====================================================
-- GEOGRAPHIC RADIUS SEARCH FUNCTION
-- =====================================================

-- Function to find venues within a specified radius
-- Uses PostGIS ST_DWithin for efficient geographic queries
CREATE OR REPLACE FUNCTION venues_within_radius(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  venue_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  distance_meters DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    ST_Distance(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS distance_meters
  FROM venues v
  WHERE 
    v.location IS NOT NULL
    AND ST_DWithin(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
    AND (venue_ids IS NULL OR v.id = ANY(venue_ids))
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FULL-TEXT SEARCH HELPER FUNCTION
-- =====================================================

-- Function to search venues by text with ranking
CREATE OR REPLACE FUNCTION search_venues_by_text(
  search_query TEXT,
  max_results INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.description,
    ts_rank(
      to_tsvector('english', v.name || ' ' || COALESCE(v.description, '')),
      websearch_to_tsquery('english', search_query)
    ) AS rank
  FROM venues v
  WHERE 
    to_tsvector('english', v.name || ' ' || COALESCE(v.description, '')) @@ 
    websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- COMBINED SEARCH FUNCTION
-- =====================================================

-- Function to search venues with multiple criteria
-- This provides a more efficient server-side search option
CREATE OR REPLACE FUNCTION search_venues(
  search_text TEXT DEFAULT NULL,
  center_lat DOUBLE PRECISION DEFAULT NULL,
  center_lng DOUBLE PRECISION DEFAULT NULL,
  radius_miles DOUBLE PRECISION DEFAULT NULL,
  min_capacity INTEGER DEFAULT NULL,
  max_capacity INTEGER DEFAULT NULL,
  verified_only BOOLEAN DEFAULT FALSE,
  max_results INTEGER DEFAULT 25
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  primary_photo_url TEXT,
  rating DECIMAL,
  review_count INTEGER,
  verified BOOLEAN,
  claimed BOOLEAN,
  distance_miles DOUBLE PRECISION,
  text_rank REAL
) AS $$
DECLARE
  radius_meters DOUBLE PRECISION;
BEGIN
  -- Convert miles to meters if radius is provided
  IF radius_miles IS NOT NULL THEN
    radius_meters := radius_miles * 1609.34;
  END IF;

  RETURN QUERY
  SELECT 
    v.id,
    v.name,
    v.description,
    v.primary_photo_url,
    v.rating,
    v.review_count,
    v.verified,
    v.claimed,
    CASE 
      WHEN center_lat IS NOT NULL AND center_lng IS NOT NULL AND v.location IS NOT NULL THEN
        ST_Distance(
          v.location::geography,
          ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        ) / 1609.34  -- Convert meters to miles
      ELSE NULL
    END AS distance_miles,
    CASE 
      WHEN search_text IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', v.name || ' ' || COALESCE(v.description, '')),
          websearch_to_tsquery('english', search_text)
        )
      ELSE 0
    END AS text_rank
  FROM venues v
  WHERE 
    -- Text search filter
    (search_text IS NULL OR 
     to_tsvector('english', v.name || ' ' || COALESCE(v.description, '')) @@ 
     websearch_to_tsquery('english', search_text))
    -- Geographic filter
    AND (radius_meters IS NULL OR center_lat IS NULL OR center_lng IS NULL OR
         (v.location IS NOT NULL AND ST_DWithin(
           v.location::geography,
           ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
           radius_meters
         )))
    -- Capacity filters
    AND (min_capacity IS NULL OR v.capacity_max IS NULL OR v.capacity_max >= min_capacity)
    AND (max_capacity IS NULL OR v.capacity_min IS NULL OR v.capacity_min <= max_capacity)
    -- Verified filter
    AND (NOT verified_only OR v.verified = TRUE)
  ORDER BY 
    CASE WHEN search_text IS NOT NULL THEN text_rank ELSE 0 END DESC,
    CASE WHEN center_lat IS NOT NULL THEN distance_miles ELSE 999999 END ASC,
    v.rating DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION venues_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION search_venues_by_text TO authenticated;
GRANT EXECUTE ON FUNCTION search_venues TO authenticated;

-- Grant execute permissions to anonymous users for public search
GRANT EXECUTE ON FUNCTION venues_within_radius TO anon;
GRANT EXECUTE ON FUNCTION search_venues_by_text TO anon;
GRANT EXECUTE ON FUNCTION search_venues TO anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION venues_within_radius IS 
  'Find venues within a specified radius using PostGIS. Returns venue IDs and distances in meters.';

COMMENT ON FUNCTION search_venues_by_text IS 
  'Full-text search across venue names and descriptions with relevance ranking.';

COMMENT ON FUNCTION search_venues IS 
  'Comprehensive venue search with text, geographic, and filter criteria. Returns ranked results.';
