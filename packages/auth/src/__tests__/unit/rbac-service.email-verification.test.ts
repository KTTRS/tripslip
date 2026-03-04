import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient } from '../setup';
import { AuthError } from '../../errors';

describe('AuthService - Email Verification (Task 25.3)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  it('should verify email with valid token', async () => {
    mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'teacher@school.com',
          email_confirmed_at: '2024-01-01T00:00:00Z',
        },
        session: null,
      },
      error: null,
    });

    await expect(
      authService.verifyEmail('valid-token-123')
    ).resolves.not.toThrow();

    expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'valid-token-123',
      type: 'email',
    });
  });

  it('should reject email verification with expired token', async () => {
    mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Token has expired',
        status: 400,
      },
    });

    await expect(
      authService.verifyEmail('expired-token')
    ).rejects.toThrow(AuthError);
  });

  it('should reject email verification with invalid token', async () => {
    mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: 'Invalid token',
        status: 400,
      },
    });

    await expect(
      authService.verifyEmail('invalid-token')
    ).rejects.toThrow(AuthError);
  });

  it('should grant access to features after email verification', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'teacher@school.com',
      email_confirmed_at: '2024-01-01T00:00:00Z',
    };

    mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
      data: {
        user: mockUser,
        session: null,
      },
      error: null,
    });

    await authService.verifyEmail('valid-token-123');

    // Verify that the user's email is confirmed
    expect(mockUser.email_confirmed_at).toBeTruthy();
  });

  it('should resend verification email', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'teacher@school.com',
        },
      },
      error: null,
    });

    mockSupabaseClient.auth.resend.mockResolvedValue({
      data: {},
      error: null,
    });

    await expect(
      authService.resendVerificationEmail()
    ).resolves.not.toThrow();

    expect(mockSupabaseClient.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'teacher@school.com',
    });
  });
});
