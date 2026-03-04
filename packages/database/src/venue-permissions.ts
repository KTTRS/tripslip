/**
 * Venue Permission Utilities
 * 
 * Provides helper functions for checking venue employee permissions
 * in application code and RLS policies.
 * 
 * Requirements: 6.6, 6.7, 6.8, 6.9
 */

import type { VenueRole } from './venue-employee-service';
import { ROLE_PERMISSIONS } from './venue-employee-service';

// =====================================================
// PERMISSION CONSTANTS
// =====================================================

export const VENUE_PERMISSIONS = {
  // Venue profile permissions
  VENUE_READ: 'venue.read',
  VENUE_WRITE: 'venue.write',
  VENUE_DELETE: 'venue.delete',

  // Experience permissions
  EXPERIENCE_READ: 'experience.read',
  EXPERIENCE_WRITE: 'experience.write',
  EXPERIENCE_DELETE: 'experience.delete',

  // Booking permissions
  BOOKING_READ: 'booking.read',
  BOOKING_WRITE: 'booking.write',

  // Employee management permissions
  EMPLOYEE_READ: 'employee.read',
  EMPLOYEE_WRITE: 'employee.write',
  EMPLOYEE_DELETE: 'employee.delete',

  // Analytics and financial permissions
  ANALYTICS_READ: 'analytics.read',
  FINANCIAL_READ: 'financial.read',
} as const;

export type VenuePermission = typeof VENUE_PERMISSIONS[keyof typeof VENUE_PERMISSIONS];

// =====================================================
// PERMISSION CHECKING FUNCTIONS
// =====================================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: VenueRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission as any) : false;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: VenueRole): string[] {
  return [...(ROLE_PERMISSIONS[role] || [])];
}

/**
 * Check if a role can perform an action on a resource
 */
export function canPerformAction(
  role: VenueRole,
  resource: 'venue' | 'experience' | 'booking' | 'employee' | 'analytics' | 'financial',
  action: 'read' | 'write' | 'delete'
): boolean {
  const permission = `${resource}.${action}`;
  return roleHasPermission(role, permission);
}

/**
 * Check if a role is administrator
 */
export function isAdministratorRole(role: VenueRole): boolean {
  return role === 'administrator';
}

/**
 * Check if a role can manage employees
 * Requirement 6.4, 6.5: Only administrators can manage employees
 */
export function canManageEmployees(role: VenueRole): boolean {
  return roleHasPermission(role, VENUE_PERMISSIONS.EMPLOYEE_WRITE);
}

/**
 * Check if a role can access financial data
 * Requirement 6.7: Only administrators can access financial settings
 */
export function canAccessFinancials(role: VenueRole): boolean {
  return roleHasPermission(role, VENUE_PERMISSIONS.FINANCIAL_READ);
}

/**
 * Check if a role can delete venue profile
 * Requirement 6.6: Only administrators can delete venue profile
 */
export function canDeleteVenue(role: VenueRole): boolean {
  return roleHasPermission(role, VENUE_PERMISSIONS.VENUE_DELETE);
}

/**
 * Check if a role can modify venue information
 * Requirement 6.8: Editors can modify venue information
 */
export function canModifyVenue(role: VenueRole): boolean {
  return roleHasPermission(role, VENUE_PERMISSIONS.VENUE_WRITE);
}

/**
 * Check if a role can view venue data
 * Requirement 6.9: Viewers can access venue data without modification rights
 */
export function canViewVenue(role: VenueRole): boolean {
  return roleHasPermission(role, VENUE_PERMISSIONS.VENUE_READ);
}

/**
 * Get the minimum role required for a permission
 */
export function getMinimumRoleForPermission(permission: string): VenueRole | null {
  // Check in order of least to most privileged
  if (roleHasPermission('viewer', permission)) return 'viewer';
  if (roleHasPermission('editor', permission)) return 'editor';
  if (roleHasPermission('administrator', permission)) return 'administrator';
  return null;
}

/**
 * Compare two roles to determine which has more privileges
 * Returns: -1 if role1 < role2, 0 if equal, 1 if role1 > role2
 */
export function compareRoles(role1: VenueRole, role2: VenueRole): number {
  const roleHierarchy: Record<VenueRole, number> = {
    viewer: 1,
    editor: 2,
    administrator: 3,
  };

  const level1 = roleHierarchy[role1];
  const level2 = roleHierarchy[role2];

  if (level1 < level2) return -1;
  if (level1 > level2) return 1;
  return 0;
}

/**
 * Check if role1 has at least the same privileges as role2
 */
export function hasAtLeastRole(role1: VenueRole, role2: VenueRole): boolean {
  return compareRoles(role1, role2) >= 0;
}

// =====================================================
// SQL HELPER FUNCTIONS FOR RLS POLICIES
// =====================================================

/**
 * Generate SQL condition for checking if user has permission
 * This can be used in RLS policies
 */
export function generatePermissionCheckSQL(
  userIdColumn: string,
  venueIdColumn: string,
  permission: string
): string {
  const roles: VenueRole[] = ['administrator', 'editor', 'viewer'];
  const allowedRoles = roles.filter(role => roleHasPermission(role, permission));

  if (allowedRoles.length === 0) {
    return 'FALSE'; // No role has this permission
  }

  const roleList = allowedRoles.map(r => `'${r}'`).join(', ');

  return `
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = ${venueIdColumn}
        AND venue_users.user_id = ${userIdColumn}
        AND venue_users.role IN (${roleList})
        AND venue_users.deactivated_at IS NULL
    )
  `.trim();
}

/**
 * Generate SQL condition for checking if user is administrator
 */
export function generateAdminCheckSQL(
  userIdColumn: string,
  venueIdColumn: string
): string {
  return `
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = ${venueIdColumn}
        AND venue_users.user_id = ${userIdColumn}
        AND venue_users.role = 'administrator'
        AND venue_users.deactivated_at IS NULL
    )
  `.trim();
}

/**
 * Generate SQL condition for checking if user is active employee
 */
export function generateActiveEmployeeCheckSQL(
  userIdColumn: string,
  venueIdColumn: string
): string {
  return `
    EXISTS (
      SELECT 1 FROM venue_users
      WHERE venue_users.venue_id = ${venueIdColumn}
        AND venue_users.user_id = ${userIdColumn}
        AND venue_users.deactivated_at IS NULL
        AND venue_users.accepted_at IS NOT NULL
    )
  `.trim();
}
