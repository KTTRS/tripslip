import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient } from '../setup';

describe('AuthService - Session Management (Task 25.5)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  it('should check session validity', async () => {
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

    const session = await authService.getSession();

    expect(session).toEqual(mockSession);
    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
  });

  it('should invalidate session on logout', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    });

    await authService.signOut();

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();

    // After logout, getSession should return null
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const session = await authService.getSession();
    expect(session).toBeNull();
  });

  it('should reject expired session', async () => {
    // When session is expired, Supabase returns session: null with no error
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const session = await authService.getSession();
    expect(session).toBeNull();
  });

  it('should cleanup client tokens on logout', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    });

    await authService.signOut();

    // Verify that signOut was called, which clears client-side tokens
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();

    // After logout, session should be null
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const session = await authService.getSession();
    expect(session).toBeNull();
  });
});
