-- Fix search_venues function sorting
-- Migration: 20240101000042_fix_search_venues_sorting.sql
-- Fixes the ORDER BY clause to properly sort by text_rank and distance_miles

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
    -- Sort by text_rank DESC when search_text is provided
    text_rank DESC,
    -- Sort by distance ASC when location is provided (NULLs last)
    distance_miles ASC NULLS LAST,
    -- Tiebreaker: rating DESC
    v.rating DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_venues TO authenticated;
GRANT EXECUTE ON FUNCTION search_venues TO anon;

COMMENT ON FUNCTION search_venues IS 
  'Comprehensive venue search with text, geographic, and filter criteria. Returns ranked results sorted by relevance, distance, and rating.';
