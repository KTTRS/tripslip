import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Helper to create a complete query builder mock
export function createQueryBuilderMock(overrides: any = {}) {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    ...overrides,
  };
  return mock;
}

// Helper to create an awaitable query builder that resolves to data
export function createAwaitableQueryBuilder(resolveValue: any) {
  const builder = createQueryBuilderMock();
  
  // Make the builder thenable so it can be awaited
  (builder as any).then = function(resolve: any, reject: any) {
    return Promise.resolve(resolveValue).then(resolve, reject);
  };
  
  return builder;
}

// Helper to create an awaitable query builder that resolves to { data, error } structure
export function createAwaitableSupabaseQuery(data: any, error: any = null) {
  const result = { data, error };
  
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: function(resolve: any) {
      return Promise.resolve(result).then(resolve);
    },
  };
  
  // Make all methods return the same builder so chaining works
  builder.select.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.upsert.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.single.mockReturnValue(builder);
  builder.maybeSingle.mockReturnValue(builder);
  
  return builder;
}

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    verifyOtp: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    refreshSession: vi.fn(),
    resend: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  from: vi.fn(() => createQueryBuilderMock()),
  rpc: vi.fn(),
};

// Setup before all tests
beforeAll(() => {
  // Mock environment variables
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
