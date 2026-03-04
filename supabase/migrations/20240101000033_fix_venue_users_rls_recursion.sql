-- =====================================================
-- FIX VENUE_USERS RLS INFINITE RECURSION
-- =====================================================
-- Migration: 20240101000033_fix_venue_users_rls_recursion.sql
-- Description: Fix infinite recursion in venue_users RLS policies
-- The original policies query venue_users within venue_users policies,
-- causing infinite recursion. This migration replaces them with
-- simpler policies that allow users to manage their own records.

-- Drop existing recursive policies
DROP POLICY IF EXISTS "Users can view venue_users for their venue" ON venue_users;
DROP POLICY IF EXISTS "Users can insert venue_users for their venue" ON venue_users;
DROP POLICY IF EXISTS "Users can update venue_users for their venue" ON venue_users;
DROP POLICY IF EXISTS "Users can delete venue_users for their venue" ON venue_users;

-- Create simple, non-recursive policies
-- Users can view their own venue_users records
CREATE POLICY "Users can view their own venue_users records"
  ON venue_users FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own venue_users records (for claiming/signup)
CREATE POLICY "Users can insert their own venue_users records"
  ON venue_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own venue_users records
CREATE POLICY "Users can update their own venue_users records"
  ON venue_users FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own venue_users records
CREATE POLICY "Users can delete their own venue_users records"
  ON venue_users FOR DELETE
  USING (user_id = auth.uid());

-- Add comment
COMMENT ON TABLE venue_users IS 'Fixed RLS policies to avoid infinite recursion. Users can only manage their own venue_users records. Venue-level permissions are enforced through application logic and other table policies.';

