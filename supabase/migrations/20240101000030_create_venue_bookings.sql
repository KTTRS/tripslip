-- Create venue booking and data sharing tables
-- Migration: 20240101000030_create_venue_bookings.sql
-- Requirements: 11.1, 11.3, 12.1, 12.2, 12.3, 12.4, 12.5, 25.1, 25.2, 25.3

-- =====================================================
-- TRIP EXTENSIONS FOR VENUE BOOKINGS
-- =====================================================

-- Add venue booking reference to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS venue_booking_id UUID;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- =====================================================
-- VENUE BOOKINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS venue_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id),
  experience_id UUID NOT NULL REFERENCES experiences(id),
  
  -- Booking details
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  student_count INTEGER NOT NULL CHECK (student_count > 0),
  chaperone_count INTEGER NOT NULL DEFAULT 0 CHECK (chaperone_count >= 0),
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'modified', 'cancelled', 'completed'
  )),
  confirmation_number TEXT UNIQUE NOT NULL,
  
  -- Pricing
  quoted_price_cents INTEGER NOT NULL CHECK (quoted_price_cents >= 0),
  deposit_cents INTEGER CHECK (deposit_cents >= 0),
  paid_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_cents >= 0),
  
  -- Communication
  special_requirements TEXT,
  venue_notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_venue_bookings_trip ON venue_bookings(trip_id);
CREATE INDEX idx_venue_bookings_venue ON venue_bookings(venue_id);
CREATE INDEX idx_venue_bookings_experience ON venue_bookings(experience_id);
CREATE INDEX idx_venue_bookings_status ON venue_bookings(status);
CREATE INDEX idx_venue_bookings_date ON venue_bookings(scheduled_date);
CREATE INDEX idx_venue_bookings_confirmation ON venue_bookings(confirmation_number);

-- =====================================================
-- DATA SHARING CONSENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS data_sharing_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES venue_bookings(id) ON DELETE CASCADE,
  
  -- Consent options
  share_basic_info BOOLEAN NOT NULL DEFAULT true,
  share_medical_info BOOLEAN NOT NULL DEFAULT false,
  share_contact_info BOOLEAN NOT NULL DEFAULT false,
  share_emergency_info BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one consent record per student per booking
  UNIQUE(student_id, booking_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_data_sharing_student ON data_sharing_consents(student_id);
CREATE INDEX idx_data_sharing_booking ON data_sharing_consents(booking_id);
CREATE INDEX idx_data_sharing_parent ON data_sharing_consents(parent_id);

-- =====================================================
-- BOOKING CONFIRMATION NUMBER GENERATION
-- =====================================================

-- Function to generate unique booking confirmation numbers
-- Format: VB-YYYYMMDD-XXXX (e.g., VB-20240115-A3F9)
CREATE OR REPLACE FUNCTION generate_booking_confirmation_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
  confirmation_num TEXT;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  -- Get date part (YYYYMMDD)
  date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Try to generate a unique confirmation number
  LOOP
    -- Generate random 4-character alphanumeric string (uppercase)
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 4));
    
    -- Construct confirmation number
    confirmation_num := 'VB-' || date_part || '-' || random_part;
    
    -- Check if it already exists
    IF NOT EXISTS (SELECT 1 FROM venue_bookings WHERE confirmation_number = confirmation_num) THEN
      RETURN confirmation_num;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique confirmation number after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate confirmation number on insert
CREATE OR REPLACE FUNCTION set_booking_confirmation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_number IS NULL OR NEW.confirmation_number = '' THEN
    NEW.confirmation_number := generate_booking_confirmation_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_confirmation_number
  BEFORE INSERT ON venue_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_confirmation_number();

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp for venue_bookings
CREATE TRIGGER trigger_venue_bookings_updated_at
  BEFORE UPDATE ON venue_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp for data_sharing_consents
CREATE TRIGGER trigger_data_sharing_consents_updated_at
  BEFORE UPDATE ON data_sharing_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on venue_bookings
ALTER TABLE venue_bookings ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own bookings
CREATE POLICY venue_bookings_teacher_select ON venue_bookings
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Teachers can create bookings for their trips
CREATE POLICY venue_bookings_teacher_insert ON venue_bookings
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Teachers can update their own bookings (before confirmation)
CREATE POLICY venue_bookings_teacher_update ON venue_bookings
  FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Venue employees can view bookings for their venue
CREATE POLICY venue_bookings_venue_select ON venue_bookings
  FOR SELECT
  USING (
    venue_id IN (
      SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
    )
  );

-- Venue employees can update bookings for their venue
CREATE POLICY venue_bookings_venue_update ON venue_bookings
  FOR UPDATE
  USING (
    venue_id IN (
      SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
    )
  );

-- Enable RLS on data_sharing_consents
ALTER TABLE data_sharing_consents ENABLE ROW LEVEL SECURITY;

-- Parents can view and manage their own consents
CREATE POLICY data_sharing_consents_parent_all ON data_sharing_consents
  FOR ALL
  USING (parent_id IN (
    SELECT id FROM parents WHERE user_id = auth.uid()
  ));

-- Teachers can view consents for their trips
CREATE POLICY data_sharing_consents_teacher_select ON data_sharing_consents
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM venue_bookings WHERE trip_id IN (
        SELECT id FROM trips WHERE teacher_id IN (
          SELECT id FROM teachers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Venue employees can view consents for their bookings
CREATE POLICY data_sharing_consents_venue_select ON data_sharing_consents
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM venue_bookings WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE venue_bookings IS 'Stores venue booking information for trips';
COMMENT ON COLUMN venue_bookings.confirmation_number IS 'Unique booking confirmation number in format VB-YYYYMMDD-XXXX';
COMMENT ON COLUMN venue_bookings.status IS 'Booking status: pending, confirmed, modified, cancelled, completed';
COMMENT ON COLUMN venue_bookings.quoted_price_cents IS 'Quoted price in cents for the booking';
COMMENT ON COLUMN venue_bookings.deposit_cents IS 'Deposit amount in cents (if required)';
COMMENT ON COLUMN venue_bookings.paid_cents IS 'Amount paid in cents';

COMMENT ON TABLE data_sharing_consents IS 'Stores parent consent for sharing student data with venues';
COMMENT ON COLUMN data_sharing_consents.share_basic_info IS 'Consent to share basic info (name, age, grade)';
COMMENT ON COLUMN data_sharing_consents.share_medical_info IS 'Consent to share medical information';
COMMENT ON COLUMN data_sharing_consents.share_contact_info IS 'Consent to share parent contact information';
COMMENT ON COLUMN data_sharing_consents.share_emergency_info IS 'Consent to share emergency contact information';
