/**
 * Role Assignment Validation Service
 * Validates role assignments to prevent security issues
 */

import type { SupabaseClient } from '@tripslip/database';
import type { UserRole, OrganizationType } from './types';

export interface RoleAssignmentValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface RoleAssignmentValidationResult {
  valid: boolean;
  errors: RoleAssignmentValidationError[];
}

export interface RoleAssignmentValidator {
  /**
   * Validate a role assignment before creating or updating
   */
  validateRoleAssignment(params: {
    userId: string;
    roleName: UserRole;
    organizationType: OrganizationType;
    organizationId: string;
    requestingUserId: string;
  }): Promise<RoleAssignmentValidationResult>;
}

/**
 * Implementation of RoleAssignmentValidator
 */
export class SupabaseRoleAssignmentValidator implements RoleAssignmentValidator {
  constructor(private supabase: SupabaseClient) {}

  async validateRoleAssignment(params: {
    userId: string;
    roleName: UserRole;
    organizationType: OrganizationType;
    organizationId: string;
    requestingUserId: string;
  }): Promise<RoleAssignmentValidationResult> {
    const { userId, roleName, organizationType, organizationId, requestingUserId } = params;
    const errors: RoleAssignmentValidationError[] = [];

    // Validation 1: Prevent self-role-modification
    if (userId === requestingUserId) {
      errors.push({
        code: 'SELF_ROLE_MODIFICATION',
        message: 'Users cannot modify their own role assignments',
        field: 'userId',
      });
    }

    // Validation 2: Validate role exists in user_roles table
    const roleValidation = await this.validateRoleExists(roleName);
    if (!roleValidation.valid) {
      errors.push(...roleValidation.errors);
    }

    // Validation 3: Validate organization exists and matches type
    const orgValidation = await this.validateOrganization(organizationType, organizationId);
    if (!orgValidation.valid) {
      errors.push(...orgValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate that the role exists in the user_roles table
   */
  private async validateRoleExists(roleName: UserRole): Promise<RoleAssignmentValidationResult> {
    const { data, error } = await (this.supabase as any)
      .from('user_roles')
      .select('id, name')
      .eq('name', roleName)
      .single();

    if (error || !data) {
      return {
        valid: false,
        errors: [
          {
            code: 'INVALID_ROLE',
            message: `Role '${roleName}' does not exist in the system`,
            field: 'roleName',
          },
        ],
      };
    }

    return {
      valid: true,
      errors: [],
    };
  }

  /**
   * Validate that the organization exists and matches the expected type
   */
  private async validateOrganization(
    organizationType: OrganizationType,
    organizationId: string
  ): Promise<RoleAssignmentValidationResult> {
    // Platform type doesn't need validation (it's a special case)
    if (organizationType === 'platform') {
      return {
        valid: true,
        errors: [],
      };
    }

    // Determine which table to check based on organization type
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
          errors: [
            {
              code: 'INVALID_ORGANIZATION_TYPE',
              message: `Invalid organization type: ${organizationType}`,
              field: 'organizationType',
            },
          ],
        };
    }

    // Check if organization exists
    const { data, error } = await (this.supabase as any)
      .from(tableName)
      .select('id')
      .eq('id', organizationId)
      .single();

    if (error || !data) {
      return {
        valid: false,
        errors: [
          {
            code: 'ORGANIZATION_NOT_FOUND',
            message: `${organizationType} with ID '${organizationId}' does not exist`,
            field: 'organizationId',
          },
        ],
      };
    }

    return {
      valid: true,
      errors: [],
    };
  }
}

/**
 * Factory function to create a RoleAssignmentValidator instance
 */
export function createRoleAssignmentValidator(
  supabase: SupabaseClient
): RoleAssignmentValidator {
  return new SupabaseRoleAssignmentValidator(supabase);
}
