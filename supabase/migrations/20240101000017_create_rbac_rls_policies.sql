-- Migration: Create RBAC Row-Level Security Policies
-- This migration implements RLS policies for role-based data access control
-- across all sensitive tables in the TripSlip platform

-- =====================================================
-- TRIPS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "trips_select_policy" ON trips;
DROP POLICY IF EXISTS "trips_insert_policy" ON trips;
DROP POLICY IF EXISTS "trips_update_policy" ON trips;
DROP POLICY IF EXISTS "trips_delete_policy" ON trips;

-- SELECT policy: Role-based filtering
-- Teachers see only their own trips
-- School admins see all trips from their school
-- District admins see all trips from schools in their district
-- TripSlip admins see all trips
CREATE POLICY "trips_select_policy" ON trips
FOR SELECT USING (
  CASE public.user_role()
    WHEN 'teacher' THEN 
      teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    WHEN 'school_admin' THEN 
      teacher_id IN (
        SELECT id FROM teachers 
        WHERE school_id = public.user_organization_id()
      )
    WHEN 'district_admin' THEN 
      teacher_id IN (
        SELECT t.id FROM teachers t
        JOIN school_districts sd ON t.school_id = sd.school_id
        WHERE sd.district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    ELSE false
  END
);

-- INSERT policy: Teachers and admins can create trips
CREATE POLICY "trips_insert_policy" ON trips
FOR INSERT WITH CHECK (
  public.user_role() IN ('teacher', 'school_admin', 'district_admin', 'tripslip_admin')
  AND teacher_id IN (
    SELECT id FROM teachers WHERE user_id = auth.uid()
  )
);

-- UPDATE policy: Same as SELECT - can only update trips you can see
CREATE POLICY "trips_update_policy" ON trips
FOR UPDATE USING (
  CASE public.user_role()
    WHEN 'teacher' THEN 
      teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    WHEN 'school_admin' THEN 
      teacher_id IN (
        SELECT id FROM teachers 
        WHERE school_id = public.user_organization_id()
      )
    WHEN 'district_admin' THEN 
      teacher_id IN (
        SELECT t.id FROM teachers t
        JOIN school_districts sd ON t.school_id = sd.school_id
        WHERE sd.district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    ELSE false
  END
);

-- DELETE policy: Only admins can delete trips
CREATE POLICY "trips_delete_policy" ON trips
FOR DELETE USING (
  public.user_role() IN ('school_admin', 'district_admin', 'tripslip_admin')
  AND (
    CASE public.user_role()
      WHEN 'school_admin' THEN 
        teacher_id IN (
          SELECT id FROM teachers 
          WHERE school_id = public.user_organization_id()
        )
      WHEN 'district_admin' THEN 
        teacher_id IN (
          SELECT t.id FROM teachers t
          JOIN school_districts sd ON t.school_id = sd.school_id
          WHERE sd.district_id = public.user_organization_id()
        )
      WHEN 'tripslip_admin' THEN 
        true
      ELSE false
    END
  )
);

-- =====================================================
-- STUDENTS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_insert_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

-- SELECT policy: Role-based filtering for students
-- Teachers see students in their rosters
-- School admins see students from their school
-- District admins see students from schools in their district
-- Parents see their own children
-- TripSlip admins see all students
CREATE POLICY "students_select_policy" ON students
FOR SELECT USING (
  CASE public.user_role()
    WHEN 'teacher' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        WHERE t.user_id = auth.uid()
      )
    WHEN 'school_admin' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        WHERE t.school_id = public.user_organization_id()
      )
    WHEN 'district_admin' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        JOIN school_districts sd ON t.school_id = sd.school_id
        WHERE sd.district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    WHEN 'parent' THEN
      id IN (
        SELECT student_id FROM student_parents
        WHERE parent_id IN (
          SELECT id FROM parents WHERE user_id = auth.uid()
        )
      )
    ELSE false
  END
);

-- INSERT policy: Teachers and admins can add students
CREATE POLICY "students_insert_policy" ON students
FOR INSERT WITH CHECK (
  public.user_role() IN ('teacher', 'school_admin', 'district_admin', 'tripslip_admin')
  AND (
    CASE public.user_role()
      WHEN 'teacher' THEN 
        roster_id IN (
          SELECT r.id FROM rosters r
          JOIN teachers t ON r.teacher_id = t.id
          WHERE t.user_id = auth.uid()
        )
      ELSE true
    END
  )
);

-- UPDATE policy: Same as SELECT - can only update students you can see
CREATE POLICY "students_update_policy" ON students
FOR UPDATE USING (
  CASE public.user_role()
    WHEN 'teacher' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        WHERE t.user_id = auth.uid()
      )
    WHEN 'school_admin' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        WHERE t.school_id = public.user_organization_id()
      )
    WHEN 'district_admin' THEN 
      roster_id IN (
        SELECT r.id FROM rosters r
        JOIN teachers t ON r.teacher_id = t.id
        JOIN school_districts sd ON t.school_id = sd.school_id
        WHERE sd.district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    ELSE false
  END
);

