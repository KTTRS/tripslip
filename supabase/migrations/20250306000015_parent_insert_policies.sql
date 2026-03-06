DROP POLICY IF EXISTS "parents_teacher_insert" ON parents;
CREATE POLICY "parents_teacher_insert" ON parents FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "parents_teacher_select" ON parents;
CREATE POLICY "parents_teacher_select" ON parents FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "student_parents_teacher_insert" ON student_parents;
CREATE POLICY "student_parents_teacher_insert" ON student_parents FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "student_parents_teacher_select" ON student_parents;
CREATE POLICY "student_parents_teacher_select" ON student_parents FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "students_teacher_delete" ON students;
CREATE POLICY "students_teacher_delete" ON students FOR DELETE TO authenticated
  USING (roster_id IN (SELECT get_my_roster_ids()));

DROP POLICY IF EXISTS "student_parents_teacher_delete" ON student_parents;
CREATE POLICY "student_parents_teacher_delete" ON student_parents FOR DELETE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "slips_teacher_delete" ON permission_slips;
CREATE POLICY "slips_teacher_delete" ON permission_slips FOR DELETE TO authenticated
  USING (trip_id IN (SELECT get_my_trip_ids()));

DROP POLICY IF EXISTS "schools_select" ON schools;
CREATE POLICY "schools_select" ON schools FOR SELECT TO authenticated USING (true);
