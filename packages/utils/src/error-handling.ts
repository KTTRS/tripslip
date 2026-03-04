import { logger } from './logger';
import { TripSlipError } from './errors';

/**
 * Result type for error handling wrapper
 * Provides a type-safe way to handle errors without throwing
 */
export interface Result<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Wraps an async operation with comprehensive error handling
 * Returns a Result object instead of throwing, making error handling explicit
 * 
 * @param operation - The async operation to execute
 * @param context - Context string for logging (e.g., "trip creation", "payment processing")
 * @returns Result object with data or error
 * 
 * @example
 * const { data, error } = await withErrorHandling(
 *   () => createTrip(tripData),
 *   'trip creation'
 * );
 * 
 * if (error) {
 *   showErrorToast(t('errors.tripCreationFailed'));
 *   return;
 * }
 * 
 * // Continue with data...
 */
export async function withAsyncErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`Error in ${context}`, error, { context });
    return { data: null, error };
  }
}

/**
 * Wraps a synchronous operation with error handling
 * @param operation - The sync operation to execute
 * @param context - Context string for logging
 * @returns Result object with data or error
 */
export function withSyncErrorHandling<T>(
  operation: () => T,
  context: string
): Result<T> {
  try {
    const data = operation();
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error(`Error in ${context}`, error, { context });
    return { data: null, error };
  }
}

/**
 * Retry an async operation with exponential backoff
 * @param operation - The operation to retry
 * @param context - Context for logging
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param initialDelay - Initial delay in ms (default: 1000)
 * @returns Result object with data or error
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<Result<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data, error } = await withAsyncErrorHandling(operation, context);
    
    if (!error) {
      if (attempt > 0) {
        logger.info(`${context} succeeded after ${attempt} retries`);
      }
      return { data, error: null };
    }
    
    lastError = error;
    
    // Don't retry on certain errors
    if (error instanceof TripSlipError) {
      const nonRetryableCodes = ['AUTH_ERROR', 'AUTHZ_ERROR', 'VALIDATION_ERROR', 'NOT_FOUND'];
      if (nonRetryableCodes.includes(error.code)) {
        logger.warn(`${context} failed with non-retryable error: ${error.code}`);
        return { data: null, error };
      }
    }
    
    if (attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt);
      logger.warn(`${context} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  logger.error(`${context} failed after ${maxRetries} retries`, lastError!);
  return { data: null, error: lastError };
}
