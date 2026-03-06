DROP POLICY IF EXISTS "trips_anon_select_by_token" ON trips;
CREATE POLICY "trips_anon_select_by_token" ON trips FOR SELECT TO anon
  USING (direct_link_token IS NOT NULL);

DROP POLICY IF EXISTS "students_anon_select" ON students;
CREATE POLICY "students_anon_select" ON students FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "permission_slips_anon_insert" ON permission_slips;
CREATE POLICY "permission_slips_anon_insert" ON permission_slips FOR INSERT TO anon
  WITH CHECK (true);
