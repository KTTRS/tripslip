/**
 * Global test configuration for TripSlip monorepo
 * Provides centralized test setup and configuration
 */

import { defineConfig } from 'vitest/config';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from root .env file
config({ path: path.resolve(__dirname, '../.env') });

export const testConfig = defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      path.resolve(__dirname, './setup.ts'),
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
        '**/mocks/**',
        '**/fixtures/**',
        '**/*.config.*',
        '**/coverage/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      perFile: true,
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    // Retry flaky tests
    retry: 2,
    // Run tests in parallel
    threads: true,
    maxThreads: 4,
    minThreads: 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
      '@tripslip/test-utils': path.resolve(__dirname, '../packages/test-utils/src'),
      '@tripslip/database': path.resolve(__dirname, '../packages/database/src'),
      '@tripslip/auth': path.resolve(__dirname, '../packages/auth/src'),
      '@tripslip/utils': path.resolve(__dirname, '../packages/utils/src'),
      '@tripslip/ui': path.resolve(__dirname, '../packages/ui/src'),
      '@tripslip/i18n': path.resolve(__dirname, '../packages/i18n/src'),
    },
  },
  define: {
    // Define global constants for tests
    __TEST__: true,
    __DEV__: false,
    __PROD__: false,
  },
});

export default testConfig;