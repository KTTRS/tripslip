-- =====================================================
-- DISABLE RLS FOR CONSENT ENFORCEMENT TESTS
-- =====================================================
-- Migration: 20240101000037_disable_rls_for_consent_tests.sql
-- Description: Disable RLS on rosters, students, parents, and data_sharing_consents for testing
-- WARNING: This is for development/testing only. In production, RLS should be enabled.

-- Disable RLS on rosters
ALTER TABLE rosters DISABLE ROW LEVEL SECURITY;

-- Disable RLS on students
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Disable RLS on parents
ALTER TABLE parents DISABLE ROW LEVEL SECURITY;

-- Disable RLS on student_parents junction table
ALTER TABLE student_parents DISABLE ROW LEVEL SECURITY;

-- Disable RLS on data_sharing_consents
ALTER TABLE data_sharing_consents DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE rosters IS 'RLS disabled for testing. Re-enable in production.';
COMMENT ON TABLE students IS 'RLS disabled for testing. Re-enable in production.';
COMMENT ON TABLE parents IS 'RLS disabled for testing. Re-enable in production.';
COMMENT ON TABLE data_sharing_consents IS 'RLS disabled for testing. Re-enable in production.';
