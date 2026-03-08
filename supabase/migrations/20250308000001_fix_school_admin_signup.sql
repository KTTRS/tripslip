-- Migration: Fix assign_user_role to allow school_admin and district_admin signup
-- Previously only teacher, parent, and venue_admin were allowed.
-- School admin signup was broken because the RPC would reject the role.

CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_user_id UUID,
  p_role_name TEXT,
  p_organization_type TEXT,
  p_organization_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
  v_assignment_id UUID;
  v_allowed_signup_roles TEXT[] := ARRAY['teacher', 'parent', 'venue_admin', 'school_admin', 'district_admin'];
BEGIN
  IF NOT (p_role_name = ANY(v_allowed_signup_roles)) THEN
    RAISE EXCEPTION 'Cannot self-assign role: %. Only teacher, parent, venue_admin, school_admin, and district_admin roles are allowed during signup.', p_role_name;
  END IF;

  SELECT id INTO v_role_id FROM user_roles WHERE name = p_role_name;
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Invalid role: %', p_role_name;
  END IF;

  INSERT INTO user_role_assignments (user_id, role_id, organization_type, organization_id, is_active)
  VALUES (p_user_id, v_role_id, p_organization_type, p_organization_id, true)
  ON CONFLICT (user_id, role_id, organization_type, organization_id) DO UPDATE SET is_active = true
  RETURNING id INTO v_assignment_id;

  RETURN json_build_object('assignment_id', v_assignment_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.assign_user_role IS 'Assigns a role to a user during signup. Uses SECURITY DEFINER to bypass RLS. Only tripslip_admin role cannot be self-assigned.';
