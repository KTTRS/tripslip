-- Migration: Add last_login_at tracking to teachers table
-- Description: Track when teachers last logged in for activity monitoring

-- Add last_login_at column to teachers table
ALTER TABLE teachers 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_teachers_last_login 
ON teachers(last_login_at);

-- Add comment for documentation
COMMENT ON COLUMN teachers.last_login_at IS 'Timestamp of the teacher''s last successful login';
