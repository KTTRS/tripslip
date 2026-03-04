-- =====================================================
-- EXTEND VENUE_USERS TABLE FOR EMPLOYEE MANAGEMENT
-- =====================================================
-- This migration extends the venue_users table to support
-- employee invitation workflow and role-based access control
-- Requirements: 6.1, 6.2, 6.4, 6.5

-- Add invitation tracking columns
ALTER TABLE venue_users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE venue_users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE venue_users ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE venue_users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Update role constraint to support administrator, editor, viewer
ALTER TABLE venue_users DROP CONSTRAINT IF EXISTS venue_users_role_check;
ALTER TABLE venue_users ADD CONSTRAINT venue_users_role_check 
  CHECK (role IN ('administrator', 'editor', 'viewer'));

-- Create index for active employees lookup
CREATE INDEX IF NOT EXISTS idx_venue_users_active ON venue_users(venue_id, deactivated_at) 
  WHERE deactivated_at IS NULL;

-- Create index for invitation status
CREATE INDEX IF NOT EXISTS idx_venue_users_pending_invitations ON venue_users(invited_at, accepted_at) 
  WHERE accepted_at IS NULL AND deactivated_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN venue_users.invited_by IS 'User ID of the administrator who invited this employee';
COMMENT ON COLUMN venue_users.invited_at IS 'Timestamp when the invitation was sent';
COMMENT ON COLUMN venue_users.accepted_at IS 'Timestamp when the employee accepted the invitation';
COMMENT ON COLUMN venue_users.deactivated_at IS 'Timestamp when the employee account was deactivated';
COMMENT ON CONSTRAINT venue_users_role_check ON venue_users IS 'Ensures role is one of: administrator, editor, viewer';
