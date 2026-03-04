/**
 * Authentication testing helpers
 * Provides utilities for testing authentication flows and RBAC
 */

import { vi } from 'vitest';
import { mockAuthData, mockAuthResponses, setupAuthMocks } from './mocks/auth-mocks';
import type { User, Session } from '@supabase/supabase-js';

// Authentication test helpers
export const authHelpers = {
  // Create mock authenticated user
  createMockUser: (role: string = 'teacher', overrides: any = {}): User => {
    const baseUser = mockAuthData[role as keyof typeof mockAuthData] || mockAuthData.user();
    return { ...baseUser, ...overrides };
  },
  
  // Create mock session
  createMockSession: (user?: User, overrides: any = {}): Session => {
    return mockAuthData.session(user, overrides);
  },
  
  // Set up authenticated state
  setupAuthenticatedState: (mockClient: any, user?: User, session?: Session) => {
    const mockUser = user || authHelpers.createMockUser();
    const mockSession = session || authHelpers.createMockSession(mockUser);
    
    setupAuthMocks(mockClient);
    
    // Override with successful authentication
    mockClient.auth.getUser.mockResolvedValue(
      mockAuthResponses.getUser.success(mockUser)
    );
    
    mockClient.auth.getSession.mockResolvedValue(
      mockAuthResponses.getSession.success(mockSession)
    );
    
    return { user: mockUser, session: mockSession };
  },
  
  // Set up unauthenticated state
  setupUnauthenticatedState: (mockClient: any) => {
    setupAuthMocks(mockClient);
    
    mockClient.auth.getUser.mockResolvedValue(
      mockAuthResponses.getUser.noUser()
    );
    
    mockClient.auth.getSession.mockResolvedValue(
      mockAuthResponses.getSession.noSession()
    );
  },
  
  // Test authentication flow
  testAuthFlow: async (
    authFunction: (client: any, credentials: any) => Promise<any>,
    mockClient: any,
    credentials: any,
    expectedUser: User
  ) => {
    // Set up successful sign in
    mockClient.auth.signInWithPassword.mockResolvedValueOnce(
      mockAuthResponses.signIn.success(expectedUser)
    );
    
    const result = await authFunction(mockClient, credentials);
    
    expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
    expect(result.user).toEqual(expectedUser);
  },
  
  // Test authentication error handling
  testAuthError: async (
    authFunction: (client: any, credentials: any) => Promise<any>,
    mockClient: any,
    credentials: any,
    expectedError: string
  ) => {
    mockClient.auth.signInWithPassword.mockResolvedValueOnce(
      mockAuthResponses.signIn.error(expectedError)
    );
    
    await expect(authFunction(mockClient, credentials)).rejects.toThrow(expectedError);
  },
  
  // Test session validation
  testSessionValidation: async (
    validateFunction: (client: any) => Promise<boolean>,
    mockClient: any,
    validSession: boolean
  ) => {
    if (validSession) {
      mockClient.auth.getSession.mockResolvedValueOnce(
        mockAuthResponses.getSession.success()
      );
    } else {
      mockClient.auth.getSession.mockResolvedValueOnce(
        mockAuthResponses.getSession.noSession()
      );
    }
    
    const result = await validateFunction(mockClient);
    expect(result).toBe(validSession);
  },
  
  // Test token refresh
  testTokenRefresh: async (
    refreshFunction: (client: any) => Promise<Session>,
    mockClient: any,
    newSession: Session
  ) => {
    mockClient.auth.refreshSession.mockResolvedValueOnce({
      data: { session: newSession },
      error: null,
    });
    
    const result = await refreshFunction(mockClient);
    expect(result).toEqual(newSession);
  },
};

