-- Test script for migration 20240305000004_create_logging_tables.sql
-- Run this after applying the migration to verify everything works

-- =====================================================
-- TEST 1: Verify Functions Exist
-- =====================================================

DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'cleanup_old_rate_limits',
      'cleanup_old_email_logs',
      'cleanup_old_sms_logs',
      'cleanup_all_logs',
      'get_logging_statistics'
    );
  
  IF function_count = 5 THEN
    RAISE NOTICE '✅ TEST 1 PASSED: All 5 functions exist';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: Expected 5 functions, found %', function_count;
  END IF;
END $$;

-- =====================================================
-- TEST 2: Verify Indexes Exist
-- =====================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname IN (
      'idx_rate_limits_cleanup',
      'idx_email_logs_cleanup',
      'idx_sms_logs_cleanup'
    );
  
  IF index_count = 3 THEN
    RAISE NOTICE '✅ TEST 2 PASSED: All 3 indexes exist';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: Expected 3 indexes, found %', index_count;
  END IF;
END $$;

-- =====================================================
-- TEST 3: Test Cleanup Functions with Sample Data
-- =====================================================

DO $$
DECLARE
  deleted_count INTEGER;
  remaining_count INTEGER;
BEGIN
  -- Insert test data into rate_limits
  INSERT INTO rate_limits (identifier, created_at)
  VALUES 
    ('test:old:1', NOW() - INTERVAL '2 hours'),
    ('test:old:2', NOW() - INTERVAL '3 hours'),
    ('test:recent:1', NOW() - INTERVAL '30 minutes'),
    ('test:recent:2', NOW() - INTERVAL '15 minutes');
  
  -- Verify test data inserted
  SELECT COUNT(*) INTO remaining_count FROM rate_limits WHERE identifier LIKE 'test:%';
  IF remaining_count != 4 THEN
    RAISE EXCEPTION '❌ TEST 3 SETUP FAILED: Expected 4 test records, found %', remaining_count;
  END IF;
  
  -- Run cleanup
  SELECT cleanup_old_rate_limits() INTO deleted_count;
  
  -- Verify old records deleted
  SELECT COUNT(*) INTO remaining_count FROM rate_limits WHERE identifier LIKE 'test:old:%';
  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ TEST 3a PASSED: Old rate_limits deleted (% records)', deleted_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 3a FAILED: Expected 0 old records, found %', remaining_count;
  END IF;
  
  -- Verify recent records remain
  SELECT COUNT(*) INTO remaining_count FROM rate_limits WHERE identifier LIKE 'test:recent:%';
  IF remaining_count = 2 THEN
    RAISE NOTICE '✅ TEST 3b PASSED: Recent rate_limits preserved';
  ELSE
    RAISE EXCEPTION '❌ TEST 3b FAILED: Expected 2 recent records, found %', remaining_count;
  END IF;
  
  -- Cleanup test data
  DELETE FROM rate_limits WHERE identifier LIKE 'test:%';
END $$;

-- =====================================================
-- TEST 4: Test Email Logs Cleanup
-- =====================================================

DO $$
DECLARE
  deleted_count INTEGER;
  remaining_count INTEGER;
BEGIN
  -- Insert test data into email_logs
  INSERT INTO email_logs (to_email, template_id, status, created_at)
  VALUES 
    ('test1@example.com', 'test_template', 'sent', NOW() - INTERVAL '100 days'),
    ('test2@example.com', 'test_template', 'sent', NOW() - INTERVAL '50 days');
  
  -- Run cleanup
  SELECT cleanup_old_email_logs() INTO deleted_count;
  
  -- Verify old records deleted
  SELECT COUNT(*) INTO remaining_count 
  FROM email_logs 
  WHERE to_email LIKE 'test%@example.com' 
    AND created_at < NOW() - INTERVAL '90 days';
  
  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ TEST 4 PASSED: Old email_logs deleted';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 FAILED: Expected 0 old records, found %', remaining_count;
  END IF;
  
  -- Cleanup test data
  DELETE FROM email_logs WHERE to_email LIKE 'test%@example.com';
