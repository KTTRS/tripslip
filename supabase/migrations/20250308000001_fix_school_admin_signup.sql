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
AS $func$
DECLARE
  v_role_id UUID;
  v_assignment_id UUID;
  v_existing_count INT;
  v_allowed_signup_roles TEXT[] := ARRAY['teacher', 'parent', 'venue_admin', 'school_admin', 'district_admin'];
BEGIN
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Cannot assign roles to other users';
  END IF;

  IF NOT (p_role_name = ANY(v_allowed_signup_roles)) THEN
    RAISE EXCEPTION 'Cannot self-assign role: %. Only teacher, parent, venue_admin, school_admin, and district_admin roles are allowed during signup.', p_role_name;
  END IF;

  IF (p_role_name = 'teacher' AND p_organization_type <> 'school')
    OR (p_role_name = 'parent' AND p_organization_type <> 'platform')
    OR (p_role_name = 'venue_admin' AND p_organization_type <> 'venue')
    OR (p_role_name = 'school_admin' AND p_organization_type <> 'school')
    OR (p_role_name = 'district_admin' AND p_organization_type <> 'district')
  THEN
    RAISE EXCEPTION 'Invalid organization type % for role %', p_organization_type, p_role_name;
  END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM user_role_assignments
  WHERE user_id = p_user_id AND is_active = true;
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'User already has an active role assignment. Role can only be assigned during initial signup.';
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
$func$;

GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT, UUID) TO authenticated;
