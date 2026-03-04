import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock Supabase client for testing
 * Provides comprehensive mocking for all Supabase operations
 */

// Helper to create a complete query builder mock
export function createQueryBuilderMock(overrides: any = {}) {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
    geojson: vi.fn(),
    explain: vi.fn(),
    rollback: vi.fn(),
    returns: vi.fn().mockReturnThis(),
    ...overrides,
  };
  return mock;
}

// Helper to create an awaitable query builder that resolves to { data, error } structure
export function createAwaitableSupabaseQuery(data: any, error: any = null) {
  const result = { data, error };
  
  const builder: any = createQueryBuilderMock();
  
  // Make the builder thenable so it can be awaited
  builder.then = function(resolve: any, reject: any) {
    return Promise.resolve(result).then(resolve, reject);
  };
  
  return builder;
}

// Mock Supabase client
export const createMockSupabaseClient = (overrides: Partial<SupabaseClient> = {}): SupabaseClient => {
  const mockClient = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithIdToken: vi.fn(),
      signInWithSSO: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      setSession: vi.fn(),
      refreshSession: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      verifyOtp: vi.fn(),
      resend: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      mfa: {
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        challengeAndVerify: vi.fn(),
        unenroll: vi.fn(),
        getAuthenticatorAssuranceLevel: vi.fn(),
      },
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      startAutoRefresh: vi.fn(),
      stopAutoRefresh: vi.fn(),
    },
    from: vi.fn(() => createQueryBuilderMock()),
    schema: vi.fn(() => ({ from: vi.fn(() => createQueryBuilderMock()) })),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        move: vi.fn(),
        copy: vi.fn(),
        remove: vi.fn(),
        createSignedUrl: vi.fn(),
        createSignedUrls: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
      listBuckets: vi.fn(),
      getBucket: vi.fn(),
      createBucket: vi.fn(),
      updateBucket: vi.fn(),
      deleteBucket: vi.fn(),
      emptyBucket: vi.fn(),
    },
    realtime: {
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
        send: vi.fn(),
      })),
      removeChannel: vi.fn(),
      removeAllChannels: vi.fn(),
      getChannels: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
    ...overrides,
  } as unknown as SupabaseClient;

  return mockClient;
};

// Common mock responses
export const mockSupabaseResponses = {
  success: (data: any) => ({ data, error: null }),
  error: (message: string, code?: string) => ({ 
    data: null, 
    error: { message, code: code || 'MOCK_ERROR' } 
  }),
  authSuccess: (user: any, session: any) => ({
    data: { user, session },
    error: null,
  }),
  authError: (message: string) => ({
    data: { user: null, session: null },
    error: { message },
  }),
};

// Mock data generators
export const mockData = {
  user: (overrides: any = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  session: (overrides: any = {}) => ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockData.user(),
    ...overrides,
  }),
  venue: (overrides: any = {}) => ({
    id: 'venue-123',
    name: 'Test Museum',
    description: 'A test museum for educational trips',
    address: '123 Test St, Test City, TC 12345',
    phone: '+1-555-0123',
    email: 'info@testmuseum.com',
    website: 'https://testmuseum.com',
    category: 'museum',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  experience: (overrides: any = {}) => ({
    id: 'exp-123',
    venue_id: 'venue-123',
    title: 'Dinosaur Discovery Tour',
    description: 'Interactive tour of our dinosaur exhibits',
    duration_minutes: 90,
    max_participants: 30,
    price_cents: 1500,
    age_range_min: 8,
    age_range_max: 18,
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  trip: (overrides: any = {}) => ({
    id: 'trip-123',
    title: 'Science Field Trip',
    venue_id: 'venue-123',
    experience_id: 'exp-123',
    teacher_id: 'teacher-123',
    school_id: 'school-123',
    trip_date: '2024-06-15',
    estimated_cost_cents: 1500,
    max_participants: 25,
    status: 'draft',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
  permissionSlip: (overrides: any = {}) => ({
    id: 'slip-123',
    trip_id: 'trip-123',
    student_name: 'John Doe',
    parent_name: 'Jane Doe',
    parent_email: 'jane@example.com',
    parent_phone: '+1-555-0123',
    status: 'pending',
    signed_at: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }),
};