import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000 // 1 minute
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  // Clean up old rate limit records
  await supabase
    .from('rate_limits')
    .delete()
    .lt('created_at', windowStart.toISOString())

  // Count requests in current window
  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', identifier)
    .gte('created_at', windowStart.toISOString())

  const requestCount = count || 0
  const allowed = requestCount < config.maxRequests
  const remaining = Math.max(0, config.maxRequests - requestCount - 1)
  const resetAt = new Date(now.getTime() + config.windowMs)

  if (allowed) {
    // Record this request
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        created_at: now.toISOString()
      })
  }

  return { allowed, remaining, resetAt }
}

export function rateLimitHeaders(remaining: number, resetAt: Date) {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetAt.toISOString(),
    'Retry-After': Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString()
  }
}
