CREATE OR REPLACE FUNCTION get_my_roster_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT id FROM public.rosters WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1) $$;

CREATE OR REPLACE FUNCTION get_my_trip_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT id FROM public.trips WHERE teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid() LIMIT 1) $$;

CREATE OR REPLACE FUNCTION get_my_student_ids_as_parent() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT student_id FROM public.student_parents WHERE parent_id = (SELECT id FROM public.parents WHERE user_id = auth.uid() LIMIT 1) $$;

DROP POLICY IF EXISTS "students_teacher_access" ON students;
CREATE POLICY "students_teacher_access" ON students FOR ALL TO authenticated
  USING (roster_id IN (SELECT get_my_roster_ids()));

DROP POLICY IF EXISTS "students_parent_select" ON students;
CREATE POLICY "students_parent_select" ON students FOR SELECT TO authenticated
  USING (id IN (SELECT get_my_student_ids_as_parent()));

DROP POLICY IF EXISTS "slips_teacher_select" ON permission_slips;
CREATE POLICY "slips_teacher_select" ON permission_slips FOR SELECT TO authenticated
  USING (trip_id IN (SELECT get_my_trip_ids()));

DROP POLICY IF EXISTS "slips_parent_select" ON permission_slips;
CREATE POLICY "slips_parent_select" ON permission_slips FOR SELECT TO authenticated
  USING (student_id IN (SELECT get_my_student_ids_as_parent()));

DROP POLICY IF EXISTS "student_parents_select" ON student_parents;
CREATE POLICY "student_parents_select" ON student_parents FOR SELECT TO authenticated
  USING (parent_id = (SELECT id FROM public.parents WHERE user_id = auth.uid() LIMIT 1));

DROP POLICY IF EXISTS "trip_forms_teacher_crud" ON trip_forms;
CREATE POLICY "trip_forms_teacher_crud" ON trip_forms FOR ALL TO authenticated
  USING (trip_id IN (SELECT get_my_trip_ids()));
