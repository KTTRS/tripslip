-- Migration: Fix RBAC policies for signup and login flows
-- Adds a SECURITY DEFINER function for role assignment during signup
-- Adds INSERT/UPDATE/DELETE policies for user_role_assignments and active_role_context

-- =====================================================
-- SECURITY DEFINER function for signup role assignment
-- This bypasses RLS so newly created users can get their initial role
-- =====================================================

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
  v_allowed_signup_roles TEXT[] := ARRAY['teacher', 'parent', 'venue_admin'];
BEGIN
  IF NOT (p_role_name = ANY(v_allowed_signup_roles)) THEN
    RAISE EXCEPTION 'Cannot self-assign role: %. Only teacher, parent, and venue_admin roles are allowed during signup.', p_role_name;
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

-- =====================================================
-- SECURITY DEFINER function for creating teacher record during signup
-- =====================================================

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_user_id_unique ON teachers(user_id);

CREATE OR REPLACE FUNCTION public.create_teacher_on_signup(
  p_user_id UUID,
  p_school_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id UUID;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only create teacher record for yourself';
  END IF;

  INSERT INTO teachers (user_id, school_id, first_name, last_name, email, is_active)
  VALUES (p_user_id, p_school_id, p_first_name, p_last_name, p_email, true)
  ON CONFLICT (user_id) DO UPDATE SET
    school_id = EXCLUDED.school_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email
  RETURNING id INTO v_teacher_id;

  RETURN json_build_object('teacher_id', v_teacher_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_teacher_on_signup(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- =====================================================
-- active_role_context policies (INSERT/UPDATE/DELETE)
-- Users can manage their own active role context
-- =====================================================

DROP POLICY IF EXISTS "active_role_context_insert_policy" ON active_role_context;
CREATE POLICY "active_role_context_insert_policy" ON active_role_context
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "active_role_context_update_policy" ON active_role_context;
CREATE POLICY "active_role_context_update_policy" ON active_role_context
FOR UPDATE USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "active_role_context_delete_policy" ON active_role_context;
CREATE POLICY "active_role_context_delete_policy" ON active_role_context
FOR DELETE USING (
  user_id = auth.uid()
);

-- =====================================================
-- user_role_assignments: users can read their own, admins manage all
-- INSERT is handled via the assign_user_role function (SECURITY DEFINER)
-- But we add a SELECT policy update for joined queries
-- =====================================================

DROP POLICY IF EXISTS "user_role_assignments_update_policy" ON user_role_assignments;
CREATE POLICY "user_role_assignments_update_policy" ON user_role_assignments
FOR UPDATE USING (
  public.is_tripslip_admin()
);

DROP POLICY IF EXISTS "user_role_assignments_delete_policy" ON user_role_assignments;
CREATE POLICY "user_role_assignments_delete_policy" ON user_role_assignments
FOR DELETE USING (
  public.is_tripslip_admin()
);

-- =====================================================
-- Schools: allow public read access for signup school selector
-- School names/IDs are not sensitive - needed for signup form
-- =====================================================

DROP POLICY IF EXISTS "schools_public_read_policy" ON schools;
CREATE POLICY "schools_public_read_policy" ON schools
FOR SELECT USING (true);

-- =====================================================
-- Venues: allow public read of claimed venues for signup
-- =====================================================

DROP POLICY IF EXISTS "venues_public_read_policy" ON venues;
CREATE POLICY "venues_public_read_policy" ON venues
FOR SELECT USING (claimed = true);

-- =====================================================
-- Function to list schools for signup (no auth required)
-- =====================================================

CREATE OR REPLACE FUNCTION public.list_schools_for_signup()
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, name FROM schools ORDER BY name;
$$;

GRANT EXECUTE ON FUNCTION public.list_schools_for_signup() TO anon;
GRANT EXECUTE ON FUNCTION public.list_schools_for_signup() TO authenticated;

COMMENT ON FUNCTION public.assign_user_role IS 'Assigns a role to a user during signup. Uses SECURITY DEFINER to bypass RLS. Restricts admin role self-assignment.';
COMMENT ON FUNCTION public.create_teacher_on_signup IS 'Creates a teacher record during signup. Uses SECURITY DEFINER to bypass RLS. Only allows creating record for authenticated user.';
COMMENT ON FUNCTION public.list_schools_for_signup IS 'Lists schools for signup form. Public access.';