// Role-based access control (RBAC) helpers
export const rbacHelpers = {
  // Test role permissions
  testRolePermissions: (
    hasPermission: (user: User, resource: string, action: string) => boolean,
    user: User,
    permissions: Array<{ resource: string; action: string; expected: boolean }>
  ) => {
    permissions.forEach(({ resource, action, expected }) => {
      const result = hasPermission(user, resource, action);
      expect(result).toBe(expected);
    });
  },
  
  // Test resource ownership
  testResourceOwnership: (
    canAccess: (user: User, resource: any) => boolean,
    user: User,
    ownedResource: any,
    notOwnedResource: any
  ) => {
    expect(canAccess(user, ownedResource)).toBe(true);
    expect(canAccess(user, notOwnedResource)).toBe(false);
  },
  
  // Test role hierarchy
  testRoleHierarchy: (
    hasHigherRole: (user1: User, user2: User) => boolean,
    adminUser: User,
    teacherUser: User,
    parentUser: User
  ) => {
    expect(hasHigherRole(adminUser, teacherUser)).toBe(true);
    expect(hasHigherRole(adminUser, parentUser)).toBe(true);
    expect(hasHigherRole(teacherUser, parentUser)).toBe(true);
    expect(hasHigherRole(teacherUser, adminUser)).toBe(false);
  },
  
  // Test context-based permissions
  testContextPermissions: (
    hasContextPermission: (user: User, context: any, action: string) => boolean,
    user: User,
    contexts: Array<{ context: any; action: string; expected: boolean }>
  ) => {
    contexts.forEach(({ context, action, expected }) => {
      const result = hasContextPermission(user, context, action);
      expect(result).toBe(expected);
    });
  },
  
  // Create role-specific users for testing
  createRoleUsers: () => ({
    teacher: authHelpers.createMockUser('teacher', {
      user_metadata: { role: 'teacher', school_id: 'school-123' },
    }),
    parent: authHelpers.createMockUser('parent', {
      user_metadata: { role: 'parent' },
    }),
    venueAdmin: authHelpers.createMockUser('venueAdmin', {
      user_metadata: { role: 'venue_admin', venue_id: 'venue-123' },
    }),
    schoolAdmin: authHelpers.createMockUser('schoolAdmin', {
      user_metadata: { role: 'school_admin', school_id: 'school-123' },
    }),
    superAdmin: authHelpers.createMockUser('teacher', {
      user_metadata: { role: 'super_admin' },
    }),
  }),
};

// Authentication context helpers
export const authContextHelpers = {
  // Mock authentication context
  createMockAuthContext: (user?: User, loading: boolean = false) => ({
    user,
    session: user ? authHelpers.createMockSession(user) : null,
    loading,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    updateUser: vi.fn(),
    resetPassword: vi.fn(),
    refreshSession: vi.fn(),
  }),
  
  // Test authentication context provider
  testAuthProvider: (
    AuthProvider: any,
    initialState: { user?: User; loading?: boolean } = {}
  ) => {
    const mockContext = authContextHelpers.createMockAuthContext(
      initialState.user,
      initialState.loading
    );
    
    return {
      Provider: AuthProvider,
      mockContext,
      expectUserState: (expectedUser?: User) => {
        expect(mockContext.user).toEqual(expectedUser || null);
      },
      expectLoadingState: (expectedLoading: boolean) => {
        expect(mockContext.loading).toBe(expectedLoading);
      },
    };
  },
  
  // Test authentication hooks
  testAuthHook: (
    useAuth: () => any,
    expectedState: { user?: User; loading?: boolean }
  ) => {
    const authState = useAuth();
    
    expect(authState.user).toEqual(expectedState.user || null);
    expect(authState.loading).toBe(expectedState.loading || false);
    
    return authState;
  },
  
  // Test protected routes
  testProtectedRoute: (
    ProtectedRoute: any,
    user?: User,
    expectedRedirect?: string
  ) => {
    const mockContext = authContextHelpers.createMockAuthContext(user);
    
    if (user) {
      // Should render the protected content
      expect(ProtectedRoute).toBeDefined();
    } else {
      // Should redirect to login or show unauthorized
      expect(expectedRedirect).toBeDefined();
    }
  },
};

