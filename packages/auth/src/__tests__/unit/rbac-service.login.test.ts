import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient, createQueryBuilderMock, createAwaitableQueryBuilder } from '../setup';
import { AuthError } from '../../errors';

describe('AuthService - Login Flow (Task 25.2)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  it('should successfully login with valid credentials', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
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

    const mockRoleAssignments = [
      {
        id: 'assignment-123',
        user_id: 'user-123',
        role_id: 'role-456',
        organization_type: 'school',
        organization_id: 'school-123',
        is_active: true,
        user_roles: { name: 'teacher' },
      },
    ];

    // Mock getRoleAssignments - it awaits the query directly (no .single())
    const getRoleAssignmentsQuery = createAwaitableQueryBuilder({ data: mockRoleAssignments, error: null });
    
    // Mock getActiveRoleContext - it uses .single()
    const getActiveRoleQuery = createQueryBuilderMock();
    getActiveRoleQuery.single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });

    // Mock setActiveRoleContext - it uses .upsert()
    const setActiveRoleQuery = createQueryBuilderMock();
    setActiveRoleQuery.upsert = vi.fn().mockResolvedValue({
      data: {},
      error: null,
    });

    mockSupabaseClient.from
      .mockReturnValueOnce(getRoleAssignmentsQuery)
      .mockReturnValueOnce(getActiveRoleQuery)
      .mockReturnValueOnce(setActiveRoleQuery);

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await authService.signIn('teacher@school.com', 'SecurePass123');

    expect(result.user).toEqual(mockUser);
    expect(result.session).toEqual(mockSession);
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'teacher@school.com',
      password: 'SecurePass123',
    });
  });

  it('should reject login with invalid email', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid login credentials',
        status: 400,
      },
    });

    await expect(
      authService.signIn('nonexistent@school.com', 'SecurePass123')
    ).rejects.toThrow('Invalid email or password');
  });

  it('should reject login with invalid password', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid login credentials',
        status: 400,
      },
    });

    await expect(
      authService.signIn('teacher@school.com', 'WrongPassword')
    ).rejects.toThrow('Invalid email or password');
  });

  it('should create session on successful login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
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

    const mockRoleAssignments = [
      {
        id: 'assignment-123',
        role_id: 'role-456',
        organization_type: 'school',
        organization_id: 'school-123',
        user_roles: { name: 'teacher' },
      },
    ];

    const getRoleAssignmentsQuery = createAwaitableQueryBuilder({ data: mockRoleAssignments, error: null });
    const getActiveRoleQuery = createQueryBuilderMock();
    getActiveRoleQuery.single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    const setActiveRoleQuery = createQueryBuilderMock();
    setActiveRoleQuery.upsert = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockSupabaseClient.from
      .mockReturnValueOnce(getRoleAssignmentsQuery)
      .mockReturnValueOnce(getActiveRoleQuery)
      .mockReturnValueOnce(setActiveRoleQuery);

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await authService.signIn('teacher@school.com', 'SecurePass123');

    expect(result.session).toBeDefined();
    expect(result.session.access_token).toBe('token-123');
  });

  it('should load role assignments on login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
    };

    const mockSession = {
      access_token: 'token-123',
      refresh_token: 'refresh-123',
      user: mockUser,
    };

    const mockRoleAssignment = {
      id: 'assignment-123',
      role_id: 'role-456',
      organization_type: 'school',
      organization_id: 'school-123',
      user_roles: { name: 'teacher' },
    };

    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    });

    const getRoleAssignmentsQuery = createAwaitableQueryBuilder({ data: [mockRoleAssignment], error: null });
    const getActiveRoleQuery = createQueryBuilderMock();
    getActiveRoleQuery.single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    const setActiveRoleQuery = createQueryBuilderMock();
    setActiveRoleQuery.upsert = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockSupabaseClient.from
      .mockReturnValueOnce(getRoleAssignmentsQuery)
      .mockReturnValueOnce(getActiveRoleQuery)
      .mockReturnValueOnce(setActiveRoleQuery);

    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await authService.signIn('teacher@school.com', 'SecurePass123');

    expect(result.roleAssignments).toBeDefined();
    expect(result.roleAssignments.length).toBe(1);
    expect(result.roleAssignments[0].role_name).toBe('teacher');
  });

  it('should set active role context on login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
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

    const mockRoleAssignment = {
      id: 'assignment-123',
      role_id: 'role-456',
      organization_type: 'school',
      organization_id: 'school-123',
      user_roles: { name: 'teacher' },
    };

    const getRoleAssignmentsQuery = createAwaitableQueryBuilder({ data: [mockRoleAssignment], error: null });
    const getActiveRoleQuery = createQueryBuilderMock();
    getActiveRoleQuery.single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });
    const setActiveRoleQuery = createQueryBuilderMock();
    setActiveRoleQuery.upsert = vi.fn().mockResolvedValue({ data: {}, error: null });

    mockSupabaseClient.from
      .mockReturnValueOnce(getRoleAssignmentsQuery)
      .mockReturnValueOnce(getActiveRoleQuery)
      .mockReturnValueOnce(setActiveRoleQuery);

    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabaseClient.rpc = rpcMock;

    const result = await authService.signIn('teacher@school.com', 'SecurePass123');

    expect(result.activeRole).toBeDefined();
    expect(rpcMock).toHaveBeenCalledWith('update_user_role_claims', expect.any(Object));
  });
});
