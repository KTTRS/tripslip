-- Extend venues table for comprehensive venue profiles
-- Migration: 20240101000020_extend_venues_table.sql
-- Requirements: 1.1, 1.2, 1.6, 1.8, 3.1, 3.2

-- =====================================================
-- ENABLE POSTGIS FOR GEOGRAPHIC QUERIES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================================================
-- EXTEND VENUES TABLE
-- =====================================================

-- Basic venue information
ALTER TABLE venues ADD COLUMN IF NOT EXISTS website TEXT;

-- Operational details
ALTER TABLE venues ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '[]'::jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS seasonal_availability JSONB DEFAULT '[]'::jsonb;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS booking_lead_time_days INTEGER DEFAULT 7;

-- Capacity and features
ALTER TABLE venues ADD COLUMN IF NOT EXISTS capacity_min INTEGER;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS capacity_max INTEGER;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS supported_age_groups TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE venues ADD COLUMN IF NOT EXISTS accessibility_features JSONB DEFAULT '{}'::jsonb;

-- Media
ALTER TABLE venues ADD COLUMN IF NOT EXISTS primary_photo_url TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

-- Profile status
ALTER TABLE venues ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0 CHECK (profile_completeness >= 0 AND profile_completeness <= 100);

-- Timestamps for claiming and verification
ALTER TABLE venues ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Ratings and reviews
ALTER TABLE venues ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0 CHECK (review_count >= 0);

-- Geographic location using PostGIS
ALTER TABLE venues ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- =====================================================
-- POPULATE LOCATION FROM EXISTING ADDRESS DATA
-- =====================================================

-- Update location from address JSONB for existing records
UPDATE venues 
SET location = ST_SetSRID(ST_MakePoint(
  (address->>'lng')::float, 
  (address->>'lat')::float
), 4326)
WHERE address IS NOT NULL 
  AND address->>'lng' IS NOT NULL 
  AND address->>'lat' IS NOT NULL
  AND location IS NULL;

-- =====================================================
-- CREATE INDEXES FOR SEARCH AND PERFORMANCE
-- =====================================================

-- Geographic index for radius searches
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING GIST(location);

-- Full-text search index for venue names and descriptions
CREATE INDEX IF NOT EXISTS idx_venues_search ON venues 
USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Index for verified venues (common filter)
CREATE INDEX IF NOT EXISTS idx_venues_verified ON venues(verified) WHERE verified = true;

-- Index for claimed venues
CREATE INDEX IF NOT EXISTS idx_venues_claimed ON venues(claimed) WHERE claimed = true;

-- Composite index for verified venues sorted by rating
CREATE INDEX IF NOT EXISTS idx_venues_verified_rating ON venues(verified, rating DESC) 
WHERE verified = true;

-- Index for profile completeness (for admin queries)
CREATE INDEX IF NOT EXISTS idx_venues_profile_completeness ON venues(profile_completeness);

-- Index for supported age groups (array search)
CREATE INDEX IF NOT EXISTS idx_venues_age_groups ON venues USING GIN(supported_age_groups);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN venues.website IS 'Venue website URL';
COMMENT ON COLUMN venues.operating_hours IS 'JSON array of operating hours by day of week';
COMMENT ON COLUMN venues.seasonal_availability IS 'JSON array of seasonal availability periods';
COMMENT ON COLUMN venues.booking_lead_time_days IS 'Minimum days in advance required for booking';
COMMENT ON COLUMN venues.capacity_min IS 'Minimum group capacity';
COMMENT ON COLUMN venues.capacity_max IS 'Maximum group capacity';
COMMENT ON COLUMN venues.supported_age_groups IS 'Array of supported age groups (e.g., preschool, elementary, middle, high)';
COMMENT ON COLUMN venues.accessibility_features IS 'JSON object of accessibility features and their availability';
COMMENT ON COLUMN venues.primary_photo_url IS 'URL of the primary venue photo';
COMMENT ON COLUMN venues.virtual_tour_url IS 'URL of virtual tour (if available)';
COMMENT ON COLUMN venues.claimed IS 'Whether the venue has been claimed by a representative';
COMMENT ON COLUMN venues.verified IS 'Whether the venue has been verified by administrators';
COMMENT ON COLUMN venues.profile_completeness IS 'Percentage of profile completion (0-100)';
COMMENT ON COLUMN venues.claimed_at IS 'Timestamp when venue was claimed';
COMMENT ON COLUMN venues.verified_at IS 'Timestamp when venue was verified';
COMMENT ON COLUMN venues.rating IS 'Average rating from reviews (0-5)';
COMMENT ON COLUMN venues.review_count IS 'Total number of reviews';
COMMENT ON COLUMN venues.location IS 'Geographic location as PostGIS POINT for radius searches';
