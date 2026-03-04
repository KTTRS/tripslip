import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient, createQueryBuilderMock, createAwaitableSupabaseQuery } from '../setup';

describe('AuthService - Role Switching (Task 25.6)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  it('should allow user with multiple roles to switch', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@school.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock getActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        user_id: 'user-123',
        active_role_assignment_id: 'assignment-123',
        user_role_assignments: {
          id: 'assignment-123',
          organization_type: 'school',
          organization_id: 'school-123',
          user_roles: { name: 'school_admin' },
        },
      })
    );

    // Mock role assignment verification
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        id: 'assignment-456',
        user_id: 'user-123',
        organization_type: 'district',
        organization_id: 'district-123',
        user_roles: { name: 'district_admin' },
      })
    );

    // Mock setActiveRoleContext (upsert)
    mockSupabaseClient.from.mockReturnValueOnce(createQueryBuilderMock({
      upsert: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    }));

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      authService.switchRole('assignment-456')
    ).resolves.not.toThrow();
  });

  it('should update active context on role switch', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@school.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const upsertMock = vi.fn().mockResolvedValue({
      data: {},
      error: null,
    });

    // Mock getActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        user_id: 'user-123',
        active_role_assignment_id: 'assignment-123',
        user_role_assignments: {
          id: 'assignment-123',
          organization_type: 'school',
          organization_id: 'school-123',
          user_roles: { name: 'school_admin' },
        },
      })
    );

    // Mock role assignment verification
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        id: 'assignment-456',
        user_id: 'user-123',
        organization_type: 'district',
        organization_id: 'district-123',
        user_roles: { name: 'district_admin' },
      })
    );

    // Mock setActiveRoleContext (upsert)
    mockSupabaseClient.from.mockReturnValueOnce(createQueryBuilderMock({
      upsert: upsertMock,
    }));

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await authService.switchRole('assignment-456');

    expect(upsertMock).toHaveBeenCalledWith({
      user_id: 'user-123',
      active_role_assignment_id: 'assignment-456',
    });
  });


  it('should change data access on role switch', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@school.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock getActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        user_id: 'user-123',
        active_role_assignment_id: 'assignment-123',
        user_role_assignments: {
          id: 'assignment-123',
          organization_type: 'school',
          organization_id: 'school-123',
          user_roles: { name: 'school_admin' },
        },
      })
    );

    // Mock role assignment verification
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        id: 'assignment-456',
        user_id: 'user-123',
        organization_type: 'district',
        organization_id: 'district-123',
        user_roles: { name: 'district_admin' },
      })
    );

    // Mock setActiveRoleContext (upsert)
    mockSupabaseClient.from.mockReturnValueOnce(createQueryBuilderMock({
      upsert: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
    }));

    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabaseClient.rpc = rpcMock;

    await authService.switchRole('assignment-456');

    // Verify that JWT claims are updated with new role
    expect(rpcMock).toHaveBeenCalledWith('update_user_role_claims', {
      p_user_id: 'user-123',
      p_role: 'district_admin',
      p_organization_type: 'district',
      p_organization_id: 'district-123',
    });
  });

  it('should persist active role across sessions', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@school.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const upsertMock = vi.fn().mockResolvedValue({
      data: {},
      error: null,
    });

    // Mock getActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        user_id: 'user-123',
        active_role_assignment_id: 'assignment-123',
        user_role_assignments: {
          id: 'assignment-123',
          organization_type: 'school',
          organization_id: 'school-123',
          user_roles: { name: 'school_admin' },
        },
      })
    );

    // Mock role assignment verification
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        id: 'assignment-456',
        user_id: 'user-123',
        organization_type: 'district',
        organization_id: 'district-123',
        user_roles: { name: 'district_admin' },
      })
    );

    // Mock setActiveRoleContext (upsert)
    mockSupabaseClient.from.mockReturnValueOnce(createQueryBuilderMock({
      upsert: upsertMock,
    }));

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await authService.switchRole('assignment-456');

    // Verify that active role is persisted in active_role_context table
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        active_role_assignment_id: 'assignment-456',
      })
    );
  });
});
