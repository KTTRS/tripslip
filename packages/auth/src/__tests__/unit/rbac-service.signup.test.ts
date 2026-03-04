import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient } from '../setup';
import { AuthError } from '../../errors';

describe('AuthService - Signup Flow (Task 25.1)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  it('should successfully signup with valid credentials', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
      email_confirmed_at: null,
    };

    const mockRoleId = 'role-456';

    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: mockRoleId },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({
        data: { id: 'assignment-789' },
        error: null,
      }),
    });

    const result = await authService.signUp({
      email: 'teacher@school.com',
      password: 'SecurePass123',
      role: 'teacher',
      organization_type: 'school',
      organization_id: 'school-123',
    });

    expect(result.user).toEqual(mockUser);
    expect(result.requiresEmailVerification).toBe(true);
    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
      email: 'teacher@school.com',
      password: 'SecurePass123',
      options: {
        data: undefined,
      },
    });
  });

  it('should reject signup with duplicate email', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'User already registered',
        status: 409,
      },
    });

    await expect(
      authService.signUp({
        email: 'existing@school.com',
        password: 'SecurePass123',
        role: 'teacher',
        organization_type: 'school',
        organization_id: 'school-123',
      })
    ).rejects.toThrow(AuthError);
  });

  it('should reject signup with invalid email format', async () => {
    await expect(
      authService.signUp({
        email: 'invalid-email',
        password: 'SecurePass123',
        role: 'teacher',
        organization_type: 'school',
        organization_id: 'school-123',
      })
    ).rejects.toThrow('Please provide a valid email address');
  });

  it('should reject signup with weak password', async () => {
    await expect(
      authService.signUp({
        email: 'teacher@school.com',
        password: 'weak',
        role: 'teacher',
        organization_type: 'school',
        organization_id: 'school-123',
      })
    ).rejects.toThrow('Password must be at least 8 characters');
  });

  it('should create email verification record during signup', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
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

    const result = await authService.signUp({
      email: 'teacher@school.com',
      password: 'SecurePass123',
      role: 'teacher',
      organization_type: 'school',
      organization_id: 'school-123',
    });

    expect(result.requiresEmailVerification).toBe(true);
  });

  it('should create role assignment during signup', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
      email_confirmed_at: null,
    };

    const mockRoleId = 'role-456';
    const insertMock = vi.fn().mockResolvedValue({
      data: { id: 'assignment-789' },
      error: null,
    });

    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: mockRoleId },
        error: null,
      }),
      insert: insertMock,
    });

    await authService.signUp({
      email: 'teacher@school.com',
      password: 'SecurePass123',
      role: 'teacher',
      organization_type: 'school',
      organization_id: 'school-123',
    });

    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-123',
      role_id: mockRoleId,
      organization_type: 'school',
      organization_id: 'school-123',
      is_active: true,
    });
  });
});
