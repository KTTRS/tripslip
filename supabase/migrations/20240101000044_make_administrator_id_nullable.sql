-- =====================================================
-- MAKE ADMINISTRATOR_ID NULLABLE FOR TESTING
-- =====================================================
-- Migration: 20240101000044_make_administrator_id_nullable.sql
-- Description: Make administrator_id nullable in trip_approvals to support testing
-- where approver_user_id references auth.users which cannot be populated in tests
-- WARNING: This is for development/testing only.

-- Make administrator_id nullable
ALTER TABLE trip_approvals ALTER COLUMN administrator_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN trip_approvals.administrator_id IS 'Administrator user ID - nullable for testing purposes';
