-- Verification script for database schema and RLS policies
-- Migration: 20240101000010_verify_schema.sql
-- This script verifies that all tables, indexes, and RLS policies are correctly set up

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- This migration contains verification queries that can be run to check
-- the database schema. These are SELECT queries that won't modify data.

-- Verify all core tables exist
DO $$
DECLARE
  missing_tables TEXT[];
  expected_tables TEXT[] := ARRAY[
    'venues', 'venue_users', 'experiences', 'availability', 'pricing_tiers',
    'districts', 'schools', 'teachers', 'rosters', 'students', 'parents', 'student_parents',
    'trips', 'permission_slips', 'documents', 'attendance', 'chaperones',
    'payments', 'refunds',
    'notifications', 'audit_logs'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'All expected tables exist ✓';
  END IF;
END $$;

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  tables_without_rls TEXT[];
  expected_tables TEXT[] := ARRAY[
    'venues', 'venue_users', 'experiences', 'availability', 'pricing_tiers',
    'districts', 'schools', 'teachers', 'rosters', 'students', 'parents', 'student_parents',
    'trips', 'permission_slips', 'documents', 'attendance', 'chaperones',
    'payments', 'refunds',
    'notifications', 'audit_logs'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY expected_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = tbl 
        AND rowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, tbl);
    END IF;
  END LOOP;
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE EXCEPTION 'Tables without RLS enabled: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE 'RLS enabled on all tables ✓';
  END IF;
END $$;

-- Verify critical indexes exist
DO $$
DECLARE
  missing_indexes TEXT[];
  critical_indexes TEXT[] := ARRAY[
    'idx_venue_users_venue',
    'idx_experiences_venue',
    'idx_trips_experience',
    'idx_trips_teacher',
    'idx_permission_slips_trip',
    'idx_permission_slips_student',
    'idx_payments_slip',
    'idx_students_roster',
    'idx_rosters_teacher'
  ];
  idx TEXT;
BEGIN
  FOREACH idx IN ARRAY critical_indexes
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' AND indexname = idx
    ) THEN
      missing_indexes := array_append(missing_indexes, idx);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE EXCEPTION 'Missing critical indexes: %', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE 'All critical indexes exist ✓';
  END IF;
END $$;

-- Verify foreign key constraints exist
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public'
    AND constraint_type = 'FOREIGN KEY';
  
  IF constraint_count < 20 THEN
    RAISE EXCEPTION 'Expected at least 20 foreign key constraints, found %', constraint_count;
  ELSE
    RAISE NOTICE 'Foreign key constraints verified (% found) ✓', constraint_count;
  END IF;
END $$;

-- Verify RLS policies exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  IF policy_count < 30 THEN
    RAISE EXCEPTION 'Expected at least 30 RLS policies, found %', policy_count;
  ELSE
    RAISE NOTICE 'RLS policies verified (% found) ✓', policy_count;
  END IF;
END $$;

-- Verify triggers exist
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE '%updated_at%';
  
  IF trigger_count < 10 THEN
    RAISE EXCEPTION 'Expected at least 10 updated_at triggers, found %', trigger_count;
  ELSE
    RAISE NOTICE 'Updated_at triggers verified (% found) ✓', trigger_count;
  END IF;
END $$;

-- Verify helper functions exist
DO $$
DECLARE
  missing_functions TEXT[];
  expected_functions TEXT[] := ARRAY[
    'update_updated_at_column',
    'generate_secure_token',
    'generate_magic_link_token',
    'generate_direct_link_token',
    'get_slip_total_paid',
    'get_payment_total_refunded',
    'is_split_payment_complete',
    'create_notification',
    'mark_notification_read',
    'audit_log_trigger'
  ];
  func TEXT;
BEGIN
  FOREACH func IN ARRAY expected_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = func
    ) THEN
      missing_functions := array_append(missing_functions, func);
    END IF;
  END LOOP;
  
  IF array_length(missing_functions, 1) > 0 THEN
    RAISE EXCEPTION 'Missing helper functions: %', array_to_string(missing_functions, ', ');
  ELSE
    RAISE NOTICE 'All helper functions exist ✓';
  END IF;
END $$;

-- =====================================================
-- SCHEMA STATISTICS
-- =====================================================

-- Count tables
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE 'Total tables: %', table_count;
END $$;

-- Count indexes
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Total indexes: %', index_count;
END $$;

-- Count RLS policies
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Total RLS policies: %', policy_count;
END $$;

-- Count foreign keys
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE 'Total foreign keys: %', fk_count;
END $$;

-- =====================================================
-- VERIFICATION COMPLETE
-- =====================================================

-- If this migration completes without errors, the database schema is valid
RAISE NOTICE '========================================';
RAISE NOTICE 'Database schema verification complete!';
RAISE NOTICE '========================================';
