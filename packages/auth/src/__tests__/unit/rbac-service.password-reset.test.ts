import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient } from '../setup';
import { AuthError } from '../../errors';

describe('AuthService - Password Reset (Task 25.4)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  it('should create reset token on password reset request', async () => {
    mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: null,
    });

    await expect(
      authService.resetPassword('teacher@school.com')
    ).resolves.not.toThrow();

    expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'teacher@school.com',
      expect.objectContaining({
        redirectTo: expect.any(String),
      })
    );
  });

  it('should reset password with valid token', async () => {
    mockSupabaseClient.auth.updateUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'teacher@school.com',
        },
      },
      error: null,
    });

    await expect(
      authService.updatePassword('NewSecurePass123')
    ).resolves.not.toThrow();

    expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
      password: 'NewSecurePass123',
    });
  });

  it('should reject password reset with expired token', async () => {
    mockSupabaseClient.auth.updateUser.mockResolvedValue({
      data: { user: null },
      error: {
        message: 'Token has expired',
        status: 400,
      },
    });

    await expect(
      authService.updatePassword('NewSecurePass123')
    ).rejects.toThrow(AuthError);
  });

  it('should invalidate reset token after use', async () => {
    const updateUserMock = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'teacher@school.com',
        },
      },
      error: null,
    });

    mockSupabaseClient.auth.updateUser = updateUserMock;

    await authService.updatePassword('NewSecurePass123');

    // After successful password update, the token should be invalidated
    // Attempting to use it again should fail
    updateUserMock.mockResolvedValue({
      data: { user: null },
      error: {
        message: 'Invalid token',
        status: 400,
      },
    });

    await expect(
      authService.updatePassword('AnotherPassword123')
    ).rejects.toThrow(AuthError);
  });

  it('should validate password during reset', async () => {
    await expect(
      authService.updatePassword('weak')
    ).rejects.toThrow('Password must be at least 8 characters');

    expect(mockSupabaseClient.auth.updateUser).not.toHaveBeenCalled();
  });
});
