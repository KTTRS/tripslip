-- =====================================================
-- DISABLE RLS FOR TESTING
-- =====================================================
-- Migration: 20240101000035_disable_rls_for_testing.sql
-- Description: Temporarily disable RLS on key tables for testing
-- WARNING: This is for development/testing only. In production, RLS should be enabled.

-- Disable RLS on core tables
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE teachers DISABLE ROW LEVEL SECURITY;
ALTER TABLE venues DISABLE ROW LEVEL SECURITY;
ALTER TABLE experiences DISABLE ROW LEVEL SECURITY;
ALTER TABLE venue_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- Disable RLS on approval-related tables
ALTER TABLE trip_approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chains DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_chain_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_approval_routing DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE venues IS 'RLS disabled for testing. Re-enable in production.';