// Multi-factor authentication helpers
export const mfaHelpers = {
  // Test MFA enrollment
  testMfaEnrollment: async (
    enrollMfa: (client: any, factorType: string) => Promise<any>,
    mockClient: any,
    factorType: string = 'totp'
  ) => {
    const mockEnrollResponse = {
      data: {
        id: 'factor-123',
        type: factorType,
        status: 'unverified',
        totp: {
          qr_code: 'data:image/png;base64,mock-qr-code',
          secret: 'mock-secret',
          uri: 'otpauth://totp/TripSlip:user@example.com?secret=mock-secret',
        },
      },
      error: null,
    };
    
    mockClient.auth.mfa.enroll.mockResolvedValueOnce(mockEnrollResponse);
    
    const result = await enrollMfa(mockClient, factorType);
    expect(result.data.type).toBe(factorType);
    expect(result.data.totp.qr_code).toBeDefined();
  },
  
  // Test MFA challenge
  testMfaChallenge: async (
    challengeMfa: (client: any, factorId: string) => Promise<any>,
    mockClient: any,
    factorId: string = 'factor-123'
  ) => {
    const mockChallengeResponse = {
      data: {
        id: 'challenge-123',
        type: 'totp',
        expires_at: Date.now() + 300000, // 5 minutes
      },
      error: null,
    };
    
    mockClient.auth.mfa.challenge.mockResolvedValueOnce(mockChallengeResponse);
    
    const result = await challengeMfa(mockClient, factorId);
    expect(result.data.id).toBe('challenge-123');
  },
  
  // Test MFA verification
  testMfaVerification: async (
    verifyMfa: (client: any, challengeId: string, code: string) => Promise<any>,
    mockClient: any,
    challengeId: string = 'challenge-123',
    code: string = '123456'
  ) => {
    const mockVerifyResponse = {
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: authHelpers.createMockUser(),
      },
      error: null,
    };
    
    mockClient.auth.mfa.verify.mockResolvedValueOnce(mockVerifyResponse);
    
    const result = await verifyMfa(mockClient, challengeId, code);
    expect(result.data.access_token).toBeDefined();
  },
};

// Password security helpers
export const passwordHelpers = {
  // Test password strength validation
  testPasswordStrength: (
    validatePassword: (password: string) => { isValid: boolean; errors: string[] },
    testCases: Array<{ password: string; expectedValid: boolean; expectedErrors?: string[] }>
  ) => {
    testCases.forEach(({ password, expectedValid, expectedErrors }) => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(expectedValid);
      
      if (expectedErrors) {
        expectedErrors.forEach(error => {
          expect(result.errors).toContain(error);
        });
      }
    });
  },
  
  // Test password hashing
  testPasswordHashing: async (
    hashPassword: (password: string) => Promise<string>,
    verifyPassword: (password: string, hash: string) => Promise<boolean>,
    password: string = 'TestPassword123!'
  ) => {
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  },
  
  // Test password reset flow
  testPasswordReset: async (
    requestReset: (client: any, email: string) => Promise<any>,
    resetPassword: (client: any, token: string, newPassword: string) => Promise<any>,
    mockClient: any,
    email: string = 'test@example.com',
    newPassword: string = 'NewPassword123!'
  ) => {
    // Test reset request
    mockClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: {},
      error: null,
    });
    
    await requestReset(mockClient, email);
    expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(email);
    
    // Test password update
    mockClient.auth.updateUser.mockResolvedValueOnce({
      data: { user: authHelpers.createMockUser() },
      error: null,
    });
    
    const token = 'reset-token-123';
    await resetPassword(mockClient, token, newPassword);
    expect(mockClient.auth.updateUser).toHaveBeenCalledWith({
      password: newPassword,
    });
  },
};