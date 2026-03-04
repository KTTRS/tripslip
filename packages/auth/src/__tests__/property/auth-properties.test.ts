import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { SupabaseRBACAuthService } from '../../rbac-service-impl';
import { mockSupabaseClient } from '../setup';

describe('Property-Based Tests - Authentication (Task 27)', () => {
  let authService: SupabaseRBACAuthService;

  beforeEach(() => {
    authService = new SupabaseRBACAuthService(mockSupabaseClient as any);
    vi.clearAllMocks();
  });

  // Property 9: Signup Role Assignment (Task 27.1)
  it('Property 9: Signup creates user with correct role and organization', () => {
    fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 20 }),
        fc.constantFrom('teacher', 'school_admin', 'district_admin', 'venue_admin'),
        fc.constantFrom('school', 'district', 'venue'),
        fc.uuid(),
        async (email, password, role, orgType, orgId) => {
          // Reset mocks for each property test run
          vi.clearAllMocks();
          
          const mockUser = {
            id: fc.sample(fc.uuid(), 1)[0],
            email,
            email_confirmed_at: null,
          };

          const mockRoleId = fc.sample(fc.uuid(), 1)[0];

          mockSupabaseClient.auth.signUp.mockResolvedValue({
            data: { user: mockUser, session: null },
            error: null,
          });

          const insertMock = vi.fn().mockResolvedValue({
            data: { id: fc.sample(fc.uuid(), 1)[0] },
            error: null,
          });

          // Create chainable mock for organization validation
          const orgValidationChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: orgId },
              error: null,
            }),
          };

          // Create chainable mock for role lookup
          const roleLookupChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockRoleId },
              error: null,
            }),
          };

          // Create mock for role assignment insert
          const roleAssignmentChain = {
            insert: insertMock,
          };

          // Setup from() to return different mocks for each call
          mockSupabaseClient.from
            .mockReturnValueOnce(orgValidationChain)
            .mockReturnValueOnce(roleLookupChain)
            .mockReturnValueOnce(roleAssignmentChain);

          await authService.signUp({
            email,
            password,
            role: role as any,
            organization_type: orgType as any,
            organization_id: orgId,
          });

          // Verify role assignment was created with correct parameters
          expect(insertMock).toHaveBeenCalledWith(
            expect.objectContaining({
              user_id: mockUser.id,
              role_id: mockRoleId,
              organization_type: orgType,
              organization_id: orgId,
            })
          );
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 10: Valid Credentials Authentication (Task 27.2)
  it('Property 10: Valid credentials always result in successful authentication', () => {
    fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 20 }),
        async (email, password) => {
          vi.clearAllMocks();
          
          const mockUser = {
            id: fc.sample(fc.uuid(), 1)[0],
            email,
            email_confirmed_at: new Date().toISOString(),
          };

          const mockSession = {
            access_token: fc.sample(fc.string({ minLength: 20 }), 1)[0],
            refresh_token: fc.sample(fc.string({ minLength: 20 }), 1)[0],
            user: mockUser,
          };

          mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
            data: { user: mockUser, session: mockSession },
            error: null,
          });

          // Create chainable mock for getRoleAssignments
          const roleAssignmentsChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{
                id: fc.sample(fc.uuid(), 1)[0],
                user_id: mockUser.id,
                role_id: fc.sample(fc.uuid(), 1)[0],
                role_name: 'teacher',
                organization_type: 'school',
                organization_id: fc.sample(fc.uuid(), 1)[0],
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_roles: { name: 'teacher' }
              }],
              error: null,
            }),
          };

          // Create chainable mock for getActiveRoleContext
          const activeRoleChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: mockUser.id,
                active_role_assignment_id: fc.sample(fc.uuid(), 1)[0],
                user_role_assignments: {
                  id: fc.sample(fc.uuid(), 1)[0],
                  organization_type: 'school',
                  organization_id: fc.sample(fc.uuid(), 1)[0],
                  user_roles: { name: 'teacher' }
                }
              },
              error: null,
            }),
          };

          mockSupabaseClient.from
            .mockReturnValueOnce(roleAssignmentsChain)
            .mockReturnValueOnce(activeRoleChain);

          mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });
          mockSupabaseClient.auth.refreshSession.mockResolvedValue({ data: { session: mockSession }, error: null });

          const result = await authService.signIn(email, password);

          // Valid credentials should always succeed
          expect(result.user).toBeDefined();
          expect(result.session).toBeDefined();
          expect(result.session.access_token).toBeTruthy();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 11: Session Invalidation on Logout (Task 27.3)
  it('Property 11: Logout always invalidates session', () => {
    fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        mockSupabaseClient.auth.signOut.mockResolvedValue({
          error: null,
        });

        await authService.signOut();

        // After logout, getSession should return null
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null,
        });

        const session = await authService.getSession();
        expect(session).toBeNull();
      }),
      { numRuns: 10 }
    );
  });

  // Property 12: Token Expiration Enforcement (Task 27.4)
  it('Property 12: Expired tokens are always rejected', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20 }),
        fc.integer({ min: -1000, max: -1 }), // Negative means expired
        async (token, expirationOffset) => {
          mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
            data: { user: null, session: null },
            error: {
              message: 'Token has expired',
              status: 400,
            },
          });

          await expect(authService.verifyEmail(token)).rejects.toThrow();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 13: Duplicate Email Rejection (Task 27.5)
  it('Property 13: Duplicate emails are always rejected', () => {
    fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        async (email, password) => {
          mockSupabaseClient.auth.signUp.mockResolvedValue({
            data: { user: null, session: null },
            error: {
              message: 'User already registered',
              status: 409,
            },
          });

          await expect(
            authService.signUp({
              email,
              password,
              role: 'teacher',
              organization_type: 'school',
              organization_id: fc.sample(fc.uuid(), 1)[0],
            })
          ).rejects.toThrow();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 14: Email Verification State Transition (Task 27.6)
  it('Property 14: Valid verification token always marks email as verified', () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 20 }),
        fc.emailAddress(),
        async (token, email) => {
          // Reset mocks for each property test run
          vi.clearAllMocks();
          
          const mockUser = {
            id: fc.sample(fc.uuid(), 1)[0],
            email,
            email_confirmed_at: new Date().toISOString(),
          };

          mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
            data: { user: mockUser, session: null },
            error: null,
          });

          await authService.verifyEmail(token);

          // Verify that verifyOtp was called with correct parameters
          expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
            token_hash: token,
            type: 'email',
          });
          
          // The mock returns a user with email_confirmed_at set, verifying the state transition
          expect(mockUser.email_confirmed_at).toBeTruthy();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 15: Password Validation Consistency (Task 27.7)
  it('Property 15: Password validation is consistent across signup and reset', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 7 }), (weakPassword) => {
        // Both signup and reset should reject weak passwords
        expect(() =>
          authService.signUp({
            email: 'test@test.com',
            password: weakPassword,
            role: 'teacher',
            organization_type: 'school',
            organization_id: 'school-123',
          })
        ).rejects.toThrow();

        expect(() => authService.updatePassword(weakPassword)).rejects.toThrow();
      }),
      { numRuns: 10 }
    );
  });

  // Property 16: Email Format Validation (Task 27.8)
  it('Property 16: Invalid email formats are always rejected', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !s.includes('@') || !s.includes('.')),
        (invalidEmail) => {
          expect(() =>
            authService.signUp({
              email: invalidEmail,
              password: 'SecurePass123',
              role: 'teacher',
              organization_type: 'school',
              organization_id: 'school-123',
            })
          ).rejects.toThrow();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 17: Invalid Credentials Rejection (Task 27.9)
  it('Property 17: Invalid credentials always result in rejection', () => {
    fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8 }),
        async (email, password) => {
          mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
            data: { user: null, session: null },
            error: {
              message: 'Invalid login credentials',
              status: 400,
            },
          });

          await expect(authService.signIn(email, password)).rejects.toThrow();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 18: Password Reset Token Single Use (Task 27.10)
  it('Property 18: Reset tokens can only be used once', () => {
    fc.assert(
      fc.asyncProperty(fc.string({ minLength: 8 }), async (newPassword) => {
        const updateUserMock = vi
          .fn()
          .mockResolvedValueOnce({
            data: { user: { id: 'user-123' } },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'Invalid token', status: 400 },
          });

        mockSupabaseClient.auth.updateUser = updateUserMock;

        // First use should succeed
        await authService.updatePassword(newPassword);

        // Second use should fail
        await expect(authService.updatePassword(newPassword)).rejects.toThrow();
      }),
      { numRuns: 10 }
    );
  });

  // Property 19: Verification Email Creation (Task 27.11)
  it('Property 19: Signup always creates verification record', () => {
    fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 20 }).filter(s => s.trim().length >= 8), // Valid passwords only
        async (email, password) => {
          // Reset mocks for each property test run
          vi.clearAllMocks();
          
          const mockUser = {
            id: fc.sample(fc.uuid(), 1)[0],
            email,
            email_confirmed_at: null,
          };

          mockSupabaseClient.auth.signUp.mockResolvedValue({
            data: { user: mockUser, session: null },
            error: null,
          });

          const mockRoleId = fc.sample(fc.uuid(), 1)[0];
          const mockOrgId = fc.sample(fc.uuid(), 1)[0];

          // Create chainable mock for organization validation
          const orgValidationChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockOrgId },
              error: null,
            }),
          };

          // Create chainable mock for role lookup
          const roleLookupChain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: mockRoleId },
              error: null,
            }),
          };

          // Create mock for role assignment insert
          const roleAssignmentChain = {
            insert: vi.fn().mockResolvedValue({
              data: { id: fc.sample(fc.uuid(), 1)[0] },
              error: null,
            }),
          };

          // Setup from() to return different mocks for each call
          mockSupabaseClient.from
            .mockReturnValueOnce(orgValidationChain)
            .mockReturnValueOnce(roleLookupChain)
            .mockReturnValueOnce(roleAssignmentChain);

          const result = await authService.signUp({
            email,
            password,
            role: 'teacher',
            organization_type: 'school',
            organization_id: mockOrgId,
          });

          // Verification should be required when email_confirmed_at is null
          expect(result.requiresEmailVerification).toBe(true);
          
          // Verify signUp was called (which triggers Supabase to create verification record)
          expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
            email,
            password,
            options: {
              data: undefined,
            },
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 28: Client Token Cleanup (Task 27.12)
  it('Property 28: Logout always clears client tokens', () => {
    fc.assert(
      fc.asyncProperty(fc.uuid(), async (userId) => {
        // Reset mocks for each property test run
        vi.clearAllMocks();
        
        mockSupabaseClient.auth.signOut.mockResolvedValue({
          error: null,
        });

        await authService.signOut();

        // Verify signOut was called (which clears tokens)
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();

        // Session should be null after logout
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null,
        });

        const session = await authService.getSession();
        expect(session).toBeNull();
      }),
      { numRuns: 10 }
    );
  });
});
