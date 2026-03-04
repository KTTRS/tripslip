import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables for tests
beforeAll(() => {
  // Set default test environment variables
  process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://test.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key';
  process.env.VITE_STRIPE_PUBLISHABLE_KEY = process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_123';
  
  // Mock console methods in tests to reduce noise
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  // Clear any DOM changes
  document.body.innerHTML = '';
});

// Restore all mocks after tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Global test utilities
declare global {
  var testUtils: {
    mockConsole: {
      log: ReturnType<typeof vi.spyOn>;
      warn: ReturnType<typeof vi.spyOn>;
      error: ReturnType<typeof vi.spyOn>;
    };
  };
}

globalThis.testUtils = {
  mockConsole: {
    log: vi.spyOn(console, 'log'),
    warn: vi.spyOn(console, 'warn'),
    error: vi.spyOn(console, 'error'),
  },
};