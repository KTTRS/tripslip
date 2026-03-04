/**
 * Retry Logic Utility
 * 
 * Provides functions for implementing retry logic with exponential backoff and jitter.
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitterMs?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterMs: 100,
  shouldRetry: (error: Error, attempt: number) => {
    // Don't retry on permanent failures
    const permanentErrors = ['ValidationError', 'AuthenticationError', 'AuthorizationError'];
    return !permanentErrors.includes(error.name) && attempt < 5;
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 * 
 * @param attempt - Current attempt number (0-based)
 * @param options - Retry options
 * @returns Delay in milliseconds
 */
export function calculateDelay(attempt: number, options: RetryOptions = {}): number {
  const {
    baseDelayMs = DEFAULT_RETRY_OPTIONS.baseDelayMs,
    maxDelayMs = DEFAULT_RETRY_OPTIONS.maxDelayMs,
    backoffMultiplier = DEFAULT_RETRY_OPTIONS.backoffMultiplier,
    jitterMs = DEFAULT_RETRY_OPTIONS.jitterMs,
  } = options;

  // Calculate exponential backoff
  const exponentialDelay = baseDelayMs * Math.pow(backoffMultiplier, attempt);

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * jitterMs;

  // Cap at maximum delay
  const totalDelay = Math.min(exponentialDelay + jitter, maxDelayMs);

  return Math.floor(totalDelay);
}

/**
 * Sleep for specified duration
 * 
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 * 
 * @param operation - Async function to retry
 * @param options - Retry options
 * @returns Promise with retry result
 * 
 * @example
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3, baseDelayMs: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = DEFAULT_RETRY_OPTIONS.maxAttempts,
    shouldRetry = DEFAULT_RETRY_OPTIONS.shouldRetry,
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        result,
        attempts: attempt + 1,
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt === maxAttempts - 1 || !shouldRetry(lastError, attempt)) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, options);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalDuration: Date.now() - startTime,
  };
}

/**
 * Retry options for email operations
 */
export const EMAIL_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 5,
  baseDelayMs: 2000,
  maxDelayMs: 60000,
  backoffMultiplier: 2,
  jitterMs: 500,
  shouldRetry: (error: Error, attempt: number) => {
    // Don't retry on permanent email failures
    const permanentErrors = [
      'InvalidEmailError',
      'UnsubscribedError',
      'BlockedError',
      'SpamError',
    ];

    // Don't retry on authentication errors
    if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
      return false;
    }

    // Don't retry on invalid email format
    if (error.message.includes('invalid email') || error.message.includes('malformed')) {
      return false;
    }

    // Retry on network errors, rate limits, and temporary failures
    return attempt < 5 && !permanentErrors.includes(error.name);
  },
};

/**
 * Retry options for SMS operations
 */
export const SMS_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 5000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterMs: 1000,
  shouldRetry: (error: Error, attempt: number) => {
    // Don't retry on permanent SMS failures
    const permanentErrors = [
      'InvalidPhoneError',
      'UnsubscribedError',
      'BlockedError',
    ];

    // Don't retry on invalid phone format
    if (error.message.includes('invalid phone') || error.message.includes('malformed')) {
      return false;
    }

    return attempt < 3 && !permanentErrors.includes(error.name);
  },
};

/**
 * Retry options for API calls
 */
export const API_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterMs: 200,
  shouldRetry: (error: Error, attempt: number) => {
    // Check HTTP status codes if available
    const httpError = error as any;
    if (httpError.status) {
      // Don't retry on client errors (4xx)
      if (httpError.status >= 400 && httpError.status < 500) {
        return false;
      }
      // Retry on server errors (5xx) and network errors
      return httpError.status >= 500 || httpError.status === 0;
    }

    // Retry on network errors
    return error.name === 'NetworkError' || error.message.includes('network');
  },
};

/**
 * Create a retry wrapper for a function
 * 
 * @param fn - Function to wrap with retry logic
 * @param options - Retry options
 * @returns Wrapped function with retry logic
 * 
 * @example
 * const retryableFetch = createRetryWrapper(
 *   (url: string) => fetch(url),
 *   API_RETRY_OPTIONS
 * );
 */
export function createRetryWrapper<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const result = await retryWithBackoff(() => fn(...args), options);
    
    if (result.success) {
      return result.result!;
    } else {
      throw result.error;
    }
  };
}