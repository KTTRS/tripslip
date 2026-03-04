import { vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Mock authentication services for testing
 * Provides comprehensive mocking for auth operations
 */

// Mock user data generators
export const mockAuthData = {
  user: (overrides: Partial<User> = {}): User => ({
    id: 'user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    phone: '+15550123456',
    phone_confirmed_at: '2024-01-01T00:00:00Z',
    confirmed_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-01T00:00:00Z',
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      full_name: 'Test User',
    },
    identities: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_anonymous: false,
    ...overrides,
  }),
  
  session: (user?: User, overrides: Partial<Session> = {}): Session => {
    const mockUser = user || mockAuthData.user();
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
      ...overrides,
    };
  },
  
  teacher: (overrides: any = {}): User => mockAuthData.user({
    id: 'teacher-123',
    email: 'teacher@school.edu',
    user_metadata: {
      full_name: 'Jane Teacher',
      role: 'teacher',
      school_id: 'school-123',
    },
    ...overrides,
  }),
  
  parent: (overrides: any = {}): User => mockAuthData.user({
    id: 'parent-123',
    email: 'parent@example.com',
    user_metadata: {
      full_name: 'John Parent',
      role: 'parent',
    },
    ...overrides,
  }),
  
  venueAdmin: (overrides: any = {}): User => mockAuthData.user({
    id: 'venue-admin-123',
    email: 'admin@venue.com',
    user_metadata: {
      full_name: 'Sarah Venue Admin',
      role: 'venue_admin',
      venue_id: 'venue-123',
    },
    ...overrides,
  }),
  
  schoolAdmin: (overrides: any = {}): User => mockAuthData.user({
    id: 'school-admin-123',
    email: 'admin@school.edu',
    user_metadata: {
      full_name: 'Mike School Admin',
      role: 'school_admin',
      school_id: 'school-123',
    },
    ...overrides,
  }),
};

// Mock auth responses
export const mockAuthResponses = {
  signUp: {
    success: (user?: User, session?: Session) => ({
      data: {
        user: user || mockAuthData.user(),
        session: session || mockAuthData.session(),
      },
      error: null,
    }),
    error: (message: string = 'Sign up failed') => ({
      data: { user: null, session: null },
      error: { message },
    }),
    emailNotConfirmed: () => ({
      data: {
        user: mockAuthData.user({ email_confirmed_at: null }),
        session: null,
      },
      error: null,
    }),
  },
  
  signIn: {
    success: (user?: User, session?: Session) => ({
      data: {
        user: user || mockAuthData.user(),
        session: session || mockAuthData.session(),
      },
      error: null,
    }),
    error: (message: string = 'Invalid credentials') => ({
      data: { user: null, session: null },
      error: { message },
    }),
    emailNotConfirmed: () => ({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed' },
    }),
  },
  
  signOut: {
    success: () => ({
      error: null,
    }),
    error: (message: string = 'Sign out failed') => ({
      error: { message },
    }),
  },
  
  getSession: {
    success: (session?: Session) => ({
      data: { session: session || mockAuthData.session() },
      error: null,
    }),
    noSession: () => ({
      data: { session: null },
      error: null,
    }),
    error: (message: string = 'Failed to get session') => ({
      data: { session: null },
      error: { message },
    }),
  },
  
  getUser: {
    success: (user?: User) => ({
      data: { user: user || mockAuthData.user() },
      error: null,
    }),
    noUser: () => ({
      data: { user: null },
      error: null,
    }),
    error: (message: string = 'Failed to get user') => ({
      data: { user: null },
      error: { message },
    }),
  },
  
  updateUser: {
    success: (user?: User) => ({
      data: { user: user || mockAuthData.user() },
      error: null,
    }),
    error: (message: string = 'Failed to update user') => ({
      data: { user: null },
      error: { message },
    }),
  },
  
  resetPassword: {
    success: () => ({
      data: {},
      error: null,
    }),
    error: (message: string = 'Failed to send reset email') => ({
      data: {},
      error: { message },
    }),
  },
};

