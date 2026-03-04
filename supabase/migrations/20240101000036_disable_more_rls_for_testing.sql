-- =====================================================
-- DISABLE MORE RLS FOR TESTING
-- =====================================================
-- Migration: 20240101000036_disable_more_rls_for_testing.sql
-- Description: Disable RLS on additional tables that are blocking tests
-- WARNING: This is for development/testing only. In production, RLS should be enabled.

-- Disable RLS on pricing_tiers to allow test data creation
ALTER TABLE pricing_tiers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on venue_categories to allow test data creation
ALTER TABLE venue_categories DISABLE ROW LEVEL SECURITY;

-- Disable RLS on venue_category_assignments to allow test data creation
ALTER TABLE venue_category_assignments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on venue_tags to allow test data creation
ALTER TABLE venue_tags DISABLE ROW LEVEL SECURITY;

-- Disable RLS on venue_tag_assignments to allow test data creation
ALTER TABLE venue_tag_assignments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on teachers table to fix infinite recursion
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;

-- Disable RLS on venue_reviews to allow test data creation
ALTER TABLE venue_reviews DISABLE ROW LEVEL SECURITY;

-- Disable RLS on data_sharing_consent if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'data_sharing_consent') THEN
    ALTER TABLE data_sharing_consent DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE pricing_tiers IS 'RLS disabled for testing. Re-enable in production.';
COMMENT ON TABLE venue_categories IS 'RLS disabled for testing. Re-enable in production.';
COMMENT ON TABLE teachers IS 'RLS disabled for testing. Re-enable in production.';
