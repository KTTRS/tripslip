// Test utilities and helpers
export * from './mocks';
export * from './fixtures';
export * from './helpers';
export * from './database-helpers';
export * from './auth-helpers';
export * from './component-helpers';
export * from './property-test-helpers';
export * from './setup';

// Re-export commonly used testing libraries
export { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';
export { vi, expect, describe, it, test, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
export { fc } from 'fast-check';