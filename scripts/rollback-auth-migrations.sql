-- =====================================================
-- ROLLBACK SCRIPT FOR AUTHENTICATION AND RBAC MIGRATIONS
-- =====================================================
-- 
-- This script safely rolls back all authentication and RBAC-related
-- database changes introduced in the authentication-and-access-control-fixes feature.
--
-- IMPORTANT: Review this script carefully before executing!
-- This will remove all role assignments, RLS policies, and related data.
--
-- Migrations to rollback (in reverse order):
-- - 20240101000019_create_update_role_claims_function.sql
-- - 20240101000018_create_audit_logs.sql
-- - 20240101000017_create_rbac_rls_policies.sql
-- - 20240101000016_create_rls_helper_functions.sql
-- - 20240101000015_create_rbac_schema.sql
--
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- STEP 1: Disable RLS on all tables
-- =====================================================

ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE rosters DISABLE ROW LEVEL SECURITY;
ALTER TABLE permission_slips DISABLE ROW LEVEL SECURITY;
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE districts DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_role_context DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop all RLS policies
-- =====================================================

-- Trips table policies
DROP POLICY IF EXISTS "trips_select_policy" ON trips;
DROP POLICY IF EXISTS "trips_insert_policy" ON trips;
DROP POLICY IF EXISTS "trips_update_policy" ON trips;
DROP POLICY IF EXISTS "trips_delete_policy" ON trips;

-- Students table policies
DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_insert_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

-- Schools table policies
DROP POLICY IF EXISTS "schools_select_policy" ON schools;
DROP POLICY IF EXISTS "schools_insert_policy" ON schools;
DROP POLICY IF EXISTS "schools_update_policy" ON schools;
DROP POLICY IF EXISTS "schools_delete_policy" ON schools;

-- Experiences table policies
DROP POLICY IF EXISTS "experiences_select_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_insert_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_update_policy" ON experiences;
DROP POLICY IF EXISTS "experiences_delete_policy" ON experiences;

-- Teachers table policies
DROP POLICY IF EXISTS "teachers_select_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_insert_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_update_policy" ON teachers;
DROP POLICY IF EXISTS "teachers_delete_policy" ON teachers;

-- Supporting table policies
DROP POLICY IF EXISTS "rosters_select_policy" ON rosters;
DROP POLICY IF EXISTS "permission_slips_select_policy" ON permission_slips;
DROP POLICY IF EXISTS "venues_select_policy" ON venues;
DROP POLICY IF EXISTS "districts_select_policy" ON districts;
DROP POLICY IF EXISTS "user_role_assignments_select_policy" ON user_role_assignments;
DROP POLICY IF EXISTS "active_role_context_select_policy" ON active_role_context;

-- =====================================================
-- STEP 3: Drop RLS helper functions
-- =====================================================

DROP FUNCTION IF EXISTS auth.user_role();
DROP FUNCTION IF EXISTS auth.user_organization_id();
DROP FUNCTION IF EXISTS auth.user_organization_type();
DROP FUNCTION IF EXISTS auth.has_role(TEXT);
DROP FUNCTION IF EXISTS auth.is_tripslip_admin();

-- =====================================================
-- STEP 4: Drop update role claims function
-- =====================================================

DROP FUNCTION IF EXISTS auth.update_user_role_claims(UUID, UUID);

-- =====================================================
-- STEP 5: Drop triggers
-- =====================================================

DROP TRIGGER IF EXISTS update_districts_updated_at ON districts;
DROP TRIGGER IF EXISTS update_user_role_assignments_updated_at ON user_role_assignments;
DROP TRIGGER IF EXISTS update_active_role_context_updated_at ON active_role_context;

-- =====================================================
-- STEP 6: Drop tables (in correct order to respect foreign keys)
-- =====================================================

-- Drop audit logs table
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Drop active role context (references user_role_assignments)
DROP TABLE IF EXISTS active_role_context CASCADE;

-- Drop user role assignments (references user_roles)
DROP TABLE IF EXISTS user_role_assignments CASCADE;

-- Drop user roles
DROP TABLE IF EXISTS user_roles CASCADE;

-- Drop school districts junction table
DROP TABLE IF EXISTS school_districts CASCADE;

-- Drop districts table
DROP TABLE IF EXISTS districts CASCADE;

-- =====================================================
-- STEP 7: Remove columns added to existing tables
-- =====================================================

-- Remove claimed columns from venues table
ALTER TABLE venues DROP COLUMN IF EXISTS claimed;
ALTER TABLE venues DROP COLUMN IF EXISTS claimed_by;
ALTER TABLE venues DROP COLUMN IF EXISTS claimed_at;

-- =====================================================
-- STEP 8: Drop update_updated_at_column function if no longer needed
-- =====================================================

-- WARNING: Only drop this if no other tables use it!
-- Uncomment the following line if you're sure no other tables use this trigger function:
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables are dropped
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    RAISE EXCEPTION 'Rollback failed: user_roles table still exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_role_assignments') THEN
    RAISE EXCEPTION 'Rollback failed: user_role_assignments table still exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'active_role_context') THEN
    RAISE EXCEPTION 'Rollback failed: active_role_context table still exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'districts') THEN
    RAISE EXCEPTION 'Rollback failed: districts table still exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_districts') THEN
    RAISE EXCEPTION 'Rollback failed: school_districts table still exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    RAISE EXCEPTION 'Rollback failed: audit_logs table still exists';
  END IF;
  
  RAISE NOTICE 'Rollback verification passed: All RBAC tables dropped successfully';
END $;

-- Verify RLS helper functions are dropped
DO $
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'user_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')) THEN
    RAISE EXCEPTION 'Rollback failed: auth.user_role() function still exists';
  END IF;
  
  RAISE NOTICE 'Rollback verification passed: All RLS helper functions dropped successfully';
END $;

-- Verify RLS is disabled
DO $
DECLARE
  rls_enabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = true;
  
  IF rls_enabled_count > 0 THEN
    RAISE WARNING 'Some tables still have RLS enabled. This may be intentional if they had RLS before this feature.';
  ELSE
    RAISE NOTICE 'Rollback verification passed: RLS disabled on all public tables';
  END IF;
END $;

-- =====================================================
-- COMMIT OR ROLLBACK
-- =====================================================

-- Review the output above. If everything looks correct, commit the transaction.
-- If there are any errors or concerns, rollback the transaction.

-- To commit: COMMIT;
-- To rollback: ROLLBACK;

-- For safety, we'll leave the transaction open for manual review
-- Uncomment one of the following lines:

-- COMMIT;  -- Uncomment to apply the rollback
-- ROLLBACK;  -- Uncomment to cancel the rollback

RAISE NOTICE '==============================================';
RAISE NOTICE 'ROLLBACK SCRIPT COMPLETED';
RAISE NOTICE '==============================================';
RAISE NOTICE 'Review the output above and then:';
RAISE NOTICE '  - Run COMMIT; to apply the rollback';
RAISE NOTICE '  - Run ROLLBACK; to cancel the rollback';
RAISE NOTICE '==============================================';

