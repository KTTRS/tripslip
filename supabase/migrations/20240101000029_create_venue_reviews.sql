-- =====================================================
-- VENUE REVIEWS AND RATINGS SYSTEM
-- =====================================================
-- Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.9, 10.10
-- This migration creates the venue review system with:
-- - Multi-aspect ratings (overall, educational value, staff, facilities, value)
-- - Text feedback with photo support
-- - Venue response functionality
-- - Review moderation and flagging
-- - Automatic venue rating calculation via trigger

-- Create venue_reviews table
CREATE TABLE IF NOT EXISTS venue_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Ratings (1-5 stars)
  -- Requirement 10.2: Overall rating and multi-aspect ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  educational_value_rating INTEGER CHECK (educational_value_rating BETWEEN 1 AND 5),
  staff_quality_rating INTEGER CHECK (staff_quality_rating BETWEEN 1 AND 5),
  facilities_rating INTEGER CHECK (facilities_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  
  -- Written feedback
  -- Requirement 10.3: Text feedback (min 50 characters enforced at application level)
  feedback_text TEXT,
  
  -- Photos
  -- Requirement 10.4: Reviews can include photos
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Venue response
  -- Requirement 10.5: Venues can respond to reviews
  venue_response TEXT,
  venue_response_at TIMESTAMPTZ,
  venue_response_by UUID REFERENCES auth.users(id),
  
  -- Moderation
  -- Requirement 10.9, 10.10: Reviews can be flagged and reviewed by admins
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  reviewed_by_admin BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Requirement 10.11: Prevent duplicate reviews for same venue/trip
  UNIQUE(venue_id, trip_id, user_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_venue_reviews_venue ON venue_reviews(venue_id) WHERE NOT flagged;
CREATE INDEX idx_venue_reviews_trip ON venue_reviews(trip_id);
CREATE INDEX idx_venue_reviews_user ON venue_reviews(user_id);
CREATE INDEX idx_venue_reviews_flagged ON venue_reviews(flagged) WHERE flagged = true;
CREATE INDEX idx_venue_reviews_created ON venue_reviews(created_at DESC);

-- =====================================================
-- TRIGGER: Update venue rating and review count
-- =====================================================
-- Requirement 10.6, 10.7: Calculate and display average ratings and review count
-- This trigger automatically updates the venue's rating and review_count
-- whenever a review is added, updated, or deleted

CREATE OR REPLACE FUNCTION update_venue_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_venue_id UUID;
BEGIN
  -- Determine which venue to update
  IF TG_OP = 'DELETE' THEN
    target_venue_id := OLD.venue_id;
  ELSE
    target_venue_id := NEW.venue_id;
  END IF;
  
  -- Update venue rating and review count
  -- Only count non-flagged reviews
  UPDATE venues
  SET 
    rating = (
      SELECT COALESCE(AVG(overall_rating)::DECIMAL(3,2), 0)
      FROM venue_reviews
      WHERE venue_id = target_venue_id AND NOT flagged
    ),
    review_count = (
      SELECT COUNT(*)
      FROM venue_reviews
      WHERE venue_id = target_venue_id AND NOT flagged
    ),
    updated_at = NOW()
  WHERE id = target_venue_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER update_venue_rating_on_insert_update
AFTER INSERT OR UPDATE ON venue_reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

-- Create trigger for DELETE
CREATE TRIGGER update_venue_rating_on_delete
AFTER DELETE ON venue_reviews
FOR EACH ROW
EXECUTE FUNCTION update_venue_rating();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;

-- Teachers can view all non-flagged reviews
CREATE POLICY "Teachers can view non-flagged reviews"
  ON venue_reviews FOR SELECT
  USING (NOT flagged OR auth.uid() = user_id);

-- Teachers can insert reviews for their own trips
CREATE POLICY "Teachers can create reviews for their trips"
  ON venue_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_id
      AND trips.teacher_id = auth.uid()
    )
  );

-- Teachers can update their own reviews (not venue responses)
CREATE POLICY "Teachers can update their own reviews"
  ON venue_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Teachers can delete their own reviews
CREATE POLICY "Teachers can delete their own reviews"
  ON venue_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Venue employees can view all reviews for their venue
CREATE POLICY "Venue employees can view their venue reviews"
  ON venue_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_reviews.venue_id
      AND venue_users.user_id = auth.uid()
    )
  );

-- Venue employees can add responses to reviews
CREATE POLICY "Venue employees can respond to reviews"
  ON venue_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_reviews.venue_id
      AND venue_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = venue_reviews.venue_id
      AND venue_users.user_id = auth.uid()
    )
  );

-- Admins can view all reviews (including flagged)
CREATE POLICY "Admins can view all reviews"
  ON venue_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

-- Admins can moderate reviews
CREATE POLICY "Admins can moderate reviews"
  ON venue_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.name IN ('tripslip_admin', 'system_admin')
      AND ura.is_active = true
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE venue_reviews IS 'Stores teacher reviews of venues with multi-aspect ratings and moderation support';
COMMENT ON COLUMN venue_reviews.overall_rating IS 'Overall rating from 1-5 stars (required)';
COMMENT ON COLUMN venue_reviews.educational_value_rating IS 'Educational value rating from 1-5 stars (optional)';
COMMENT ON COLUMN venue_reviews.staff_quality_rating IS 'Staff quality rating from 1-5 stars (optional)';
COMMENT ON COLUMN venue_reviews.facilities_rating IS 'Facilities rating from 1-5 stars (optional)';
COMMENT ON COLUMN venue_reviews.value_rating IS 'Value for money rating from 1-5 stars (optional)';
COMMENT ON COLUMN venue_reviews.feedback_text IS 'Written feedback (minimum 50 characters recommended)';
COMMENT ON COLUMN venue_reviews.photos IS 'Array of photo URLs attached to the review';
COMMENT ON COLUMN venue_reviews.venue_response IS 'Response from venue to the review';
COMMENT ON COLUMN venue_reviews.flagged IS 'Whether the review has been flagged for moderation';
COMMENT ON COLUMN venue_reviews.reviewed_by_admin IS 'Whether an admin has reviewed this flagged review';
