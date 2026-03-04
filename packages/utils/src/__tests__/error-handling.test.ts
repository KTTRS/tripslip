import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAsyncErrorHandling, withSyncErrorHandling, withRetry } from '../error-handling';
import { TripSlipError } from '../errors';
import { logger } from '../logger';

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Error Handling Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withAsyncErrorHandling', () => {
    it('should return data when operation succeeds', async () => {
      const operation = async () => 'success';
      const result = await withAsyncErrorHandling(operation, 'test operation');

      expect(result.data).toBe('success');
      expect(result.error).toBeNull();
    });

    it('should return error when operation fails', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };
      const result = await withAsyncErrorHandling(operation, 'test operation');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Test error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error in test operation',
        expect.any(Error),
        { context: 'test operation' }
      );
    });

    it('should convert non-Error throws to Error', async () => {
      const operation = async () => {
        throw 'string error';
      };
      const result = await withAsyncErrorHandling(operation, 'test operation');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('string error');
    });
  });

  describe('withSyncErrorHandling', () => {
    it('should return data when operation succeeds', () => {
      const operation = () => 'success';
      const result = withSyncErrorHandling(operation, 'test operation');

      expect(result.data).toBe('success');
      expect(result.error).toBeNull();
    });

    it('should return error when operation fails', () => {
      const operation = () => {
        throw new Error('Test error');
      };
      const result = withSyncErrorHandling(operation, 'test operation');

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Test error');
    });
  });

  describe('withRetry', () => {
    it('should return data on first success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await withRetry(operation, 'test operation', 3, 100);

      expect(result.data).toBe('success');
      expect(result.error).toBeNull();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, 'test operation', 3, 10);

      expect(result.data).toBe('success');
      expect(result.error).toBeNull();
      expect(operation).toHaveBeenCalledTimes(3);
      expect(logger.info).toHaveBeenCalledWith('test operation succeeded after 2 retries');
    });

    it('should return error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));
      const result = await withRetry(operation, 'test operation', 2, 10);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('Persistent error');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(logger.error).toHaveBeenCalledWith(
        'test operation failed after 2 retries',
        expect.any(Error)
      );
    });

    it('should not retry on authentication errors', async () => {
      const authError = new TripSlipError('Unauthorized', 'AUTH_ERROR', 401);
      const operation = vi.fn().mockRejectedValue(authError);
      const result = await withRetry(operation, 'test operation', 3, 10);

      expect(result.data).toBeNull();
      expect(result.error).toBe(authError);
      expect(operation).toHaveBeenCalledTimes(1); // No retries
      expect(logger.warn).toHaveBeenCalledWith(
        'test operation failed with non-retryable error: AUTH_ERROR'
      );
    });

    it('should not retry on validation errors', async () => {
      const validationError = new TripSlipError('Invalid input', 'VALIDATION_ERROR', 400);
      const operation = vi.fn().mockRejectedValue(validationError);
      const result = await withRetry(operation, 'test operation', 3, 10);

      expect(result.data).toBeNull();
      expect(result.error).toBe(validationError);
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });

    it('should not retry on not found errors', async () => {
      const notFoundError = new TripSlipError('Not found', 'NOT_FOUND', 404);
      const operation = vi.fn().mockRejectedValue(notFoundError);
      const result = await withRetry(operation, 'test operation', 3, 10);

      expect(result.data).toBeNull();
      expect(result.error).toBe(notFoundError);
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });

    it('should use exponential backoff', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(operation, 'test operation', 3, 50);
      const duration = Date.now() - startTime;

      // Should wait 50ms + 100ms = 150ms minimum
      expect(duration).toBeGreaterThanOrEqual(140); // Allow some margin
    });
  });
});