// Mock auth state change callback
export const mockAuthStateChange = {
  signedIn: (user?: User, session?: Session) => ({
    event: 'SIGNED_IN' as const,
    session: session || mockAuthData.session(user),
  }),
  
  signedOut: () => ({
    event: 'SIGNED_OUT' as const,
    session: null,
  }),
  
  tokenRefreshed: (user?: User, session?: Session) => ({
    event: 'TOKEN_REFRESHED' as const,
    session: session || mockAuthData.session(user),
  }),
  
  userUpdated: (user?: User, session?: Session) => ({
    event: 'USER_UPDATED' as const,
    session: session || mockAuthData.session(user),
  }),
  
  passwordRecovery: (user?: User, session?: Session) => ({
    event: 'PASSWORD_RECOVERY' as const,
    session: session || mockAuthData.session(user),
  }),
};

// Helper to set up auth mocks
export const setupAuthMocks = (mockClient: any) => {
  // Clear all auth mocks
  Object.values(mockClient.auth).forEach((mock: any) => {
    if (typeof mock === 'function') {
      mock.mockClear();
    }
  });
  
  // Set up default successful responses
  mockClient.auth.signUp.mockResolvedValue(
    mockAuthResponses.signUp.success()
  );
  
  mockClient.auth.signInWithPassword.mockResolvedValue(
    mockAuthResponses.signIn.success()
  );
  
  mockClient.auth.signOut.mockResolvedValue(
    mockAuthResponses.signOut.success()
  );
  
  mockClient.auth.getSession.mockResolvedValue(
    mockAuthResponses.getSession.success()
  );
  
  mockClient.auth.getUser.mockResolvedValue(
    mockAuthResponses.getUser.success()
  );
  
  mockClient.auth.updateUser.mockResolvedValue(
    mockAuthResponses.updateUser.success()
  );
  
  mockClient.auth.resetPasswordForEmail.mockResolvedValue(
    mockAuthResponses.resetPassword.success()
  );
  
  return mockClient.auth;
};

// Helper to simulate auth scenarios
export const simulateAuthScenarios = {
  signUp: {
    success: (mockClient: any, user?: User) => {
      mockClient.auth.signUp.mockResolvedValueOnce(
        mockAuthResponses.signUp.success(user)
      );
    },
    
    emailExists: (mockClient: any) => {
      mockClient.auth.signUp.mockResolvedValueOnce(
        mockAuthResponses.signUp.error('User already registered')
      );
    },
    
    weakPassword: (mockClient: any) => {
      mockClient.auth.signUp.mockResolvedValueOnce(
        mockAuthResponses.signUp.error('Password should be at least 6 characters')
      );
    },
    
    emailNotConfirmed: (mockClient: any) => {
      mockClient.auth.signUp.mockResolvedValueOnce(
        mockAuthResponses.signUp.emailNotConfirmed()
      );
    },
  },
  
  signIn: {
    success: (mockClient: any, user?: User) => {
      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockAuthResponses.signIn.success(user)
      );
    },
    
    invalidCredentials: (mockClient: any) => {
      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockAuthResponses.signIn.error('Invalid login credentials')
      );
    },
    
    emailNotConfirmed: (mockClient: any) => {
      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockAuthResponses.signIn.emailNotConfirmed()
      );
    },
    
    tooManyRequests: (mockClient: any) => {
      mockClient.auth.signInWithPassword.mockResolvedValueOnce(
        mockAuthResponses.signIn.error('Too many requests')
      );
    },
  },
  
  session: {
    valid: (mockClient: any, session?: Session) => {
      mockClient.auth.getSession.mockResolvedValueOnce(
        mockAuthResponses.getSession.success(session)
      );
    },
    
    expired: (mockClient: any) => {
      mockClient.auth.getSession.mockResolvedValueOnce(
        mockAuthResponses.getSession.noSession()
      );
    },
    
    invalid: (mockClient: any) => {
      mockClient.auth.getSession.mockResolvedValueOnce(
        mockAuthResponses.getSession.error('Invalid session')
      );
    },
  },
  
  user: {
    authenticated: (mockClient: any, user?: User) => {
      mockClient.auth.getUser.mockResolvedValueOnce(
        mockAuthResponses.getUser.success(user)
      );
    },
    
    unauthenticated: (mockClient: any) => {
      mockClient.auth.getUser.mockResolvedValueOnce(
        mockAuthResponses.getUser.noUser()
      );
    },
    
    tokenExpired: (mockClient: any) => {
      mockClient.auth.getUser.mockResolvedValueOnce(
        mockAuthResponses.getUser.error('JWT expired')
      );
    },
  },
};