-- DELETE policy: Only teachers and admins can delete students
CREATE POLICY "students_delete_policy" ON students
FOR DELETE USING (
  public.user_role() IN ('teacher', 'school_admin', 'district_admin', 'tripslip_admin')
  AND (
    CASE public.user_role()
      WHEN 'teacher' THEN 
        roster_id IN (
          SELECT r.id FROM rosters r
          JOIN teachers t ON r.teacher_id = t.id
          WHERE t.user_id = auth.uid()
        )
      ELSE true
    END
  )
);

-- =====================================================
-- SCHOOLS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "schools_select_policy" ON schools;
DROP POLICY IF EXISTS "schools_insert_policy" ON schools;
DROP POLICY IF EXISTS "schools_update_policy" ON schools;
DROP POLICY IF EXISTS "schools_delete_policy" ON schools;

-- SELECT policy: Role-based filtering for schools
-- School admins see only their school
-- District admins see schools in their district
-- Teachers see their assigned school
-- TripSlip admins see all schools
CREATE POLICY "schools_select_policy" ON schools
FOR SELECT USING (
  CASE public.user_role()
    WHEN 'school_admin' THEN 
      id = public.user_organization_id()
    WHEN 'district_admin' THEN 
      id IN (
        SELECT school_id FROM school_districts 
        WHERE district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    WHEN 'teacher' THEN
      id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    ELSE false
  END
);

-- INSERT policy: Only TripSlip admins can create schools
CREATE POLICY "schools_insert_policy" ON schools
FOR INSERT WITH CHECK (
  public.user_role() = 'tripslip_admin'
);

-- UPDATE policy: School admins can update their school, district admins their district schools, TripSlip admins all
CREATE POLICY "schools_update_policy" ON schools
FOR UPDATE USING (
  CASE public.user_role()
    WHEN 'school_admin' THEN 
      id = public.user_organization_id()
    WHEN 'district_admin' THEN 
      id IN (
        SELECT school_id FROM school_districts 
        WHERE district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    ELSE false
  END
);

-- DELETE policy: Only TripSlip admins can delete schools
CREATE POLICY "schools_delete_policy" ON schools
FOR DELETE USING (
  public.user_role() = 'tripslip_admin'
);

-- =====================================================
-- EXPERIENCES TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "experiences_select_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_insert_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_update_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_delete_policy" ON experiences;

-- SELECT policy: All authenticated users see published experiences
-- Venue admins see their venue's experiences (published or not)
-- TripSlip admins see all experiences
CREATE POLICY "experiences_select_policy" ON experiences
FOR SELECT USING (
  published = true
  OR (
    public.user_role() = 'venue_admin' 
    AND venue_id = public.user_organization_id()
  )
  OR public.is_tripslip_admin()
);

-- INSERT policy: Only venue admins can create experiences for their venue
CREATE POLICY "experiences_insert_policy" ON experiences
FOR INSERT WITH CHECK (
  public.user_role() = 'venue_admin'
  AND venue_id = public.user_organization_id()
);

-- UPDATE policy: Venue admins can update their venue's experiences, TripSlip admins can update all
CREATE POLICY "experiences_update_policy" ON experiences
FOR UPDATE USING (
  (public.user_role() = 'venue_admin' AND venue_id = public.user_organization_id())
  OR public.is_tripslip_admin()
);

-- DELETE policy: Venue admins can delete their venue's experiences, TripSlip admins can delete all
CREATE POLICY "experiences_delete_policy" ON experiences
FOR DELETE USING (
  (public.user_role() = 'venue_admin' AND venue_id = public.user_organization_id())
  OR public.is_tripslip_admin()
);

-- =====================================================
-- BOOKINGS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
-- Note: Bookings table will be created in migration 20240101000030
-- DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
-- DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;
-- DROP POLICY IF EXISTS "bookings_update_policy" ON bookings;
-- DROP POLICY IF EXISTS "bookings_delete_policy" ON bookings;

-- Note: Bookings table will be created in a future migration
-- RLS policies for bookings will be added when the table is created

-- =====================================================
-- TEACHERS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "teachers_select_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_insert_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON teachers;

-- SELECT policy: Role-based filtering for teachers
-- School admins see teachers in their school
-- District admins see teachers in district schools
-- Teachers see themselves and other teachers in their school
-- TripSlip admins see all teachers
CREATE POLICY "teachers_select_policy" ON teachers
FOR SELECT USING (
  CASE public.user_role()
    WHEN 'teacher' THEN 
      user_id = auth.uid() OR school_id IN (
        SELECT school_id FROM teachers WHERE user_id = auth.uid()
      )
    WHEN 'school_admin' THEN 
      school_id = public.user_organization_id()
    WHEN 'district_admin' THEN 
      school_id IN (
        SELECT school_id FROM school_districts 
        WHERE district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    ELSE false
  END
);

-- INSERT policy: School admins and district admins can add teachers to their schools
CREATE POLICY "teachers_insert_policy" ON teachers
FOR INSERT WITH CHECK (
  public.user_role() IN ('school_admin', 'district_admin', 'tripslip_admin')
  AND (
    CASE public.user_role()
      WHEN 'school_admin' THEN 
        school_id = public.user_organization_id()
      WHEN 'district_admin' THEN 
        school_id IN (
          SELECT school_id FROM school_districts 
          WHERE district_id = public.user_organization_id()
        )
      ELSE true
    END
  )
);

-- UPDATE policy: Teachers can update themselves, admins can update teachers in their scope
CREATE POLICY "teachers_update_policy" ON teachers
FOR UPDATE USING (
  CASE public.user_role()
    WHEN 'teacher' THEN 
      user_id = auth.uid()
    WHEN 'school_admin' THEN 
      school_id = public.user_organization_id()
    WHEN 'district_admin' THEN 
      school_id IN (
        SELECT school_id FROM school_districts 
        WHERE district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    ELSE false
  END
);

-- DELETE policy: Only admins can delete teachers
CREATE POLICY "teachers_delete_policy" ON teachers
FOR DELETE USING (
  public.user_role() IN ('school_admin', 'district_admin', 'tripslip_admin')
  AND (
    CASE public.user_role()
      WHEN 'school_admin' THEN 
        school_id = public.user_organization_id()
      WHEN 'district_admin' THEN 
        school_id IN (
          SELECT school_id FROM school_districts 
          WHERE district_id = public.user_organization_id()
        )
      ELSE true
    END
  )
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

-- Enable RLS on all sensitive tables
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Also enable RLS on supporting tables
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_role_context ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADDITIONAL SUPPORTING TABLE RLS POLICIES
-- =====================================================

-- ROSTERS: Teachers see their own rosters, admins see rosters in their scope
DROP POLICY IF EXISTS "rosters_select_policy" ON rosters;
CREATE POLICY "rosters_select_policy" ON rosters
FOR SELECT USING (
  CASE public.user_role()
    WHEN 'teacher' THEN 
      teacher_id IN (
        SELECT id FROM teachers WHERE user_id = auth.uid()
      )
    WHEN 'school_admin' THEN 
      teacher_id IN (
        SELECT id FROM teachers 
        WHERE school_id = public.user_organization_id()
      )
    WHEN 'district_admin' THEN 
      teacher_id IN (
        SELECT t.id FROM teachers t
        JOIN school_districts sd ON t.school_id = sd.school_id
        WHERE sd.district_id = public.user_organization_id()
      )
    WHEN 'tripslip_admin' THEN 
      true
    ELSE false
  END
);

-- PERMISSION SLIPS: Follow trip access rules
DROP POLICY IF EXISTS "permission_slips_select_policy" ON permission_slips;
CREATE POLICY "permission_slips_select_policy" ON permission_slips
FOR SELECT USING (
  trip_id IN (SELECT id FROM trips) -- Leverages trips RLS policy
  OR public.user_role() = 'parent' AND student_id IN (
    SELECT student_id FROM student_parents
    WHERE parent_id IN (
      SELECT id FROM parents WHERE user_id = auth.uid()
    )
  )
);

-- VENUES: Venue admins see their venue, TripSlip admins see all, others see claimed venues
DROP POLICY IF EXISTS "venues_select_policy" ON venues;
CREATE POLICY "venues_select_policy" ON venues
FOR SELECT USING (
  claimed = true
  OR (public.user_role() = 'venue_admin' AND id = public.user_organization_id())
  OR public.is_tripslip_admin()
);

-- DISTRICTS: District admins see their district, TripSlip admins see all
DROP POLICY IF EXISTS "districts_select_policy" ON districts;
CREATE POLICY "districts_select_policy" ON districts
FOR SELECT USING (
  (public.user_role() = 'district_admin' AND id = public.user_organization_id())
  OR public.is_tripslip_admin()
);

-- USER_ROLE_ASSIGNMENTS: Users see their own assignments, TripSlip admins see all
DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON user_role_assignments;
CREATE POLICY "user_role_assignments_select_policy" ON user_role_assignments
FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_tripslip_admin()
);

-- ACTIVE_ROLE_CONTEXT: Users see their own context, TripSlip admins see all
DROP POLICY IF EXISTS "active_role_context_select_policy" ON active_role_context;
CREATE POLICY "active_role_context_select_policy" ON active_role_context
FOR SELECT USING (
  user_id = auth.uid()
  OR public.is_tripslip_admin()
);

-- Add comments for documentation
COMMENT ON POLICY "trips_select_policy" ON trips IS 'Role-based filtering: teachers see own trips, school admins see school trips, district admins see district trips, TripSlip admins see all';
COMMENT ON POLICY "students_select_policy" ON students IS 'Role-based filtering: teachers see roster students, school admins see school students, district admins see district students, parents see their children';
COMMENT ON POLICY "schools_select_policy" ON schools IS 'Role-based filtering: school admins see their school, district admins see district schools, teachers see their school';
COMMENT ON POLICY "experiences_select_policy" ON experiences IS 'All users see published experiences, venue admins see their venue experiences, TripSlip admins see all';
COMMENT ON POLICY "teachers_select_policy" ON teachers IS 'Role-based filtering: school admins see school teachers, district admins see district teachers, teachers see themselves and colleagues';

