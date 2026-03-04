-- =====================================================
-- DISABLE RLS FOR SCHOOLS AND TEACHERS TABLES
-- =====================================================
-- Migration: 20240101000043_disable_rls_schools_teachers.sql
-- Description: Disable RLS on schools and teachers tables for testing
-- WARNING: This is for development/testing only. In production, RLS should be enabled.

-- Disable RLS on schools to allow test data creation
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Disable RLS on teachers to allow test data creation
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE schools IS 'RLS disabled for testing. Re-enable in production.';
COMMENT ON TABLE teachers IS 'RLS disabled for testing. Re-enable in production.';
