DROP POLICY IF EXISTS "teachers_select_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_insert_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON teachers;
DROP POLICY IF EXISTS "School admins can view teachers in their school" ON teachers;

DROP POLICY IF EXISTS "trips_select_policy" ON trips;
DROP POLICY IF EXISTS "trips_insert_policy" ON trips;
DROP POLICY IF EXISTS "trips_update_policy" ON trips;
DROP POLICY IF EXISTS "trips_delete_policy" ON trips;

DROP POLICY IF EXISTS "rosters_select_policy" ON rosters;
DROP POLICY IF EXISTS "rosters_insert_policy" ON rosters;
DROP POLICY IF EXISTS "rosters_update_policy" ON rosters;
DROP POLICY IF EXISTS "rosters_delete_policy" ON rosters;

DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_insert_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

DROP POLICY IF EXISTS "permission_slips_select_policy" ON permission_slips;
DROP POLICY IF EXISTS "permission_slips_insert_policy" ON permission_slips;
DROP POLICY IF EXISTS "permission_slips_update_policy" ON permission_slips;
DROP POLICY IF EXISTS "permission_slips_delete_policy" ON permission_slips;

DROP POLICY IF EXISTS "schools_select_policy" ON schools;
DROP POLICY IF EXISTS "schools_insert_policy" ON schools;
DROP POLICY IF EXISTS "schools_update_policy" ON schools;
DROP POLICY IF EXISTS "schools_delete_policy" ON schools;

DROP POLICY IF EXISTS "venues_select_policy" ON venues;
DROP POLICY IF EXISTS "venues_insert_policy" ON venues;
DROP POLICY IF EXISTS "venues_update_policy" ON venues;
DROP POLICY IF EXISTS "venues_delete_policy" ON venues;

DROP POLICY IF EXISTS "experiences_select_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_insert_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_update_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_delete_policy" ON experiences;

DROP POLICY IF EXISTS "pricing_tiers_select_policy" ON pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_insert_policy" ON pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_update_policy" ON pricing_tiers;
DROP POLICY IF EXISTS "pricing_tiers_delete_policy" ON pricing_tiers;

DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;

DROP POLICY IF EXISTS "venue_users_select_policy" ON venue_users;
DROP POLICY IF EXISTS "venue_users_insert_policy" ON venue_users;
DROP POLICY IF EXISTS "venue_users_update_policy" ON venue_users;
DROP POLICY IF EXISTS "venue_users_delete_policy" ON venue_users;

DROP POLICY IF EXISTS "venue_categories_select_policy" ON venue_categories;
DROP POLICY IF EXISTS "venue_category_assignments_select_policy" ON venue_category_assignments;

DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_insert_policy" ON user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_update_policy" ON user_role_assignments;
DROP POLICY IF EXISTS "user_role_assignments_delete_policy" ON user_role_assignments;

DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;

DROP POLICY IF EXISTS "parents_select_policy" ON parents;
DROP POLICY IF EXISTS "parents_insert_policy" ON parents;
DROP POLICY IF EXISTS "parents_update_policy" ON parents;
DROP POLICY IF EXISTS "parents_delete_policy" ON parents;

DROP POLICY IF EXISTS "student_parents_select_policy" ON student_parents;
DROP POLICY IF EXISTS "student_parents_insert_policy" ON student_parents;
DROP POLICY IF EXISTS "student_parents_update_policy" ON student_parents;
DROP POLICY IF EXISTS "student_parents_delete_policy" ON student_parents;

DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

DROP POLICY IF EXISTS "Teacher can view own slips" ON permission_slips;
DROP POLICY IF EXISTS "Parents can view and sign slips" ON permission_slips;
DROP POLICY IF EXISTS "Service role full access" ON permission_slips;
DROP POLICY IF EXISTS "Anyone can view schools" ON schools;
DROP POLICY IF EXISTS "Admins can modify schools" ON schools;
DROP POLICY IF EXISTS "Anyone can view venues" ON venues;
DROP POLICY IF EXISTS "Venue admins can modify own venues" ON venues;
DROP POLICY IF EXISTS "Anyone can view experiences" ON experiences;
DROP POLICY IF EXISTS "Venue admins can modify experiences" ON experiences;
DROP POLICY IF EXISTS "Teachers view own students" ON students;
DROP POLICY IF EXISTS "Teachers manage own students" ON students;
DROP POLICY IF EXISTS "Teachers view own rosters" ON rosters;
DROP POLICY IF EXISTS "Teachers manage own rosters" ON rosters;
DROP POLICY IF EXISTS "Users view own teacher profile" ON teachers;
DROP POLICY IF EXISTS "Users update own teacher profile" ON teachers;
