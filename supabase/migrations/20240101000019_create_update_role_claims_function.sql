-- Migration: Create function to update user role claims
-- This function updates the user's app_metadata with role information
-- which will be included in JWT claims

-- Create function to update user role claims
-- This function can be called via RPC from the client
CREATE OR REPLACE FUNCTION public.update_user_role_claims(
  p_user_id UUID,
  p_role TEXT,
  p_organization_type TEXT,
  p_organization_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is updating their own role
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Cannot update another user''s role claims';
  END IF;

  -- Verify the role assignment exists and belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN user_roles ur ON ura.role_id = ur.id
    WHERE ura.user_id = p_user_id
      AND ur.name = p_role
      AND ura.organization_type = p_organization_type
      AND ura.organization_id = p_organization_id
      AND ura.is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid role assignment';
  END IF;

  -- Update the user's app_metadata in auth.users
  -- Note: This requires the function to have SECURITY DEFINER
  UPDATE auth.users
  SET 
    raw_app_meta_data = jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(raw_app_meta_data, '{}'::jsonb),
          '{role}',
          to_jsonb(p_role)
        ),
        '{organization_type}',
        to_jsonb(p_organization_type)
      ),
      '{organization_id}',
      to_jsonb(p_organization_id::text)
    ),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_role_claims(UUID, TEXT, TEXT, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_user_role_claims IS 'Updates user app_metadata with active role information for JWT claims. Can only be called by the user themselves.';
