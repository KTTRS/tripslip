-- Migration: Create RBAC Schema for Authentication and Access Control
-- This migration creates the role-based access control system including:
-- - user_roles table for role definitions
-- - user_role_assignments table for assigning roles to users
-- - active_role_context table for tracking user's current role
-- - districts table for district management
-- - school_districts junction table for many-to-many relationship
-- - Updates to venues table for unclaimed listings

-- Create districts table
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address JSONB,
  contact_email TEXT,
  contact_phone TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (name IN ('teacher', 'school_admin', 'district_admin', 'tripslip_admin', 'venue_admin', 'parent'))
);

-- Insert default roles
INSERT INTO user_roles (name, description) VALUES
  ('teacher', 'Teacher with access to create trips and manage students within their school'),
  ('school_admin', 'School administrator with access to all data for their specific school'),
  ('district_admin', 'District administrator with access to all schools in their district'),
  ('tripslip_admin', 'Platform administrator with access to all data across all districts and schools'),
  ('venue_admin', 'Venue administrator with access to manage their venue''s experiences and bookings'),
  ('parent', 'Parent with access to view their children''s permission slips')
ON CONFLICT (name) DO NOTHING;

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
  organization_type TEXT NOT NULL,
  organization_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id, organization_type, organization_id),
  CHECK (organization_type IN ('school', 'district', 'venue', 'platform'))
);

-- Create active_role_context table
CREATE TABLE IF NOT EXISTS active_role_context (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_role_assignment_id UUID NOT NULL REFERENCES user_role_assignments(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create school_districts junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS school_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(school_id, district_id)
);

-- Add claimed status to venues table
ALTER TABLE venues ADD COLUMN IF NOT EXISTS claimed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_organization ON user_role_assignments(organization_type, organization_id);
CREATE INDEX IF NOT EXISTS idx_active_role_context_user_id ON active_role_context(user_id);
CREATE INDEX IF NOT EXISTS idx_school_districts_school_id ON school_districts(school_id);
CREATE INDEX IF NOT EXISTS idx_school_districts_district_id ON school_districts(district_id);
CREATE INDEX IF NOT EXISTS idx_districts_code ON districts(code);
CREATE INDEX IF NOT EXISTS idx_venues_claimed ON venues(claimed);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_districts_updated_at ON districts;
CREATE TRIGGER update_districts_updated_at
  BEFORE UPDATE ON districts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_role_assignments_updated_at ON user_role_assignments;
CREATE TRIGGER update_user_role_assignments_updated_at
  BEFORE UPDATE ON user_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_active_role_context_updated_at ON active_role_context;
CREATE TRIGGER update_active_role_context_updated_at
  BEFORE UPDATE ON active_role_context
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE districts IS 'Districts that contain multiple schools';
COMMENT ON TABLE user_roles IS 'Available user roles in the system';
COMMENT ON TABLE user_role_assignments IS 'Assigns roles to users with organization context';
COMMENT ON TABLE active_role_context IS 'Tracks the currently active role for users with multiple roles';
COMMENT ON TABLE school_districts IS 'Many-to-many relationship between schools and districts';
COMMENT ON COLUMN venues.claimed IS 'Whether this venue has been claimed by a venue admin';
COMMENT ON COLUMN venues.claimed_by IS 'User ID of the venue admin who claimed this venue';
COMMENT ON COLUMN venues.claimed_at IS 'Timestamp when the venue was claimed';
