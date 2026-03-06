DROP POLICY IF EXISTS "slips_teacher_insert" ON permission_slips;
CREATE POLICY "slips_teacher_insert" ON permission_slips FOR INSERT TO authenticated
  WITH CHECK (trip_id IN (SELECT get_my_trip_ids()));

DROP POLICY IF EXISTS "slips_teacher_update" ON permission_slips;
CREATE POLICY "slips_teacher_update" ON permission_slips FOR UPDATE TO authenticated
  USING (trip_id IN (SELECT get_my_trip_ids()));

DROP POLICY IF EXISTS "slips_anon_select" ON permission_slips;
CREATE POLICY "slips_anon_select" ON permission_slips FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "slips_anon_update" ON permission_slips;
CREATE POLICY "slips_anon_update" ON permission_slips FOR UPDATE TO anon
  USING (true);

DROP POLICY IF EXISTS "rosters_teacher_all" ON rosters;
CREATE POLICY "rosters_teacher_all" ON rosters FOR ALL TO authenticated
  USING (teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "teachers_insert_school" ON teachers;
CREATE POLICY "teachers_insert_school" ON teachers FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "teachers_select_school" ON teachers;
CREATE POLICY "teachers_select_school" ON teachers FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "teachers_update_own" ON teachers;
CREATE POLICY "teachers_update_own" ON teachers FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "teachers_delete_school" ON teachers;
CREATE POLICY "teachers_delete_school" ON teachers FOR DELETE TO authenticated
  USING (true);
