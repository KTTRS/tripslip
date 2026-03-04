/**
 * Role-Based Access Control (RBAC) Types
 * Defines types for user roles, role assignments, and organization contexts
 */

/**
 * Available user roles in the TripSlip platform
 */
export type UserRole = 
  | 'teacher' 
  | 'school_admin' 
  | 'district_admin' 
  | 'tripslip_admin' 
  | 'venue_admin' 
  | 'parent';

/**
 * Organization types that roles can be assigned to
 */
export type OrganizationType = 'school' | 'district' | 'venue' | 'platform';

/**
 * Role assignment linking a user to a role within an organization
 */
export interface RoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  role_name: UserRole;
  organization_type: OrganizationType;
  organization_id: string;
  organization_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Active role context for a user with multiple roles
 * Tracks which role the user is currently operating under
 */
export interface ActiveRoleContext {
  user_id: string;
  active_role_assignment_id: string;
  role_name: UserRole;
  organization_type: OrganizationType;
  organization_id: string;
  organization_name?: string;
}

/**
 * Parameters for user signup
 */
export interface SignUpParams {
  email: string;
  password: string;
  role: UserRole;
  organization_type: OrganizationType;
  organization_id: string;
  metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}

/**
 * Result of a signup operation
 */
export interface SignUpResult {
  user: any; // Supabase User type
  session: any | null; // Supabase Session type
  requiresEmailVerification: boolean;
}

/**
 * Result of a sign-in operation
 */
export interface SignInResult {
  user: any; // Supabase User type
  session: any; // Supabase Session type
  roleAssignments: RoleAssignment[];
  activeRole: ActiveRoleContext;
}

/**
 * JWT claims structure for role-based access control
 */
export interface JWTClaims {
  sub: string; // user_id
  email: string;
  role: string; // active role name
  app_metadata: {
    active_role_assignment_id: string;
    organization_type: string;
    organization_id: string;
  };
  aud: string;
  exp: number;
  iat: number;
}

/**
 * Organization reference for role assignment
 */
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
}

/**
 * User role definition
 */
export interface UserRoleDefinition {
  id: string;
  name: UserRole;
  description: string;
  created_at: string;
}
