-- Row-Level Security policies for trip access
-- Migration: 20240101000005_rls_trip_policies.sql

-- =====================================================
-- ENABLE RLS ON TRIP TABLES
-- =====================================================

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE chaperones ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TRIPS POLICIES
-- =====================================================

-- Trips: Teachers can view their own trips
CREATE POLICY "Teachers can view their own trips"
  ON trips FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM teachers WHERE id = trips.teacher_id
    )
  );

-- Trips: Venue users can view trips for their experiences
CREATE POLICY "Venue users can view trips for their experiences"
  ON trips FOR SELECT
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  );

-- Trips: Anyone with valid direct link can view trip
CREATE POLICY "Anyone with valid direct link can view trip"
  ON trips FOR SELECT
  USING (
    direct_link_token IS NOT NULL
    AND direct_link_token = current_setting('app.direct_link_token', true)
  );

-- Trips: Teachers can create their own trips
CREATE POLICY "Teachers can create their own trips"
  ON trips FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM teachers WHERE id = trips.teacher_id
    )
  );

-- Trips: Teachers can update their own trips
CREATE POLICY "Teachers can update their own trips"
  ON trips FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM teachers WHERE id = trips.teacher_id
    )
  );

-- Trips: Teachers can delete their own trips
CREATE POLICY "Teachers can delete their own trips"
  ON trips FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM teachers WHERE id = trips.teacher_id
    )
  );

-- Trips: Venue users can update trips for their experiences (status changes)
CREATE POLICY "Venue users can update trips for their experiences"
  ON trips FOR UPDATE
  USING (
    experience_id IN (
      SELECT id FROM experiences WHERE venue_id IN (
        SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- ATTENDANCE POLICIES
-- =====================================================

-- Attendance: Teachers can view attendance for their trips
CREATE POLICY "Teachers can view attendance for their trips"
  ON attendance FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Attendance: Teachers can manage attendance for their trips
CREATE POLICY "Teachers can manage attendance for their trips"
  ON attendance FOR ALL
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Attendance: Venue users can view attendance for their experience trips
CREATE POLICY "Venue users can view attendance for their experience trips"
  ON attendance FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE experience_id IN (
        SELECT id FROM experiences WHERE venue_id IN (
          SELECT venue_id FROM venue_users WHERE user_id = auth.uid()
        )
      )
    )
  );

-- =====================================================
-- CHAPERONES POLICIES
-- =====================================================

-- Chaperones: Teachers can view chaperones for their trips
CREATE POLICY "Teachers can view chaperones for their trips"
  ON chaperones FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Chaperones: Teachers can manage chaperones for their trips
CREATE POLICY "Teachers can manage chaperones for their trips"
  ON chaperones FOR ALL
  USING (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips WHERE teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Chaperones: Parents can view their own chaperone invitations
CREATE POLICY "Parents can view their own chaperone invitations"
  ON chaperones FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM parents WHERE id = chaperones.parent_id
    )
  );

-- Chaperones: Parents can update their own chaperone status
CREATE POLICY "Parents can update their own chaperone status"
  ON chaperones FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM parents WHERE id = chaperones.parent_id
    )
  );
