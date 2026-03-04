/**
 * Unit tests for Venue Permission Utilities
 * 
 * Tests role-based permission checking functions
 * Requirements: 6.6, 6.7, 6.8, 6.9
 */

import { describe, it, expect } from 'vitest';
import {
  VENUE_PERMISSIONS,
  roleHasPermission,
  getRolePermissions,
  canPerformAction,
  isAdministratorRole,
  canManageEmployees,
  canAccessFinancials,
  canDeleteVenue,
  canModifyVenue,
  canViewVenue,
  getMinimumRoleForPermission,
  compareRoles,
  hasAtLeastRole,
  generatePermissionCheckSQL,
  generateAdminCheckSQL,
  generateActiveEmployeeCheckSQL,
} from '../venue-permissions';

describe('Venue Permission Utilities', () => {
  describe('roleHasPermission', () => {
    it('should return true for administrator with any permission', () => {
      expect(roleHasPermission('administrator', VENUE_PERMISSIONS.VENUE_DELETE)).toBe(true);
      expect(roleHasPermission('administrator', VENUE_PERMISSIONS.FINANCIAL_READ)).toBe(true);
      expect(roleHasPermission('administrator', VENUE_PERMISSIONS.EMPLOYEE_WRITE)).toBe(true);
    });

    it('should return false for editor without delete permission', () => {
      expect(roleHasPermission('editor', VENUE_PERMISSIONS.VENUE_DELETE)).toBe(false);
      expect(roleHasPermission('editor', VENUE_PERMISSIONS.EXPERIENCE_DELETE)).toBe(false);
    });

    it('should return true for editor with write permission', () => {
      expect(roleHasPermission('editor', VENUE_PERMISSIONS.VENUE_WRITE)).toBe(true);
      expect(roleHasPermission('editor', VENUE_PERMISSIONS.EXPERIENCE_WRITE)).toBe(true);
    });

    it('should return false for viewer with write permission', () => {
      expect(roleHasPermission('viewer', VENUE_PERMISSIONS.VENUE_WRITE)).toBe(false);
      expect(roleHasPermission('viewer', VENUE_PERMISSIONS.BOOKING_WRITE)).toBe(false);
    });

    it('should return true for viewer with read permission', () => {
      expect(roleHasPermission('viewer', VENUE_PERMISSIONS.VENUE_READ)).toBe(true);
      expect(roleHasPermission('viewer', VENUE_PERMISSIONS.BOOKING_READ)).toBe(true);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for administrator', () => {
      const permissions = getRolePermissions('administrator');
      expect(permissions).toContain(VENUE_PERMISSIONS.VENUE_DELETE);
      expect(permissions).toContain(VENUE_PERMISSIONS.FINANCIAL_READ);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return editor permissions', () => {
      const permissions = getRolePermissions('editor');
      expect(permissions).toContain(VENUE_PERMISSIONS.VENUE_WRITE);
      expect(permissions).not.toContain(VENUE_PERMISSIONS.VENUE_DELETE);
    });

    it('should return viewer permissions', () => {
      const permissions = getRolePermissions('viewer');
      expect(permissions).toContain(VENUE_PERMISSIONS.VENUE_READ);
      expect(permissions).not.toContain(VENUE_PERMISSIONS.VENUE_WRITE);
    });
  });

  describe('canPerformAction', () => {
    it('should allow administrator to perform any action', () => {
      expect(canPerformAction('administrator', 'venue', 'delete')).toBe(true);
      expect(canPerformAction('administrator', 'employee', 'write')).toBe(true);
      expect(canPerformAction('administrator', 'financial', 'read')).toBe(true);
    });

    it('should allow editor to write but not delete', () => {
      expect(canPerformAction('editor', 'venue', 'write')).toBe(true);
      expect(canPerformAction('editor', 'venue', 'delete')).toBe(false);
    });

    it('should allow viewer only to read', () => {
      expect(canPerformAction('viewer', 'venue', 'read')).toBe(true);
      expect(canPerformAction('viewer', 'venue', 'write')).toBe(false);
    });
  });

  describe('isAdministratorRole', () => {
    it('should return true for administrator', () => {
      expect(isAdministratorRole('administrator')).toBe(true);
    });

    it('should return false for non-administrator roles', () => {
      expect(isAdministratorRole('editor')).toBe(false);
      expect(isAdministratorRole('viewer')).toBe(false);
    });
  });

  describe('canManageEmployees', () => {
    it('should return true only for administrator', () => {
      expect(canManageEmployees('administrator')).toBe(true);
      expect(canManageEmployees('editor')).toBe(false);
      expect(canManageEmployees('viewer')).toBe(false);
    });
  });

  describe('canAccessFinancials', () => {
    it('should return true only for administrator', () => {
      expect(canAccessFinancials('administrator')).toBe(true);
      expect(canAccessFinancials('editor')).toBe(false);
      expect(canAccessFinancials('viewer')).toBe(false);
    });
  });

  describe('canDeleteVenue', () => {
    it('should return true only for administrator', () => {
      expect(canDeleteVenue('administrator')).toBe(true);
      expect(canDeleteVenue('editor')).toBe(false);
      expect(canDeleteVenue('viewer')).toBe(false);
    });
  });

  describe('canModifyVenue', () => {
    it('should return true for administrator and editor', () => {
      expect(canModifyVenue('administrator')).toBe(true);
      expect(canModifyVenue('editor')).toBe(true);
      expect(canModifyVenue('viewer')).toBe(false);
    });
  });

  describe('canViewVenue', () => {
    it('should return true for all roles', () => {
      expect(canViewVenue('administrator')).toBe(true);
      expect(canViewVenue('editor')).toBe(true);
      expect(canViewVenue('viewer')).toBe(true);
    });
  });

  describe('getMinimumRoleForPermission', () => {
    it('should return viewer for read permissions', () => {
      expect(getMinimumRoleForPermission(VENUE_PERMISSIONS.VENUE_READ)).toBe('viewer');
      expect(getMinimumRoleForPermission(VENUE_PERMISSIONS.BOOKING_READ)).toBe('viewer');
    });

    it('should return editor for write permissions', () => {
      expect(getMinimumRoleForPermission(VENUE_PERMISSIONS.VENUE_WRITE)).toBe('editor');
      expect(getMinimumRoleForPermission(VENUE_PERMISSIONS.EXPERIENCE_WRITE)).toBe('editor');
    });

    it('should return administrator for delete and financial permissions', () => {
      expect(getMinimumRoleForPermission(VENUE_PERMISSIONS.VENUE_DELETE)).toBe('administrator');
      expect(getMinimumRoleForPermission(VENUE_PERMISSIONS.FINANCIAL_READ)).toBe('administrator');
      expect(getMinimumRoleForPermission(VENUE_PERMISSIONS.EMPLOYEE_WRITE)).toBe('administrator');
    });

    it('should return null for non-existent permission', () => {
      expect(getMinimumRoleForPermission('invalid.permission')).toBeNull();
    });
  });

  describe('compareRoles', () => {
    it('should return -1 when role1 is less privileged than role2', () => {
      expect(compareRoles('viewer', 'editor')).toBe(-1);
      expect(compareRoles('viewer', 'administrator')).toBe(-1);
      expect(compareRoles('editor', 'administrator')).toBe(-1);
    });

    it('should return 0 when roles are equal', () => {
      expect(compareRoles('viewer', 'viewer')).toBe(0);
      expect(compareRoles('editor', 'editor')).toBe(0);
      expect(compareRoles('administrator', 'administrator')).toBe(0);
    });

    it('should return 1 when role1 is more privileged than role2', () => {
      expect(compareRoles('editor', 'viewer')).toBe(1);
      expect(compareRoles('administrator', 'viewer')).toBe(1);
      expect(compareRoles('administrator', 'editor')).toBe(1);
    });
  });

  describe('hasAtLeastRole', () => {
    it('should return true when role1 has equal or higher privileges', () => {
      expect(hasAtLeastRole('administrator', 'viewer')).toBe(true);
      expect(hasAtLeastRole('administrator', 'editor')).toBe(true);
      expect(hasAtLeastRole('administrator', 'administrator')).toBe(true);
      expect(hasAtLeastRole('editor', 'viewer')).toBe(true);
      expect(hasAtLeastRole('editor', 'editor')).toBe(true);
    });

    it('should return false when role1 has lower privileges', () => {
      expect(hasAtLeastRole('viewer', 'editor')).toBe(false);
      expect(hasAtLeastRole('viewer', 'administrator')).toBe(false);
      expect(hasAtLeastRole('editor', 'administrator')).toBe(false);
    });
  });

  describe('generatePermissionCheckSQL', () => {
    it('should generate SQL for permission check', () => {
      const sql = generatePermissionCheckSQL('auth.uid()', 'venues.id', VENUE_PERMISSIONS.VENUE_WRITE);
      
      expect(sql).toContain('EXISTS');
      expect(sql).toContain('venue_users');
      expect(sql).toContain('auth.uid()');
      expect(sql).toContain('venues.id');
      expect(sql).toContain('deactivated_at IS NULL');
    });

    it('should include correct roles for write permission', () => {
      const sql = generatePermissionCheckSQL('auth.uid()', 'venues.id', VENUE_PERMISSIONS.VENUE_WRITE);
      
      expect(sql).toContain("'administrator'");
      expect(sql).toContain("'editor'");
      expect(sql).not.toContain("'viewer'");
    });

    it('should include all roles for read permission', () => {
      const sql = generatePermissionCheckSQL('auth.uid()', 'venues.id', VENUE_PERMISSIONS.VENUE_READ);
      
      expect(sql).toContain("'administrator'");
      expect(sql).toContain("'editor'");
      expect(sql).toContain("'viewer'");
    });

    it('should return FALSE for non-existent permission', () => {
      const sql = generatePermissionCheckSQL('auth.uid()', 'venues.id', 'invalid.permission');
      
      expect(sql).toBe('FALSE');
    });
  });

  describe('generateAdminCheckSQL', () => {
    it('should generate SQL for admin check', () => {
      const sql = generateAdminCheckSQL('auth.uid()', 'venues.id');
      
      expect(sql).toContain('EXISTS');
      expect(sql).toContain('venue_users');
      expect(sql).toContain('auth.uid()');
      expect(sql).toContain('venues.id');
      expect(sql).toContain("role = 'administrator'");
      expect(sql).toContain('deactivated_at IS NULL');
    });
  });

  describe('generateActiveEmployeeCheckSQL', () => {
    it('should generate SQL for active employee check', () => {
      const sql = generateActiveEmployeeCheckSQL('auth.uid()', 'venues.id');
      
      expect(sql).toContain('EXISTS');
      expect(sql).toContain('venue_users');
      expect(sql).toContain('auth.uid()');
      expect(sql).toContain('venues.id');
      expect(sql).toContain('deactivated_at IS NULL');
      expect(sql).toContain('accepted_at IS NOT NULL');
    });
  });

  describe('VENUE_PERMISSIONS constants', () => {
    it('should define all expected permissions', () => {
      expect(VENUE_PERMISSIONS.VENUE_READ).toBe('venue.read');
      expect(VENUE_PERMISSIONS.VENUE_WRITE).toBe('venue.write');
      expect(VENUE_PERMISSIONS.VENUE_DELETE).toBe('venue.delete');
      expect(VENUE_PERMISSIONS.EXPERIENCE_READ).toBe('experience.read');
      expect(VENUE_PERMISSIONS.EXPERIENCE_WRITE).toBe('experience.write');
      expect(VENUE_PERMISSIONS.EXPERIENCE_DELETE).toBe('experience.delete');
      expect(VENUE_PERMISSIONS.BOOKING_READ).toBe('booking.read');
      expect(VENUE_PERMISSIONS.BOOKING_WRITE).toBe('booking.write');
      expect(VENUE_PERMISSIONS.EMPLOYEE_READ).toBe('employee.read');
      expect(VENUE_PERMISSIONS.EMPLOYEE_WRITE).toBe('employee.write');
      expect(VENUE_PERMISSIONS.EMPLOYEE_DELETE).toBe('employee.delete');
      expect(VENUE_PERMISSIONS.ANALYTICS_READ).toBe('analytics.read');
      expect(VENUE_PERMISSIONS.FINANCIAL_READ).toBe('financial.read');
    });
  });
});
