/**
 * Token generation and verification utilities
 */

/**
 * Generate a cryptographically secure random token
 * @param length - Token length in bytes (default: 32)
 * @returns Hex-encoded token string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a magic link token with expiration
 * @param expirationDays - Days until expiration (default: 7)
 * @returns Object with token and expiration timestamp
 */
export function generateMagicLinkToken(expirationDays: number = 7) {
  const token = generateSecureToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);
  
  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Generate a direct link token (non-expiring)
 * @returns UUID-like token string
 */
export function generateDirectLinkToken(): string {
  return crypto.randomUUID();
}

/**
 * Validate token format
 * @param token - Token to validate
 * @param minLength - Minimum token length (default: 32)
 * @returns True if token is valid format
 */
export function isValidTokenFormat(token: string, minLength: number = 32): boolean {
  if (!token || typeof token !== 'string') return false;
  if (token.length < minLength) return false;
  // Check if token contains only valid hex characters or UUID format
  return /^[a-f0-9-]+$/i.test(token);
}

/**
 * Check if a timestamp is expired
 * @param expiresAt - ISO timestamp string
 * @returns True if expired
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Rate limiting for token generation
 */
class TokenRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 3600000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if rate limit is exceeded
   * @param identifier - User identifier (email, IP, etc.)
   * @returns True if rate limit exceeded
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    
    // Filter out old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return true;
    }
    
    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return false;
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Global rate limiter for magic link generation
 */
export const magicLinkRateLimiter = new TokenRateLimiter(10, 3600000); // 10 per hour

/**
 * Global rate limiter for direct link generation
 */
export const directLinkRateLimiter = new TokenRateLimiter(100, 3600000); // 100 per hour
