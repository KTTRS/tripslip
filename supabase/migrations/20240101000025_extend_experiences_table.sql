-- Extend experiences table with additional fields for comprehensive experience management
-- Migration: 20240101000025_extend_experiences_table.sql
-- Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1-8.8

-- =====================================================
-- EXTEND EXPERIENCES TABLE
-- =====================================================

-- Add educational objectives (Requirement 2.1)
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS educational_objectives TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add curriculum standards (Requirement 2.5)
-- Note: educational_standards already exists as JSONB, we'll use it for curriculum standards

-- Add recommended age range (Requirement 2.4)
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS recommended_age_min INTEGER,
ADD COLUMN IF NOT EXISTS recommended_age_max INTEGER;

-- Add cancellation policy (Requirement 2.8)
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS cancellation_policy JSONB DEFAULT '{
  "fullRefundDays": 14,
  "partialRefundDays": 7,
  "partialRefundPercent": 50,
  "noRefundAfterDays": 3
}'::jsonb;

-- Add active status for search visibility (Requirement 8.6, 8.7)
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Add special requirements field
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- Add constraints for age range validation
ALTER TABLE experiences 
ADD CONSTRAINT experiences_age_range_check 
CHECK (
  (recommended_age_min IS NULL AND recommended_age_max IS NULL) OR
  (recommended_age_min IS NOT NULL AND recommended_age_max IS NOT NULL AND recommended_age_min <= recommended_age_max)
);

-- =====================================================
-- EXTEND PRICING_TIERS TABLE
-- =====================================================

-- Add additional fees support (Requirement 2.2)
ALTER TABLE pricing_tiers 
ADD COLUMN IF NOT EXISTS additional_fees JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for active experiences (used in search)
CREATE INDEX IF NOT EXISTS idx_experiences_active ON experiences(active) WHERE active = true;

-- Index for published and active experiences (common query pattern)
CREATE INDEX IF NOT EXISTS idx_experiences_published_active ON experiences(published, active) 
WHERE published = true AND active = true;

-- Index for age range queries
CREATE INDEX IF NOT EXISTS idx_experiences_age_range ON experiences(recommended_age_min, recommended_age_max)
WHERE recommended_age_min IS NOT NULL;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN experiences.educational_objectives IS 'Array of learning objectives for this experience';
COMMENT ON COLUMN experiences.educational_standards IS 'JSONB array of curriculum standards (e.g., Common Core, NGSS) aligned with this experience';
COMMENT ON COLUMN experiences.recommended_age_min IS 'Minimum recommended age for participants';
COMMENT ON COLUMN experiences.recommended_age_max IS 'Maximum recommended age for participants';
COMMENT ON COLUMN experiences.cancellation_policy IS 'JSONB object defining refund terms: {fullRefundDays, partialRefundDays, partialRefundPercent, noRefundAfterDays}';
COMMENT ON COLUMN experiences.active IS 'Whether this experience is active and visible in search results';
COMMENT ON COLUMN experiences.special_requirements IS 'Any special requirements or notes for this experience';
COMMENT ON COLUMN pricing_tiers.additional_fees IS 'JSONB array of additional fees: [{name, amountCents, required}]';

-- =====================================================
-- UPDATE TRIGGER FOR EXPERIENCES
-- =====================================================

-- The update trigger already exists from the core entities migration
-- No need to recreate it

