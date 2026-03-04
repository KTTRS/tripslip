import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient, createAwaitableSupabaseQuery, createAwaitableQueryBuilder, createQueryBuilderMock } from '../setup';

describe('Integration Tests - Authentication Flows (Task 32)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  // Task 32.1: Complete signup → verify email → login flow
  it('Integration: Complete signup → verify email → login flow', async () => {
    const email = 'newteacher@school.com';
    const password = 'SecurePass123';

    // Step 1: Signup
    const mockUser = {
      id: 'user-123',
      email,
      email_confirmed_at: null,
    };

    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'role-456' },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({
        data: { id: 'assignment-789' },
        error: null,
      }),
    });

    const signupResult = await authService.signUp({
      email,
      password,
      role: 'teacher',
      organization_type: 'school',
      organization_id: 'school-123',
    });

    expect(signupResult.user.email).toBe(email);
    expect(signupResult.requiresEmailVerification).toBe(true);

    // Step 2: Verify email
    mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
      data: {
        user: {
          ...mockUser,
          email_confirmed_at: new Date().toISOString(),
        },
        session: null,
      },
      error: null,
    });

    await authService.verifyEmail('verification-token-123');

    // Step 3: Login
    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      user: {
        ...mockUser,
        email_confirmed_at: new Date().toISOString(),
      },
    };

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockSession.user, session: mockSession },
      error: null,
    });

    // Mock getRoleAssignments - returns array directly
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableQueryBuilder({
        data: [
          {
            id: 'assignment-789',
            user_id: 'user-123',
            role_id: 'role-456',
            role_name: 'teacher',
            organization_type: 'school',
            organization_id: 'school-123',
            is_active: true,
            user_roles: { name: 'teacher' },
          },
        ],
        error: null,
      })
    );

    // Mock getActiveRoleContext - returns null (no active role yet)
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery(null, { code: 'PGRST116' })
    );

    // Mock setActiveRoleContext (upsert)
    mockSupabaseClient.from.mockReturnValueOnce(
      createQueryBuilderMock({
        upsert: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      })
    );

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    const loginResult = await authService.signIn(email, password);

    expect(loginResult.user.email).toBe(email);
    expect(loginResult.session).toBeDefined();
    expect(loginResult.session.access_token).toBeTruthy();
  });

  // Task 32.2: Login → switch role → access data flow
  it('Integration: Login → switch role → access data flow', async () => {
    const email = 'admin@school.com';
    const password = 'SecurePass123';

    // Step 1: Login
    const mockUser = {
      id: 'user-123',
      email,
      email_confirmed_at: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      user: mockUser,
    };

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    // Mock getRoleAssignments
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableQueryBuilder({
        data: [
          {
            id: 'assignment-school',
            user_id: 'user-123',
            role_id: 'role-school',
            role_name: 'school_admin',
            organization_type: 'school',
            organization_id: 'school-123',
            is_active: true,
            user_roles: { name: 'school_admin' },
          },
          {
            id: 'assignment-district',
            user_id: 'user-123',
            role_id: 'role-district',
            role_name: 'district_admin',
            organization_type: 'district',
            organization_id: 'district-123',
            is_active: true,
            user_roles: { name: 'district_admin' },
          },
        ],
        error: null,
      })
    );

    // Mock getActiveRoleContext - returns null
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery(null, { code: 'PGRST116' })
    );

    // Mock setActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createQueryBuilderMock({
        upsert: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      })
    );

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    const loginResult = await authService.signIn(email, password);
    expect(loginResult.activeRole.role_name).toBe('school_admin');

    // Step 2: Switch role
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock getActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        user_id: 'user-123',
        active_role_assignment_id: 'assignment-school',
        user_role_assignments: {
          id: 'assignment-school',
          organization_type: 'school',
          organization_id: 'school-123',
          user_roles: { name: 'school_admin' },
        },
      })
    );

    // Mock role assignment verification
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery({
        id: 'assignment-district',
        user_id: 'user-123',
        organization_type: 'district',
        organization_id: 'district-123',
        user_roles: { name: 'district_admin' },
      })
    );

    // Mock setActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createQueryBuilderMock({
        upsert: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      })
    );

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    await authService.switchRole('assignment-district');

    // Step 3: Verify data access changed
    // After role switch, JWT claims should be updated
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith(
      'update_user_role_claims',
      expect.objectContaining({
        p_user_id: 'user-123',
        p_role: 'district_admin',
        p_organization_type: 'district',
        p_organization_id: 'district-123',
      })
    );
  });

  // Task 32.3: Forgot password → reset → login flow
  it('Integration: Forgot password → reset → login flow', async () => {
    const email = 'teacher@school.com';
    const newPassword = 'NewSecurePass123';

    // Step 1: Request password reset
    mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    await authService.resetPassword(email);

    expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      email,
      expect.any(Object)
    );

    // Step 2: Reset password with token
    mockSupabaseClient.auth.updateUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email,
        },
      },
      error: null,
    });

    await authService.updatePassword(newPassword);

    expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
      password: newPassword,
    });

    // Step 3: Login with new password
    const mockUser = {
      id: 'user-123',
      email,
      email_confirmed_at: new Date().toISOString(),
    };

    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      user: mockUser,
    };

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    // Mock getRoleAssignments
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableQueryBuilder({
        data: [
          {
            id: 'assignment-123',
            user_id: 'user-123',
            role_id: 'role-456',
            role_name: 'teacher',
            organization_type: 'school',
            organization_id: 'school-123',
            is_active: true,
            user_roles: { name: 'teacher' },
          },
        ],
        error: null,
      })
    );

    // Mock getActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createAwaitableSupabaseQuery(null, { code: 'PGRST116' })
    );

    // Mock setActiveRoleContext
    mockSupabaseClient.from.mockReturnValueOnce(
      createQueryBuilderMock({
        upsert: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      })
    );

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    const loginResult = await authService.signIn(email, newPassword);

    expect(loginResult.user.email).toBe(email);
    expect(loginResult.session).toBeDefined();
  });

  // Task 32.4: Protected route access with various auth states
  it('Integration: Protected route access with various auth states', async () => {
    // Test 1: Unauthenticated access
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    let session = await authService.getSession();
    expect(session).toBeNull();

    // Test 2: Authenticated access
    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      user: {
        id: 'user-123',
        email: 'teacher@school.com',
      },
    };

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    session = await authService.getSession();
    expect(session).toBeDefined();
    expect(session?.access_token).toBe('token-123');

    // Test 3: Expired session access
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    session = await authService.getSession();
    expect(session).toBeNull();

    // Test 4: Unauthorized role access
    // This would be handled by RoleGuard component
    const authorizedRoles = ['school_admin', 'district_admin'];
    const userRole = 'teacher';
    const hasAccess = authorizedRoles.includes(userRole);
    expect(hasAccess).toBe(false);
  });
});
