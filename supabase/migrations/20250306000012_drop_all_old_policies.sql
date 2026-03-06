DROP POLICY IF EXISTS "Teachers can view students in their rosters" ON students;
DROP POLICY IF EXISTS "Teachers can manage students in their rosters" ON students;
DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_insert_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

DROP POLICY IF EXISTS "Teachers can view parents of students in their rosters" ON parents;
DROP POLICY IF EXISTS "parents_select_policy" ON parents;
DROP POLICY IF EXISTS "parents_insert_policy" ON parents;
DROP POLICY IF EXISTS "parents_update_policy" ON parents;
DROP POLICY IF EXISTS "parents_delete_policy" ON parents;

DROP POLICY IF EXISTS "Teachers can view relationships for their roster students" ON student_parents;
DROP POLICY IF EXISTS "Teachers can manage relationships for their roster students" ON student_parents;
DROP POLICY IF EXISTS "student_parents_select_policy" ON student_parents;
DROP POLICY IF EXISTS "student_parents_insert_policy" ON student_parents;
DROP POLICY IF EXISTS "student_parents_update_policy" ON student_parents;
DROP POLICY IF EXISTS "student_parents_delete_policy" ON student_parents;

DROP POLICY IF EXISTS "Teacher can view own slips" ON permission_slips;
DROP POLICY IF EXISTS "Parents can view and sign slips" ON permission_slips;
DROP POLICY IF EXISTS "Service role full access" ON permission_slips;

DROP POLICY IF EXISTS "Teachers can view permissions for their trips" ON permission_slips;
DROP POLICY IF EXISTS "Parents can view own permission slips" ON permission_slips;
DROP POLICY IF EXISTS "permission_slips_select_policy" ON permission_slips;
DROP POLICY IF EXISTS "permission_slips_update_policy" ON permission_slips;
DROP POLICY IF EXISTS "permission_slips_insert_policy" ON permission_slips;
DROP POLICY IF EXISTS "permission_slips_delete_policy" ON permission_slips;

DROP POLICY IF EXISTS "Anyone can view venues" ON venues;
DROP POLICY IF EXISTS "Venue admins can modify own venues" ON venues;
DROP POLICY IF EXISTS "venues_select_policy" ON venues;
DROP POLICY IF EXISTS "venues_update_policy" ON venues;
DROP POLICY IF EXISTS "venues_insert_policy" ON venues;
DROP POLICY IF EXISTS "venues_delete_policy" ON venues;

DROP POLICY IF EXISTS "Anyone can view experiences" ON experiences;
DROP POLICY IF EXISTS "Venue admins can modify experiences" ON experiences;
DROP POLICY IF EXISTS "experiences_select_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_update_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_insert_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_delete_policy" ON experiences;

DROP POLICY IF EXISTS "pricing_tiers_select_policy" ON pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_insert_policy" ON pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_update_policy" ON pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_delete_policy" ON pricing_tiers;

DROP POLICY IF EXISTS "Anyone can view schools" ON schools;
DROP POLICY IF EXISTS "Admins can modify schools" ON schools;

DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;
DROP POLICY IF EXISTS "Teachers can view payments for their trips" ON payments;
DROP POLICY IF EXISTS "Parents can view own payments" ON payments;

DROP POLICY IF EXISTS "Teachers can view notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
