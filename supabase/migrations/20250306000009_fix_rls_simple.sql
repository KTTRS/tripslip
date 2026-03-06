CREATE OR REPLACE FUNCTION auth_uid() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT auth.uid() $$;

CREATE OR REPLACE FUNCTION get_my_teacher_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION get_my_parent_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT id FROM public.parents WHERE user_id = auth.uid() LIMIT 1 $$;

DROP POLICY IF EXISTS "teachers_select_own" ON teachers;
CREATE POLICY "teachers_select_own" ON teachers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "teachers_update_own" ON teachers;
CREATE POLICY "teachers_update_own" ON teachers FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "teachers_insert_own" ON teachers;
CREATE POLICY "teachers_insert_own" ON teachers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "trips_teacher_access" ON trips;
CREATE POLICY "trips_teacher_access" ON trips FOR ALL TO authenticated
  USING (teacher_id = get_my_teacher_id());

DROP POLICY IF EXISTS "rosters_teacher_access" ON rosters;
CREATE POLICY "rosters_teacher_access" ON rosters FOR ALL TO authenticated
  USING (teacher_id = get_my_teacher_id());

DROP POLICY IF EXISTS "students_teacher_access" ON students;
CREATE POLICY "students_teacher_access" ON students FOR ALL TO authenticated
  USING (roster_id IN (SELECT id FROM public.rosters WHERE teacher_id = get_my_teacher_id()));

DROP POLICY IF EXISTS "students_parent_select" ON students;
CREATE POLICY "students_parent_select" ON students FOR SELECT TO authenticated
  USING (id IN (SELECT student_id FROM public.student_parents WHERE parent_id = get_my_parent_id()));

DROP POLICY IF EXISTS "slips_teacher_select" ON permission_slips;
CREATE POLICY "slips_teacher_select" ON permission_slips FOR SELECT TO authenticated
  USING (trip_id IN (SELECT id FROM public.trips WHERE teacher_id = get_my_teacher_id()));

DROP POLICY IF EXISTS "slips_parent_select" ON permission_slips;
CREATE POLICY "slips_parent_select" ON permission_slips FOR SELECT TO authenticated
  USING (student_id IN (SELECT student_id FROM public.student_parents WHERE parent_id = get_my_parent_id()));

DROP POLICY IF EXISTS "experiences_update_admin" ON experiences;
CREATE POLICY "experiences_update_admin" ON experiences FOR UPDATE TO authenticated
  USING (venue_id IN (SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "pricing_update_admin" ON pricing_tiers;
CREATE POLICY "pricing_update_admin" ON pricing_tiers FOR UPDATE TO authenticated
  USING (experience_id IN (
    SELECT e.id FROM public.experiences e JOIN public.venue_users vu ON vu.venue_id = e.venue_id WHERE vu.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "venues_update_admin" ON venues;
CREATE POLICY "venues_update_admin" ON venues FOR UPDATE TO authenticated
  USING (id IN (SELECT venue_id FROM public.venue_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "trip_forms_teacher_crud" ON trip_forms;
CREATE POLICY "trip_forms_teacher_crud" ON trip_forms FOR ALL TO authenticated
  USING (trip_id IN (SELECT id FROM public.trips WHERE teacher_id = get_my_teacher_id()));

DROP POLICY IF EXISTS "parents_select_own" ON parents;
CREATE POLICY "parents_select_own" ON parents FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "parents_update_own" ON parents;
CREATE POLICY "parents_update_own" ON parents FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "student_parents_select" ON student_parents;
CREATE POLICY "student_parents_select" ON student_parents FOR SELECT TO authenticated
  USING (parent_id = get_my_parent_id());
