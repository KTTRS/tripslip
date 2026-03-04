/**
 * Unit tests for Venue Employee Service
 * 
 * Tests employee invitation, role management, and permission checking
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VenueEmployeeService, ROLE_PERMISSIONS } from '../venue-employee-service';
import type { SupabaseClient } from '../client';

// Mock Supabase client
const createMockSupabase = () => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockIs = vi.fn().mockReturnThis();
  const mockNot = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();

  return {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      is: mockIs,
      not: mockNot,
      order: mockOrder,
      single: mockSingle,
    })),
    _mocks: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      eq: mockEq,
      is: mockIs,
      not: mockNot,
      order: mockOrder,
      single: mockSingle,
    },
  } as unknown as SupabaseClient & { _mocks: any };
};

describe('VenueEmployeeService', () => {
  let service: VenueEmployeeService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new VenueEmployeeService(mockSupabase);
  });

  describe('inviteEmployee', () => {
    it('should create a new employee invitation', async () => {
      const params = {
        venue_id: 'venue-1',
        user_id: 'user-1',
        role: 'editor' as const,
        invited_by: 'admin-1',
      };

      // Mock: no existing employee
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: null });

      // Mock: successful insert
      const expectedEmployee = {
        id: 'emp-1',
        ...params,
        invited_at: expect.any(String),
        accepted_at: null,
        deactivated_at: null,
        created_at: expect.any(String),
      };
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: expectedEmployee, error: null });

      const result = await service.inviteEmployee(params);

      expect(result).toMatchObject({
        venue_id: params.venue_id,
        user_id: params.user_id,
        role: params.role,
        invited_by: params.invited_by,
      });
    });

    it('should throw error if user is already an employee', async () => {
      const params = {
        venue_id: 'venue-1',
        user_id: 'user-1',
        role: 'editor' as const,
        invited_by: 'admin-1',
      };

      // Mock: existing employee found
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { id: 'existing-emp', ...params },
        error: null,
      });

      await expect(service.inviteEmployee(params)).rejects.toThrow(
        'User is already an employee of this venue'
      );
    });

    it('should support all three role types', async () => {
      const roles: Array<'administrator' | 'editor' | 'viewer'> = [
        'administrator',
        'editor',
        'viewer',
      ];

      for (const role of roles) {
        mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: null });
        mockSupabase._mocks.single.mockResolvedValueOnce({
          data: { id: 'emp-1', role },
          error: null,
        });

        const result = await service.inviteEmployee({
          venue_id: 'venue-1',
          user_id: 'user-1',
          role,
          invited_by: 'admin-1',
        });

        expect(result.role).toBe(role);
      }
    });
  });

  describe('acceptInvitation', () => {
    it('should mark invitation as accepted', async () => {
      const employee_id = 'emp-1';
      const expectedEmployee = {
        id: employee_id,
        accepted_at: expect.any(String),
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: expectedEmployee,
        error: null,
      });

      const result = await service.acceptInvitation(employee_id);

      expect(result.accepted_at).toBeTruthy();
    });

    it('should throw error if invitation not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(service.acceptInvitation('invalid-id')).rejects.toThrow(
        'Invitation not found or already accepted'
      );
    });
  });

  describe('updateEmployeeRole', () => {
    it('should update employee role', async () => {
      const params = {
        employee_id: 'emp-1',
        role: 'administrator' as const,
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { id: params.employee_id, role: params.role },
        error: null,
      });

      const result = await service.updateEmployeeRole(params);

      expect(result.role).toBe(params.role);
    });

    it('should throw error if employee not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(
        service.updateEmployeeRole({ employee_id: 'invalid-id', role: 'editor' })
      ).rejects.toThrow('Employee not found or already deactivated');
    });
  });

  describe('deactivateEmployee', () => {
    it('should deactivate an employee', async () => {
      const employee_id = 'emp-1';
      const expectedEmployee = {
        id: employee_id,
        deactivated_at: expect.any(String),
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: expectedEmployee,
        error: null,
      });

      const result = await service.deactivateEmployee(employee_id);

      expect(result.deactivated_at).toBeTruthy();
    });

    it('should throw error if employee not found', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(service.deactivateEmployee('invalid-id')).rejects.toThrow(
        'Employee not found or already deactivated'
      );
    });
  });

  describe('reactivateEmployee', () => {
    it('should reactivate a deactivated employee', async () => {
      const employee_id = 'emp-1';
      const expectedEmployee = {
        id: employee_id,
        deactivated_at: null,
      };

      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: expectedEmployee,
        error: null,
      });

      const result = await service.reactivateEmployee(employee_id);

      expect(result.deactivated_at).toBeNull();
    });
  });

  describe('getVenueEmployees', () => {
    it('should return all active employees by default', async () => {
      const venue_id = 'venue-1';
      const employees = [
        { id: 'emp-1', venue_id, role: 'administrator', deactivated_at: null },
        { id: 'emp-2', venue_id, role: 'editor', deactivated_at: null },
      ];

      mockSupabase._mocks.order.mockResolvedValueOnce({ data: employees, error: null });

      const result = await service.getVenueEmployees(venue_id);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('administrator');
      expect(result[1].role).toBe('editor');
    });

    it('should include deactivated employees when requested', async () => {
      const venue_id = 'venue-1';
      const employees = [
        { id: 'emp-1', venue_id, role: 'administrator', deactivated_at: null },
        { id: 'emp-2', venue_id, role: 'editor', deactivated_at: '2024-01-01' },
      ];

      mockSupabase._mocks.order.mockResolvedValueOnce({ data: employees, error: null });

      const result = await service.getVenueEmployees(venue_id, true);

      expect(result).toHaveLength(2);
    });
  });

  describe('getPendingInvitations', () => {
    it('should return only pending invitations', async () => {
      const venue_id = 'venue-1';
      const pendingInvitations = [
        { id: 'emp-1', venue_id, accepted_at: null, deactivated_at: null },
      ];

      mockSupabase._mocks.order.mockResolvedValueOnce({
        data: pendingInvitations,
        error: null,
      });

      const result = await service.getPendingInvitations(venue_id);

      expect(result).toHaveLength(1);
      expect(result[0].accepted_at).toBeNull();
    });
  });

  describe('hasPermission', () => {
    it('should return true for administrator with any permission', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'administrator' },
        error: null,
      });

      const result = await service.hasPermission('user-1', 'venue-1', 'venue.delete');

      expect(result).toBe(true);
    });

    it('should return false for editor without delete permission', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'editor' },
        error: null,
      });

      const result = await service.hasPermission('user-1', 'venue-1', 'venue.delete');

      expect(result).toBe(false);
    });

    it('should return true for editor with write permission', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'editor' },
        error: null,
      });

      const result = await service.hasPermission('user-1', 'venue-1', 'venue.write');

      expect(result).toBe(true);
    });

    it('should return false for viewer with write permission', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'viewer' },
        error: null,
      });

      const result = await service.hasPermission('user-1', 'venue-1', 'venue.write');

      expect(result).toBe(false);
    });

    it('should return true for viewer with read permission', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'viewer' },
        error: null,
      });

      const result = await service.hasPermission('user-1', 'venue-1', 'venue.read');

      expect(result).toBe(true);
    });

    it('should return false if user is not an employee', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await service.hasPermission('user-1', 'venue-1', 'venue.read');

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return all permissions for administrator', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'administrator' },
        error: null,
      });

      const result = await service.getUserPermissions('user-1', 'venue-1');

      expect(result).toEqual(ROLE_PERMISSIONS.administrator);
      expect(result).toContain('venue.delete');
      expect(result).toContain('financial.read');
    });

    it('should return editor permissions', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'editor' },
        error: null,
      });

      const result = await service.getUserPermissions('user-1', 'venue-1');

      expect(result).toEqual(ROLE_PERMISSIONS.editor);
      expect(result).toContain('venue.write');
      expect(result).not.toContain('venue.delete');
    });

    it('should return viewer permissions', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'viewer' },
        error: null,
      });

      const result = await service.getUserPermissions('user-1', 'venue-1');

      expect(result).toEqual(ROLE_PERMISSIONS.viewer);
      expect(result).toContain('venue.read');
      expect(result).not.toContain('venue.write');
    });

    it('should return empty array if user is not an employee', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await service.getUserPermissions('user-1', 'venue-1');

      expect(result).toEqual([]);
    });
  });

  describe('isAdministrator', () => {
    it('should return true for administrator', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'administrator' },
        error: null,
      });

      const result = await service.isAdministrator('user-1', 'venue-1');

      expect(result).toBe(true);
    });

    it('should return false for non-administrator', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.isAdministrator('user-1', 'venue-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return the user role', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: { role: 'editor' },
        error: null,
      });

      const result = await service.getUserRole('user-1', 'venue-1');

      expect(result).toBe('editor');
    });

    it('should return null if user is not an employee', async () => {
      mockSupabase._mocks.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.getUserRole('user-1', 'venue-1');

      expect(result).toBeNull();
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for all roles', () => {
      expect(ROLE_PERMISSIONS.administrator).toBeDefined();
      expect(ROLE_PERMISSIONS.editor).toBeDefined();
      expect(ROLE_PERMISSIONS.viewer).toBeDefined();
    });

    it('should have administrator with most permissions', () => {
      expect(ROLE_PERMISSIONS.administrator.length).toBeGreaterThan(
        ROLE_PERMISSIONS.editor.length
      );
      expect(ROLE_PERMISSIONS.administrator.length).toBeGreaterThan(
        ROLE_PERMISSIONS.viewer.length
      );
    });

    it('should have viewer with least permissions', () => {
      expect(ROLE_PERMISSIONS.viewer.length).toBeLessThan(ROLE_PERMISSIONS.editor.length);
      expect(ROLE_PERMISSIONS.viewer.length).toBeLessThan(
        ROLE_PERMISSIONS.administrator.length
      );
    });

    it('should restrict financial access to administrators only', () => {
      expect(ROLE_PERMISSIONS.administrator).toContain('financial.read');
      expect(ROLE_PERMISSIONS.editor).not.toContain('financial.read');
      expect(ROLE_PERMISSIONS.viewer).not.toContain('financial.read');
    });

    it('should restrict employee management to administrators only', () => {
      expect(ROLE_PERMISSIONS.administrator).toContain('employee.write');
      expect(ROLE_PERMISSIONS.administrator).toContain('employee.delete');
      expect(ROLE_PERMISSIONS.editor).not.toContain('employee.write');
      expect(ROLE_PERMISSIONS.viewer).not.toContain('employee.write');
    });

    it('should allow editors to write but not delete', () => {
      expect(ROLE_PERMISSIONS.editor).toContain('venue.write');
      expect(ROLE_PERMISSIONS.editor).not.toContain('venue.delete');
    });

    it('should allow viewers only read access', () => {
      const viewerPermissions = ROLE_PERMISSIONS.viewer;
      expect(viewerPermissions.every((p) => p.endsWith('.read'))).toBe(true);
    });
  });
});
