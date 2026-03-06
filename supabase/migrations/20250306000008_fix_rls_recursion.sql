DROP POLICY IF EXISTS "teachers_select_own" ON teachers;
CREATE POLICY "teachers_select_own" ON teachers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "trips_teacher_access" ON trips;
CREATE POLICY "trips_teacher_access" ON trips FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "trips_school_admin_select" ON trips;
DROP POLICY IF EXISTS "trips_school_admin_update" ON trips;

DROP POLICY IF EXISTS "slips_teacher_select" ON permission_slips;
CREATE POLICY "slips_teacher_select" ON permission_slips FOR SELECT TO authenticated
  USING (trip_id IN (SELECT id FROM trips WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "students_teacher_access" ON students;
CREATE POLICY "students_teacher_access" ON students FOR ALL TO authenticated
  USING (roster_id IN (SELECT id FROM rosters WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "students_parent_select" ON students;
CREATE POLICY "students_parent_select" ON students FOR SELECT TO authenticated
  USING (id IN (SELECT student_id FROM student_parents WHERE parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "rosters_teacher_access" ON rosters;
CREATE POLICY "rosters_teacher_access" ON rosters FOR ALL TO authenticated
  USING (teacher_id IN (SELECT id FROM teachers WHERE user_id = auth.uid()));
