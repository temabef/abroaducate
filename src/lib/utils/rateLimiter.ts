import type { SupabaseClient } from '@supabase/supabase-js';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  message?: string;
}

export class RateLimiter {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async checkRateLimit(
    userId: string,
    action: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Check existing rate limit records
      const { data: existingRecords, error } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq('identifier', `${userId}:${action}`)
        .gte('window_start', new Date(windowStart).toISOString());

      if (error) {
        console.warn('Rate limit check failed:', error);
        return { allowed: true, remaining: config.maxRequests, resetTime: now + config.windowMs };
      }

      const currentCount = existingRecords?.length || 0;
      const allowed = currentCount < config.maxRequests;
      const remaining = Math.max(0, config.maxRequests - currentCount);

      if (allowed) {
        // Record this request
        await this.supabase
          .from('rate_limits')
          .insert({
            identifier: `${userId}:${action}`,
            limit_type: action,
            window_start: new Date(now).toISOString(),
            request_count: 1
          });
      }

      return {
        allowed,
        remaining,
        resetTime: now + config.windowMs,
        message: allowed ? undefined : `Rate limit exceeded. Try again in ${Math.ceil(config.windowMs / 60000)} minutes.`
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowMs };
    }
  }

  // Predefined rate limit configurations
  static readonly CONFIGS = {
    SOP_GENERATION: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    LOGIN_ATTEMPTS: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
    REGISTRATION: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    API_CALLS: { maxRequests: 100, windowMs: 60 * 60 * 1000 } // 100 per hour
  };
} 