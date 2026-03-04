/**
 * RBAC-Enhanced Authentication Service Interface
 * Extends the base AuthService with role-based access control capabilities
 */

import type { User, Session } from '@tripslip/database';
import type {
  SignUpParams,
  SignUpResult,
  SignInResult,
  RoleAssignment,
  ActiveRoleContext,
  UserRole,
  OrganizationType,
} from './types';

/**
 * Enhanced authentication service with RBAC support
 */
export interface RBACAuthService {
  // =====================================================
  // Authentication Methods
  // =====================================================
  
  /**
   * Sign up a new user with role assignment
   * @param params - Signup parameters including role and organization
   * @returns SignUpResult with user, session, and verification status
   */
  signUp(params: SignUpParams): Promise<SignUpResult>;
  
  /**
   * Sign in with email and password
   * @param email - User email
   * @param password - User password
   * @returns SignInResult with user, session, role assignments, and active role
   */
  signIn(email: string, password: string): Promise<SignInResult>;
  
  /**
   * Sign out the current user
   */
  signOut(): Promise<void>;
  
  /**
   * Request password reset email
   * @param email - User email
   */
  resetPassword(email: string): Promise<void>;
  
  /**
   * Update user password
   * @param newPassword - New password
   */
  updatePassword(newPassword: string): Promise<void>;
  
  /**
   * Verify email with token
   * @param token - Email verification token
   */
  verifyEmail(token: string): Promise<void>;
  
  /**
   * Resend email verification
   */
  resendVerificationEmail(): Promise<void>;
  
  // =====================================================
  // Session Management
  // =====================================================
  
  /**
   * Get current session
   * @returns Current session or null if not authenticated
   */
  getSession(): Promise<Session | null>;
  
  /**
   * Refresh current session
   * @returns Refreshed session
   */
  refreshSession(): Promise<Session | null>;
  
  // =====================================================
  // Role Management
  // =====================================================
  
  /**
   * Get all role assignments for a user
   * @param userId - User ID
   * @returns Array of role assignments
   */
  getRoleAssignments(userId: string): Promise<RoleAssignment[]>;
  
  /**
   * Get active role context for a user
   * @param userId - User ID
   * @returns Active role context or null if not set
   */
  getActiveRoleContext(userId: string): Promise<ActiveRoleContext | null>;
  
  /**
   * Switch to a different role
   * @param roleAssignmentId - ID of the role assignment to switch to
   */
  switchRole(roleAssignmentId: string): Promise<void>;
  
  // =====================================================
  // Authorization Checks
  // =====================================================
  
  /**
   * Check if user has a specific role
   * @param userId - User ID
   * @param role - Role to check
   * @returns True if user has the role
   */
  hasRole(userId: string, role: UserRole): Promise<boolean>;
  
  /**
   * Check if user can access an organization
   * @param userId - User ID
   * @param orgType - Organization type
   * @param orgId - Organization ID
   * @returns True if user has access
   */
  canAccessOrganization(
    userId: string,
    orgType: OrganizationType,
    orgId: string
  ): Promise<boolean>;

  // =====================================================
  // Role Assignment Management (Admin Operations)
  // =====================================================

  /**
   * Assign a role to a user (admin operation)
   * Includes validation to prevent self-role-modification and ensure valid role/organization
   * @param params - Role assignment parameters
   */
  assignRole(params: {
    userId: string;
    roleName: UserRole;
    organizationType: OrganizationType;
    organizationId: string;
  }): Promise<void>;

  /**
   * Update a role assignment (admin operation)
   * Includes validation to prevent self-role-modification
   * @param params - Update parameters
   */
  updateRoleAssignment(params: {
    roleAssignmentId: string;
    isActive: boolean;
  }): Promise<void>;
}
