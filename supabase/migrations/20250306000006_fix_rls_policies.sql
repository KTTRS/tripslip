ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "venues_select_all" ON venues;
CREATE POLICY "venues_select_all" ON venues FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "venues_insert_authenticated" ON venues;
CREATE POLICY "venues_insert_authenticated" ON venues FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "venues_update_admin" ON venues;
CREATE POLICY "venues_update_admin" ON venues FOR UPDATE TO authenticated
  USING (id IN (SELECT venue_id FROM venue_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "venues_service_all" ON venues;
CREATE POLICY "venues_service_all" ON venues FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "experiences_select_all" ON experiences;
CREATE POLICY "experiences_select_all" ON experiences FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "experiences_insert_authenticated" ON experiences;
CREATE POLICY "experiences_insert_authenticated" ON experiences FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "experiences_update_admin" ON experiences;
CREATE POLICY "experiences_update_admin" ON experiences FOR UPDATE TO authenticated
  USING (venue_id IN (SELECT venue_id FROM venue_users WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "experiences_service_all" ON experiences;
CREATE POLICY "experiences_service_all" ON experiences FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "pricing_select_all" ON pricing_tiers;
CREATE POLICY "pricing_select_all" ON pricing_tiers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "pricing_insert_authenticated" ON pricing_tiers;
CREATE POLICY "pricing_insert_authenticated" ON pricing_tiers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "pricing_update_admin" ON pricing_tiers;
CREATE POLICY "pricing_update_admin" ON pricing_tiers FOR UPDATE TO authenticated
  USING (experience_id IN (
    SELECT e.id FROM experiences e JOIN venue_users vu ON vu.venue_id = e.venue_id WHERE vu.user_id = auth.uid()
  ));
DROP POLICY IF EXISTS "pricing_service_all" ON pricing_tiers;
CREATE POLICY "pricing_service_all" ON pricing_tiers FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "teachers_select_own" ON teachers;
CREATE POLICY "teachers_select_own" ON teachers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "teachers_update_own" ON teachers;
CREATE POLICY "teachers_update_own" ON teachers FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "teachers_insert_own" ON teachers;
CREATE POLICY "teachers_insert_own" ON teachers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "teachers_service_all" ON teachers;
CREATE POLICY "teachers_service_all" ON teachers FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "rosters_teacher_access" ON rosters;
CREATE POLICY "rosters_teacher_access" ON rosters FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "rosters_service_all" ON rosters;
CREATE POLICY "rosters_service_all" ON rosters FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "students_teacher_access" ON students;
CREATE POLICY "students_teacher_access" ON students FOR ALL TO authenticated
  USING (roster_id IN (SELECT id FROM rosters WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));
DROP POLICY IF EXISTS "students_parent_select" ON students;
CREATE POLICY "students_parent_select" ON students FOR SELECT TO authenticated
  USING (id IN (SELECT student_id FROM student_parents WHERE parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())));
DROP POLICY IF EXISTS "students_service_all" ON students;
CREATE POLICY "students_service_all" ON students FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "trips_teacher_access" ON trips;
CREATE POLICY "trips_teacher_access" ON trips FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "trips_school_admin_select" ON trips;
CREATE POLICY "trips_school_admin_select" ON trips FOR SELECT TO authenticated
  USING (teacher_id IN (
    SELECT t.id FROM teachers t 
    JOIN schools s ON t.school_id = s.id
    WHERE s.id IN (
      SELECT school_id FROM teachers WHERE user_id = auth.uid()
    )
  ));
DROP POLICY IF EXISTS "trips_school_admin_update" ON trips;
CREATE POLICY "trips_school_admin_update" ON trips FOR UPDATE TO authenticated
  USING (teacher_id IN (
    SELECT t.id FROM teachers t 
    JOIN schools s ON t.school_id = s.id
    WHERE s.id IN (
      SELECT school_id FROM teachers WHERE user_id = auth.uid()
    )
  ));
DROP POLICY IF EXISTS "trips_service_all" ON trips;
CREATE POLICY "trips_service_all" ON trips FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "slips_teacher_select" ON permission_slips;
CREATE POLICY "slips_teacher_select" ON permission_slips FOR SELECT TO authenticated
  USING (trip_id IN (SELECT id FROM trips WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));
DROP POLICY IF EXISTS "slips_parent_select" ON permission_slips;
CREATE POLICY "slips_parent_select" ON permission_slips FOR SELECT TO authenticated
  USING (signed_by_parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())
    OR student_id IN (SELECT student_id FROM student_parents WHERE parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())));
DROP POLICY IF EXISTS "slips_anon_select_token" ON permission_slips;
CREATE POLICY "slips_anon_select_token" ON permission_slips FOR SELECT TO anon
  USING (magic_link_token IS NOT NULL);
DROP POLICY IF EXISTS "slips_anon_update" ON permission_slips;
CREATE POLICY "slips_anon_update" ON permission_slips FOR UPDATE TO anon
  USING (magic_link_token IS NOT NULL);
DROP POLICY IF EXISTS "slips_service_all" ON permission_slips;
CREATE POLICY "slips_service_all" ON permission_slips FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "slips_authenticated_select" ON permission_slips;
CREATE POLICY "slips_authenticated_select" ON permission_slips FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "slips_authenticated_update" ON permission_slips;
CREATE POLICY "slips_authenticated_update" ON permission_slips FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "schools_select_all" ON schools;
CREATE POLICY "schools_select_all" ON schools FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "schools_anon_select" ON schools;
CREATE POLICY "schools_anon_select" ON schools FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "schools_service_all" ON schools;
CREATE POLICY "schools_service_all" ON schools FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "trip_forms_select_all" ON trip_forms;
CREATE POLICY "trip_forms_select_all" ON trip_forms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "trip_forms_teacher_crud" ON trip_forms;
CREATE POLICY "trip_forms_teacher_crud" ON trip_forms FOR ALL TO authenticated
  USING (trip_id IN (SELECT id FROM trips WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));
DROP POLICY IF EXISTS "trip_forms_service_all" ON trip_forms;
CREATE POLICY "trip_forms_service_all" ON trip_forms FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "categories_select_all" ON venue_categories;
CREATE POLICY "categories_select_all" ON venue_categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "categories_anon_select" ON venue_categories;
CREATE POLICY "categories_anon_select" ON venue_categories FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "categories_service_all" ON venue_categories;
CREATE POLICY "categories_service_all" ON venue_categories FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "cat_assign_select_all" ON venue_category_assignments;
CREATE POLICY "cat_assign_select_all" ON venue_category_assignments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cat_assign_service_all" ON venue_category_assignments;
CREATE POLICY "cat_assign_service_all" ON venue_category_assignments FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "parents_select_own" ON parents;
CREATE POLICY "parents_select_own" ON parents FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "parents_update_own" ON parents;
CREATE POLICY "parents_update_own" ON parents FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "parents_service_all" ON parents;
CREATE POLICY "parents_service_all" ON parents FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "student_parents_select" ON student_parents;
CREATE POLICY "student_parents_select" ON student_parents FOR SELECT TO authenticated
  USING (parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "student_parents_service_all" ON student_parents;
CREATE POLICY "student_parents_service_all" ON student_parents FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "venue_users_select_own" ON venue_users;
CREATE POLICY "venue_users_select_own" ON venue_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "venue_users_service_all" ON venue_users;
CREATE POLICY "venue_users_service_all" ON venue_users FOR ALL TO service_role USING (true);
