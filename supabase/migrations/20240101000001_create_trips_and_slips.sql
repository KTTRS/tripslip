-- Create trip and permission slip tables
-- Migration: 20240101000001_create_trips_and_slips.sql

-- =====================================================
-- TRIPS
-- =====================================================

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  trip_date DATE NOT NULL,
  trip_time TIME,
  student_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  direct_link_token TEXT UNIQUE,
  transportation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (student_count >= 0),
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- =====================================================
-- PERMISSION SLIPS
-- =====================================================

CREATE TABLE permission_slips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  magic_link_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  form_data JSONB DEFAULT '{}'::jsonb,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  signed_by_parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, student_id),
  CHECK (status IN ('pending', 'signed', 'paid', 'cancelled'))
);

-- =====================================================
-- DOCUMENTS
-- =====================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_slip_id UUID NOT NULL REFERENCES permission_slips(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  encrypted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (document_type IN ('medical', 'insurance', 'background_check', 'other'))
);

-- =====================================================
-- ATTENDANCE
-- =====================================================

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  UNIQUE(trip_id, student_id)
);

-- =====================================================
-- CHAPERONES
-- =====================================================

CREATE TABLE chaperones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited',
  background_check_verified BOOLEAN NOT NULL DEFAULT false,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(trip_id, parent_id),
  CHECK (status IN ('invited', 'accepted', 'declined', 'removed'))
);

-- =====================================================
-- INDEXES FOR TRIPS AND SLIPS
-- =====================================================

-- Trip indexes
CREATE INDEX idx_trips_experience ON trips(experience_id);
CREATE INDEX idx_trips_teacher ON trips(teacher_id);
CREATE INDEX idx_trips_date ON trips(trip_date);
CREATE INDEX idx_trips_teacher_date ON trips(teacher_id, trip_date);
CREATE INDEX idx_trips_experience_date ON trips(experience_id, trip_date);
CREATE INDEX idx_trips_direct_link_token ON trips(direct_link_token) WHERE direct_link_token IS NOT NULL;
CREATE INDEX idx_trips_status ON trips(status);

-- Permission slip indexes
CREATE INDEX idx_permission_slips_trip ON permission_slips(trip_id);
CREATE INDEX idx_permission_slips_student ON permission_slips(student_id);
CREATE INDEX idx_permission_slips_magic_link_token ON permission_slips(magic_link_token) 
  WHERE magic_link_token IS NOT NULL AND token_expires_at > NOW();
CREATE INDEX idx_permission_slips_status ON permission_slips(status);
CREATE INDEX idx_permission_slips_signed_by ON permission_slips(signed_by_parent_id);

-- Document indexes
CREATE INDEX idx_documents_slip ON documents(permission_slip_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Attendance indexes
CREATE INDEX idx_attendance_trip ON attendance(trip_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_recorded_by ON attendance(recorded_by);

-- Chaperone indexes
CREATE INDEX idx_chaperones_trip ON chaperones(trip_id);
CREATE INDEX idx_chaperones_parent ON chaperones(parent_id);
CREATE INDEX idx_chaperones_status ON chaperones(status);

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permission_slips_updated_at BEFORE UPDATE ON permission_slips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate secure random token
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate magic link token with expiration
CREATE OR REPLACE FUNCTION generate_magic_link_token()
RETURNS TABLE(token TEXT, expires_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY SELECT 
    generate_secure_token(32),
    NOW() + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to generate direct link token
CREATE OR REPLACE FUNCTION generate_direct_link_token()
RETURNS TEXT AS $$
BEGIN
  RETURN gen_random_uuid()::TEXT;
END;
$$ LANGUAGE plpgsql;
