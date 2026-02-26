/**
 * Base error class for TripSlip errors
 */
export class TripSlipError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'TripSlipError';
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends TripSlipError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends TripSlipError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHZ_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends TripSlipError {
  constructor(
    message: string,
    public fieldErrors: Record<string, string> = {}
  ) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
export class NotFoundError extends TripSlipError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error
 */
export class ConflictError extends TripSlipError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends TripSlipError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Payment error
 */
export class PaymentError extends TripSlipError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 'PAYMENT_ERROR', 402);
    this.name = 'PaymentError';
  }
}

/**
 * Network error
 */
export class NetworkError extends TripSlipError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 503);
    this.name = 'NetworkError';
  }
}

/**
 * Check if error is a TripSlip error
 */
export function isTripSlipError(error: any): error is TripSlipError {
  return error instanceof TripSlipError;
}

/**
 * Get user-friendly error message
 * @param error - Error object
 * @param language - Language code for localized messages
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: any, language: string = 'en'): string {
  if (isTripSlipError(error)) {
    return error.message;
  }
  
  // Default messages by language
  const defaultMessages = {
    en: 'Something went wrong. Please try again.',
    es: 'Algo salió mal. Por favor, inténtalo de nuevo.',
    ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
  };
  
  return defaultMessages[language as keyof typeof defaultMessages] || defaultMessages.en;
}

/**
 * Retry with exponential backoff
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param baseDelay - Base delay in milliseconds
 * @returns Result of function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts - 1) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s, etc.
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Wrap async function with error handling
 * @param fn - Async function to wrap
 * @returns Wrapped function that catches errors
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error('Error in', fn.name, ':', error);
      return null;
    }
  };
}

/**
 * Log error with context
 * @param error - Error object
 * @param context - Additional context
 */
export function logError(error: any, context?: Record<string, any>): void {
  console.error('Error:', {
    message: error.message,
    name: error.name,
    code: isTripSlipError(error) ? error.code : undefined,
    statusCode: isTripSlipError(error) ? error.statusCode : undefined,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