END $$;

-- =====================================================
-- TEST 5: Test SMS Logs Cleanup
-- =====================================================

DO $$
DECLARE
  deleted_count INTEGER;
  remaining_count INTEGER;
BEGIN
  -- Insert test data into sms_logs
  INSERT INTO sms_logs (to_phone, status, created_at)
  VALUES 
    ('+15555550001', 'sent', NOW() - INTERVAL '100 days'),
    ('+15555550002', 'sent', NOW() - INTERVAL '50 days');
  
  -- Run cleanup
  SELECT cleanup_old_sms_logs() INTO deleted_count;
  
  -- Verify old records deleted
  SELECT COUNT(*) INTO remaining_count 
  FROM sms_logs 
  WHERE to_phone LIKE '+1555555000%' 
    AND created_at < NOW() - INTERVAL '90 days';
  
  IF remaining_count = 0 THEN
    RAISE NOTICE '✅ TEST 5 PASSED: Old sms_logs deleted';
  ELSE
    RAISE EXCEPTION '❌ TEST 5 FAILED: Expected 0 old records, found %', remaining_count;
  END IF;
  
  -- Cleanup test data
  DELETE FROM sms_logs WHERE to_phone LIKE '+1555555000%';
END $$;

-- =====================================================
-- TEST 6: Test Master Cleanup Function
-- =====================================================

DO $$
DECLARE
  result_count INTEGER;
BEGIN
  -- Call master cleanup function
  SELECT COUNT(*) INTO result_count FROM cleanup_all_logs();
  
  IF result_count = 3 THEN
    RAISE NOTICE '✅ TEST 6 PASSED: Master cleanup function returns 3 results';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: Expected 3 results, found %', result_count;
  END IF;
END $$;

-- =====================================================
-- TEST 7: Test Statistics Function
-- =====================================================

DO $$
DECLARE
  result_count INTEGER;
  has_required_columns BOOLEAN;
BEGIN
  -- Call statistics function
  SELECT COUNT(*) INTO result_count FROM get_logging_statistics();
  
  IF result_count = 3 THEN
    RAISE NOTICE '✅ TEST 7a PASSED: Statistics function returns 3 rows';
  ELSE
    RAISE EXCEPTION '❌ TEST 7a FAILED: Expected 3 rows, found %', result_count;
  END IF;
  
  -- Verify columns exist
  SELECT EXISTS (
    SELECT 1 FROM get_logging_statistics()
    WHERE table_name IS NOT NULL
      AND total_rows IS NOT NULL
      AND rows_last_24h IS NOT NULL
      AND rows_last_7d IS NOT NULL
  ) INTO has_required_columns;
  
  IF has_required_columns THEN
    RAISE NOTICE '✅ TEST 7b PASSED: Statistics function has all required columns';
  ELSE
    RAISE EXCEPTION '❌ TEST 7b FAILED: Missing required columns';
  END IF;
END $$;

-- =====================================================
-- TEST 8: Verify Function Comments
-- =====================================================

DO $$
DECLARE
  comment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO comment_count
  FROM pg_description d
  JOIN pg_proc p ON d.objoid = p.oid
  WHERE p.proname IN (
    'cleanup_old_rate_limits',
    'cleanup_old_email_logs',
    'cleanup_old_sms_logs',
    'cleanup_all_logs',
    'get_logging_statistics'
  );
  
  IF comment_count = 5 THEN
    RAISE NOTICE '✅ TEST 8 PASSED: All functions have documentation comments';
  ELSE
    RAISE NOTICE '⚠️  TEST 8 WARNING: Expected 5 function comments, found %', comment_count;
  END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION TEST SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All tests completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Schedule cleanup jobs in production';
  RAISE NOTICE '2. Deploy cleanup-logs Edge Function';
  RAISE NOTICE '3. Set up monitoring alerts';
  RAISE NOTICE '4. Review cleanup logs regularly';
  RAISE NOTICE '========================================';
END $$;
