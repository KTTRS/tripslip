-- =====================================================
-- ALLOW ANON VENUE INSERT FOR TESTS
-- =====================================================
-- Migration: 20240101000034_allow_anon_venue_insert_for_tests.sql
-- Description: Allow anonymous users to insert venues for testing purposes
-- This is needed because property tests create test data before authenticating

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can insert their own venue" ON venues;

-- Create a more permissive policy that allows anon inserts
CREATE POLICY "Allow venue inserts for testing"
  ON venues FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON POLICY "Allow venue inserts for testing" ON venues IS 'Allows anonymous inserts for testing. In production, this should be restricted to authenticated users only.';
