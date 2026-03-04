/**
 * React Context Types for Authentication
 * Defines the shape of the authentication context for React applications
 */

import type { User, Session, SupabaseClient } from '@tripslip/database';
import type {
  SignUpParams,
  RoleAssignment,
  ActiveRoleContext,
  UserRole,
  OrganizationType,
} from './types';

/**
 * Authentication context type for React Context API
 * Provides authentication state and actions to React components
 */
export interface AuthContextType {
  // =====================================================
  // State
  // =====================================================
  
  /**
   * Current authenticated user or null if not authenticated
   */
  user: User | null;
  
  /**
   * Current session or null if not authenticated
   */
  session: Session | null;
  
  /**
   * Loading state for authentication operations
   */
  loading: boolean;
  
  /**
   * Active role context for the current user
   */
  activeRole: ActiveRoleContext | null;
  
  /**
   * All role assignments for the current user
   */
  roleAssignments: RoleAssignment[];
  
  // =====================================================
  // Actions
  // =====================================================
  
  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   */
  signIn: (email: string, password: string) => Promise<void>;
  
  /**
   * Sign up a new user
   * @param params - Signup parameters
   */
  signUp: (params: SignUpParams) => Promise<void>;
  
  /**
   * Sign out the current user
   */
  signOut: () => Promise<void>;
  
  /**
   * Switch to a different role
   * @param roleAssignmentId - ID of the role assignment to switch to
   */
  switchRole: (roleAssignmentId: string) => Promise<void>;
  
  // =====================================================
  // Authorization Helpers
  // =====================================================
  
  /**
   * Check if user has a specific role
   * @param role - Role to check
   * @returns True if user has the role
   */
  hasRole: (role: UserRole) => boolean;
  
  /**
   * Check if user can access an organization
   * @param orgType - Organization type
   * @param orgId - Organization ID
   * @returns True if user has access
   */
  canAccessOrganization: (orgType: OrganizationType, orgId: string) => boolean;
  
  /**
   * Whether the user is authenticated
   */
  isAuthenticated: boolean;
  
  /**
   * Whether the user's email is verified
   */
  isEmailVerified: boolean;

  /**
   * The Supabase client instance used by this auth context
   */
  supabaseClient: SupabaseClient;
}
