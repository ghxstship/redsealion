/**
 * Route-Level Rate Limiter (Upstash Redis + In-Memory Fallback)
 *
 * Simple IP-based rate limiting for individual API routes.
 * Uses Upstash Redis in production, falls back to in-memory for dev.
 *
 * Usage: `const { success } = await serveRateLimit(\`prefix_\${ip}\`, 10, 60000);`
 *
 * For Next.js handler wrapping with standard rate-limit headers,
 * see `@/lib/middleware/rate-limit` which provides `withRateLimit()`.
 *
 * Both modules are intentional — they serve different integration patterns:
 *   - `serveRateLimit` → inline check within route handlers (simple)
 *   - `withRateLimit`  → HOC wrapper for handler functions (headers + 429)
 *
 * @module lib/api/rate-limit
 * @see {@link @/lib/middleware/rate-limit} for HOC wrapper pattern
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Conditionally init Upstash to avoid breaking dev environments missing the vars
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// The fallback memory map if Redis isn't configured
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

/**
 * Distributed rate limiter for critical API routes.
 * 
 * @param ip Client IP address
 * @param limit Max requests per window
 * @param windowMs Time window in milliseconds
 * @returns Object indicating if the limit is exceeded and how many requests are left
 */
export async function serveRateLimit(ip: string, limit: number = 5, windowMs: number = 60000) {
  if (redis) {
    // Dynamic sliding window instance based on args
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
    });

    const { success, remaining } = await ratelimit.limit(ip);
    return { success, remaining };
  }

  // ----- Fallback to In-Memory Map -----
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Clean up expired entries occasionally to prevent memory leaks in local/dev
  if (Math.random() < 0.05) {
    rateLimitMap.forEach((val, key) => {
      if (val.expiresAt < now) {
        rateLimitMap.delete(key);
      }
    });
  }

  if (!record || record.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count };
}
