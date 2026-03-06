DROP POLICY IF EXISTS "students_anon_via_slips" ON students;
CREATE POLICY "students_anon_via_slips" ON students FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "experiences_anon_select" ON experiences;
CREATE POLICY "experiences_anon_select" ON experiences FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "venues_anon_select" ON venues;
CREATE POLICY "venues_anon_select" ON venues FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "pricing_anon_select" ON pricing_tiers;
CREATE POLICY "pricing_anon_select" ON pricing_tiers FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "trip_forms_anon_select" ON trip_forms;
CREATE POLICY "trip_forms_anon_select" ON trip_forms FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "trips_anon_select" ON trips;
CREATE POLICY "trips_anon_select" ON trips FOR SELECT TO anon USING (true);
