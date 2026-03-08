/**
 * RBAC Authentication Service Implementation
 * Implements role-based access control on top of Supabase Auth
 */

import type { SupabaseClient, Session } from '@tripslip/database';
import type { RBACAuthService } from './rbac-service';
import type {
  SignUpParams,
  SignUpResult,
  SignInResult,
  RoleAssignment,
  ActiveRoleContext,
  UserRole,
  OrganizationType,
} from './types';
import { createAuditService } from './audit-service';
import { createRoleAssignmentValidator } from './role-assignment-validator';
import { validateEmail, validatePassword } from './validation';
import { AuthError, handleSupabaseError } from './errors';

/**
 * Implementation of RBACAuthService using Supabase
 */
export class SupabaseRBACAuthService implements RBACAuthService {
  private auditService;
  private roleValidator;

  constructor(private supabase: SupabaseClient) {
    this.auditService = createAuditService(supabase);
    this.roleValidator = createRoleAssignmentValidator(supabase);
  }

  // =====================================================
  // Authentication Methods
  // =====================================================

  async signUp(params: SignUpParams): Promise<SignUpResult> {
    const { email, password, role, organization_type, organization_id, metadata } = params;

    // Validate email and password
    validateEmail(email);
    validatePassword(password);

    // Validate role exists
    const { data: roleData, error: roleError } = await (this.supabase as any)
      .from('user_roles')
      .select('id')
      .eq('name', role)
      .single();

    if (roleError || !roleData) {
      throw new Error(`Invalid role: ${role}`);
    }

    // Validate organization exists and matches type (except for platform type)
    if (organization_type !== 'platform') {
      const orgValidation = await this.validateOrganizationExists(
        organization_type,
        organization_id
      );
      if (!orgValidation.valid) {
        throw new Error(orgValidation.errors[0]?.message || 'Invalid organization');
      }
    }

    // Create user account with Supabase Auth
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw handleSupabaseError(error);
    if (!data.user) {
      throw new AuthError('Sign up failed: no user returned', 'SIGNUP_FAILED', 500);
    }

    const adminRoles = ['school_admin', 'district_admin'];
    if (adminRoles.includes(role)) {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new AuthError('No session token available for admin role assignment', 'SIGNUP_FAILED', 500);
      }
      const response = await fetch('/api/assign-admin-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          role,
          organizationType: organization_type,
          organizationId: organization_id,
          authToken: accessToken,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(`Failed to assign role: ${result.error}`);
      }
    } else {
      const { error: assignmentError } = await (this.supabase as any)
        .rpc('assign_user_role', {
          p_user_id: data.user.id,
          p_role_name: role,
          p_organization_type: organization_type,
          p_organization_id: organization_id,
        });

      if (assignmentError) {
        throw new Error(`Failed to assign role: ${assignmentError.message}`);
      }
    }

    // Log role assignment for audit trail (only for TripSlip admin actions)
    // Note: During signup, the user is assigning themselves a role, so we only log if it's an admin role
    if (role === 'tripslip_admin' || role === 'district_admin' || role === 'school_admin') {
      try {
        await this.auditService.logRoleAssignment(
          data.user.id,
          data.user.id,
          role,
          organization_type,
          organization_id
        );
      } catch (auditError) {
        // Don't fail signup if audit logging fails
        console.error('Failed to log role assignment:', auditError);
      }
    }

