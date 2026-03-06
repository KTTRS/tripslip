ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_assignments_select_own" ON user_role_assignments;
CREATE POLICY "role_assignments_select_own" ON user_role_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
DROP POLICY IF EXISTS "role_assignments_service_all" ON user_role_assignments;
CREATE POLICY "role_assignments_service_all" ON user_role_assignments FOR ALL TO service_role USING (true);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_select_all" ON user_roles;
CREATE POLICY "user_roles_select_all" ON user_roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "user_roles_anon_select" ON user_roles;
CREATE POLICY "user_roles_anon_select" ON user_roles FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "user_roles_service_all" ON user_roles;
CREATE POLICY "user_roles_service_all" ON user_roles FOR ALL TO service_role USING (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "notifications_service_all" ON notifications;
CREATE POLICY "notifications_service_all" ON notifications FOR ALL TO service_role USING (true);

ALTER TABLE trip_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trip_approvals_select_all" ON trip_approvals;
CREATE POLICY "trip_approvals_select_all" ON trip_approvals FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "trip_approvals_insert" ON trip_approvals;
CREATE POLICY "trip_approvals_insert" ON trip_approvals FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "trip_approvals_service_all" ON trip_approvals;
CREATE POLICY "trip_approvals_service_all" ON trip_approvals FOR ALL TO service_role USING (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'venue_bookings') THEN
    ALTER TABLE venue_bookings ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "venue_bookings_select_all" ON venue_bookings';
    EXECUTE 'CREATE POLICY "venue_bookings_select_all" ON venue_bookings FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "venue_bookings_insert" ON venue_bookings';
    EXECUTE 'CREATE POLICY "venue_bookings_insert" ON venue_bookings FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "venue_bookings_service_all" ON venue_bookings';
    EXECUTE 'CREATE POLICY "venue_bookings_service_all" ON venue_bookings FOR ALL TO service_role USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payments') THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "payments_select_all" ON payments';
    EXECUTE 'CREATE POLICY "payments_select_all" ON payments FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "payments_insert" ON payments';
    EXECUTE 'CREATE POLICY "payments_insert" ON payments FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "payments_service_all" ON payments';
    EXECUTE 'CREATE POLICY "payments_service_all" ON payments FOR ALL TO service_role USING (true)';
  END IF;
END $$;
