-- Create trip_approvals table for tracking approval decisions
-- Migration: 20240101000014_create_trip_approvals.sql

-- =====================================================
-- TRIP APPROVALS TABLE
-- =====================================================

CREATE TABLE trip_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  administrator_id UUID NOT NULL,
  administrator_name TEXT NOT NULL,
  decision TEXT NOT NULL,
  comments TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (decision IN ('approved', 'rejected'))
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_trip_approvals_trip ON trip_approvals(trip_id);
CREATE INDEX idx_trip_approvals_administrator ON trip_approvals(administrator_id);
CREATE INDEX idx_trip_approvals_created_at ON trip_approvals(created_at);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE trip_approvals ENABLE ROW LEVEL SECURITY;

-- School administrators can view all approvals for their school's trips
CREATE POLICY "School admins can view trip approvals"
  ON trip_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN teachers te ON t.teacher_id = te.id
      WHERE t.id = trip_approvals.trip_id
      AND te.school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- School administrators can insert approval decisions
CREATE POLICY "School admins can create trip approvals"
  ON trip_approvals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN teachers te ON t.teacher_id = te.id
      WHERE t.id = trip_approvals.trip_id
      AND te.school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Teachers can view approval decisions for their trips
CREATE POLICY "Teachers can view their trip approvals"
  ON trip_approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.id = trip_approvals.trip_id
      AND t.teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- AUDIT TRIGGER
-- =====================================================

CREATE TRIGGER audit_trip_approvals 
  AFTER INSERT OR UPDATE OR DELETE ON trip_approvals
  FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();