    return {
      user: data.user,
      session: data.session,
      requiresEmailVerification: !data.user.email_confirmed_at,
    };
  }

  async signIn(email: string, password: string): Promise<SignInResult> {
    // Authenticate with Supabase Auth
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw handleSupabaseError(error);
    if (!data.user || !data.session) {
      throw new AuthError('Authentication failed', 'AUTH_FAILED', 401);
    }

    let roleAssignments: RoleAssignment[] = [];
    let activeRole: ActiveRoleContext | null = null;

    try {
      roleAssignments = await this.getRoleAssignments(data.user.id);

      if (roleAssignments.length > 0) {
        activeRole = await this.getActiveRoleContext(data.user.id);

        if (!activeRole) {
          const firstAssignment = roleAssignments[0];
          await this.setActiveRoleContext(data.user.id, firstAssignment.id);
          activeRole = {
            user_id: data.user.id,
            active_role_assignment_id: firstAssignment.id,
            role_name: firstAssignment.role_name,
            organization_type: firstAssignment.organization_type,
            organization_id: firstAssignment.organization_id,
            organization_name: firstAssignment.organization_name,
          };
        }

        await this.updateJWTClaims(data.user.id, activeRole);
      }
    } catch (roleError) {
      console.warn('Role loading skipped:', roleError);
    }

    if (!activeRole) {
      activeRole = {
        user_id: data.user.id,
        active_role_assignment_id: 'default',
        role_name: 'teacher',
        organization_type: 'school',
        organization_id: 'default',
      };
    }

    return {
      user: data.user,
      session: data.session,
      roleAssignments,
      activeRole,
    };
  }

  /**
   * Helper method to set active role context
   */
  private async setActiveRoleContext(userId: string, roleAssignmentId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('active_role_context')
      .upsert({
        user_id: userId,
        active_role_assignment_id: roleAssignmentId,
      });

    if (error) {
      throw new Error(`Failed to set active role context: ${error.message}`);
    }
  }

  /**
   * Helper method to update JWT claims with role information
   * Calls a database function to update the user's app_metadata
   * which will be included in JWT claims on next session refresh
   */
  private async updateJWTClaims(userId: string, activeRole: ActiveRoleContext): Promise<void> {
    try {
      const result = await (this.supabase as any).rpc('update_user_role_claims', {
        p_user_id: userId,
        p_role: activeRole.role_name,
        p_organization_type: activeRole.organization_type,
        p_organization_id: activeRole.organization_id
      });

      if (result && result.error) {
        console.error('Failed to update JWT claims:', result.error);
      }
    } catch (error) {
      console.error('Error updating JWT claims:', error);
    }
  }

  async signOut(): Promise<void> {
    // Sign out with Supabase Auth (invalidates session)
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;

    // Clear client-side storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tripslip_session');
      sessionStorage.clear();
    }
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw handleSupabaseError(error);
  }

  async updatePassword(newPassword: string): Promise<void> {
      // Validate password
      validatePassword(newPassword);

      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw handleSupabaseError(error);
    }

  async verifyEmail(token: string): Promise<void> {
    const { error } = await this.supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) throw handleSupabaseError(error);
  }

  async resendVerificationEmail(): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new AuthError('No authenticated user', 'NO_USER', 401);
    }

    const { error } = await this.supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    });

    if (error) throw handleSupabaseError(error);
  }

  // =====================================================
  // Session Management
  // =====================================================

  async getSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw handleSupabaseError(error);
    return data.session;
  }

  async refreshSession(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.refreshSession();
    if (error) throw handleSupabaseError(error);
    return data.session;
  }

  // =====================================================
  // Role Management
  // =====================================================

  async getRoleAssignments(userId: string): Promise<RoleAssignment[]> {
    const { data, error } = await (this.supabase as any)
      .from('user_role_assignments')
      .select(`
        id,
        user_id,
        role_id,
        organization_type,
        organization_id,
        is_active,
        created_at,
        updated_at,
        user_roles!inner(name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to load role assignments: ${error.message}`);
    }

    return (data || []).map((assignment: any) => ({
      id: assignment.id,
      user_id: assignment.user_id,
      role_id: assignment.role_id,
      role_name: assignment.user_roles.name,
      organization_type: assignment.organization_type,
      organization_id: assignment.organization_id,
      is_active: assignment.is_active,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
    }));
  }

  async getActiveRoleContext(userId: string): Promise<ActiveRoleContext | null> {
    const { data, error } = await (this.supabase as any)
      .from('active_role_context')
      .select(`
        user_id,
        active_role_assignment_id,
        user_role_assignments!inner(
          id,
          organization_type,
          organization_id,
          user_roles!inner(name)
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active role context found
        return null;
      }
      throw new Error(`Failed to load active role context: ${error.message}`);
    }

    if (!data) return null;

    const assignment = data.user_role_assignments;
    return {
      user_id: data.user_id,
      active_role_assignment_id: data.active_role_assignment_id,
      role_name: assignment.user_roles.name,
      organization_type: assignment.organization_type,
      organization_id: assignment.organization_id,
    };
  }

  async switchRole(roleAssignmentId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Get current active role before switching
    const currentRole = await this.getActiveRoleContext(user.id);

    // Verify the role assignment belongs to the user
    const { data: assignment, error: assignmentError } = await (this.supabase as any)
      .from('user_role_assignments')
      .select(`
        *,
        user_roles!inner(name)
      `)
      .eq('id', roleAssignmentId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (assignmentError || !assignment) {
      throw new Error('Invalid role assignment');
    }

    // Update active role context in database (persists across sessions)
    await this.setActiveRoleContext(user.id, roleAssignmentId);

    // Build new active role context
    const newActiveRole: ActiveRoleContext = {
      user_id: user.id,
      active_role_assignment_id: roleAssignmentId,
      role_name: assignment.user_roles.name,
      organization_type: assignment.organization_type,
      organization_id: assignment.organization_id,
      organization_name: assignment.organization_name,
    };

    // Update JWT claims with new role information
    await this.updateJWTClaims(user.id, newActiveRole);

    // Log role switch for audit trail
    try {
      await this.auditService.logRoleSwitch(
        user.id,
        currentRole?.role_name || 'none',
        assignment.user_roles.name,
        assignment.organization_type,
        assignment.organization_id
      );
    } catch (auditError) {
      // Don't fail role switch if audit logging fails
      console.error('Failed to log role switch:', auditError);
    }
  }

  // =====================================================
  // Authorization Checks
  // =====================================================

  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const assignments = await this.getRoleAssignments(userId);
    return assignments.some(assignment => assignment.role_name === role);
  }

  async canAccessOrganization(
    userId: string,
    orgType: OrganizationType,
    orgId: string
  ): Promise<boolean> {
    const assignments = await this.getRoleAssignments(userId);
    
    // TripSlip admins can access everything
    if (assignments.some(a => a.role_name === 'tripslip_admin')) {
      return true;
    }

    // Check for direct organization access
    const hasDirectAccess = assignments.some(
      a => a.organization_type === orgType && a.organization_id === orgId
    );

    if (hasDirectAccess) {
      return true;
    }

    // Check for district admin access to schools
    if (orgType === 'school') {
      const districtAdminAssignments = assignments.filter(
        a => a.role_name === 'district_admin'
      );

      for (const assignment of districtAdminAssignments) {
        // Check if school belongs to district
        const { data, error } = await (this.supabase as any)
          .from('school_districts')
          .select('id')
          .eq('school_id', orgId)
          .eq('district_id', assignment.organization_id)
          .single();

        if (!error && data) {
          return true;
        }
      }
    }

    return false;
  }

  // =====================================================
  // Role Assignment Management (Admin Operations)
  // =====================================================

  /**
   * Assign a role to a user (admin operation)
   * This method includes full validation and prevents self-role-modification
   */
  async assignRole(params: {
    userId: string;
    roleName: UserRole;
    organizationType: OrganizationType;
    organizationId: string;
  }): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Validate the role assignment
    const validation = await this.roleValidator.validateRoleAssignment({
      userId: params.userId,
      roleName: params.roleName,
      organizationType: params.organizationType,
      organizationId: params.organizationId,
      requestingUserId: user.id,
    });

    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => e.message).join('; ');
      throw new Error(`Role assignment validation failed: ${errorMessages}`);
    }

    // Get role ID from role name
    const { data: roleData, error: roleError } = await (this.supabase as any)
      .from('user_roles')
      .select('id')
      .eq('name', params.roleName)
      .single();

    if (roleError || !roleData) {
      throw new Error(`Invalid role: ${params.roleName}`);
    }

    // Create role assignment
    const { error: assignmentError } = await (this.supabase as any)
      .from('user_role_assignments')
      .insert({
        user_id: params.userId,
        role_id: roleData.id,
        organization_type: params.organizationType,
        organization_id: params.organizationId,
        is_active: true,
      });

    if (assignmentError) {
      throw new Error(`Failed to assign role: ${assignmentError.message}`);
    }

    // Log role assignment for audit trail
    try {
      await this.auditService.logRoleAssignment(
        user.id,
        params.userId,
        params.roleName,
        params.organizationType,
        params.organizationId
      );
    } catch (auditError) {
      // Don't fail role assignment if audit logging fails
      console.error('Failed to log role assignment:', auditError);
    }
  }

  /**
   * Update a role assignment (admin operation)
   */
  async updateRoleAssignment(params: {
    roleAssignmentId: string;
    isActive: boolean;
  }): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Get the role assignment to check if it's a self-modification attempt
    const { data: assignment, error: fetchError } = await (this.supabase as any)
      .from('user_role_assignments')
      .select('user_id')
      .eq('id', params.roleAssignmentId)
      .single();

    if (fetchError || !assignment) {
      throw new Error('Role assignment not found');
    }

    // Prevent self-role-modification
    if (assignment.user_id === user.id) {
      throw new Error('Users cannot modify their own role assignments');
    }

    // Update the role assignment
    const { error: updateError } = await (this.supabase as any)
      .from('user_role_assignments')
      .update({
        is_active: params.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.roleAssignmentId);

    if (updateError) {
      throw new Error(`Failed to update role assignment: ${updateError.message}`);
    }

    // Log the update for audit trail
    try {
      await this.auditService.logAction({
        user_id: user.id,
        action: 'update_role_assignment',
        table_name: 'user_role_assignments',
        record_id: params.roleAssignmentId,
        metadata: {
          is_active: params.isActive,
        },
      });
    } catch (auditError) {
      // Don't fail update if audit logging fails
      console.error('Failed to log role assignment update:', auditError);
    }
  }

  /**
   * Helper method to validate organization exists
   */
  private async validateOrganizationExists(
    organizationType: OrganizationType,
    organizationId: string
  ): Promise<{ valid: boolean; errors: Array<{ message: string }> }> {
    if (organizationType === 'platform') {
      return { valid: true, errors: [] };
    }

    let tableName: string;
    switch (organizationType) {
      case 'school':
        tableName = 'schools';
        break;
      case 'district':
        tableName = 'districts';
        break;
      case 'venue':
        tableName = 'venues';
        break;
      default:
        return {
          valid: false,
          errors: [{ message: `Invalid organization type: ${organizationType}` }],
        };
    }

    const { data, error } = await (this.supabase as any)
      .from(tableName)
      .select('id')
      .eq('id', organizationId)
      .single();

    if (error || !data) {
      return {
        valid: false,
        errors: [{ message: `${organizationType} with ID '${organizationId}' does not exist` }],
      };
    }

    return { valid: true, errors: [] };
  }
}

/**
 * Factory function to create an RBACAuthService instance
 */
export function createRBACAuthService(supabase: SupabaseClient): RBACAuthService {
  return new SupabaseRBACAuthService(supabase);
}
