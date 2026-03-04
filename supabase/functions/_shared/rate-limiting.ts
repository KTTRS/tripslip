/**
 * Rate Limiting Utilities for Edge Functions
 * Implements token bucket algorithm for rate limiting
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string; // IP address, user ID, or other identifier
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check if request is within rate limit
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, identifier } = config;
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  // Reset if window has expired
  if (!entry || now >= entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit middleware for Edge Functions
 */
export async function rateLimitMiddleware(
  req: Request,
  config: Partial<RateLimitConfig> = {}
): Promise<Response | null> {
  // Get identifier (IP address or user ID)
  const identifier =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const rateLimitConfig: RateLimitConfig = {
    maxRequests: config.maxRequests || 100,
    windowMs: config.windowMs || 60000, // 1 minute default
    identifier: config.identifier || identifier,
  };

  const result = await checkRateLimit(rateLimitConfig);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toString(),
        },
      }
    );
  }

  return null; // Allow request to proceed
}

/**
 * Cleanup expired rate limit entries
 * Should be called periodically
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints
  AUTH_LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
  AUTH_SIGNUP: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  AUTH_PASSWORD_RESET: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour

  // Email/SMS endpoints
  SEND_EMAIL: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  SEND_SMS: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
  VERIFY_PHONE: { maxRequests: 3, windowMs: 10 * 60 * 1000 }, // 3 per 10 minutes

  // Payment endpoints
  CREATE_PAYMENT: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  PROCESS_REFUND: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute

  // Magic link endpoints
  MAGIC_LINK_ACCESS: { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute

  // General API
  API_GENERAL: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
};
