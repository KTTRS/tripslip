interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];
    
    const recentAttempts = timestamps.filter(
      t => now - t < config.windowMs
    );

    if (recentAttempts.length >= config.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

export const AUTH_RATE_LIMIT = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

export const PASSWORD_RESET_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
};

export const MAGIC_LINK_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};
