-- Migration: Create RLS Helper Functions
-- These functions extract role and organization information from JWT claims
-- to be used in Row-Level Security policies

-- Get user's active role name from JWT claims
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'anonymous'
  );
$$ LANGUAGE SQL STABLE;

-- Get user's active organization ID from JWT claims
CREATE OR REPLACE FUNCTION public.user_organization_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'organization_id')::uuid,
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- Get user's active organization type from JWT claims
CREATE OR REPLACE FUNCTION public.user_organization_type()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'organization_type',
    NULL
  );
$$ LANGUAGE SQL STABLE;

-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT public.user_role() = required_role;
$$ LANGUAGE SQL STABLE;

-- Check if user is TripSlip admin
CREATE OR REPLACE FUNCTION public.is_tripslip_admin()
RETURNS BOOLEAN AS $$
  SELECT public.user_role() = 'tripslip_admin';
$$ LANGUAGE SQL STABLE;

-- Add comments for documentation
COMMENT ON FUNCTION public.user_role() IS 'Returns the active role name from JWT claims';
COMMENT ON FUNCTION public.user_organization_id() IS 'Returns the active organization ID from JWT claims';
COMMENT ON FUNCTION public.user_organization_type() IS 'Returns the active organization type from JWT claims';
COMMENT ON FUNCTION public.has_role(TEXT) IS 'Checks if user has the specified role';
COMMENT ON FUNCTION public.is_tripslip_admin() IS 'Checks if user is a TripSlip platform administrator';
