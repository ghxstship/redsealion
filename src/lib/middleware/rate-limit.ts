/**
 * Rate limiting middleware for API routes.
 *
 * Uses an in-memory sliding-window counter. For production at scale,
 * swap the store for Redis (e.g., @upstash/ratelimit).
 *
 * @module lib/middleware/rate-limit
 */

import { NextResponse } from 'next/server';

/* ─── Configuration ─────────────────────────────────────────────────────── */

interface RateLimitConfig {
  /** Max requests per window */
  max: number;
  /** Window duration in seconds */
  windowSec: number;
}

/** Tiered rate limits per route category */
export const RATE_LIMITS = {
  /** Auth endpoints: strict */
  auth: { max: 10, windowSec: 60 } as RateLimitConfig,
  /** Write endpoints (POST/PUT/PATCH/DELETE): moderate */
  write: { max: 60, windowSec: 60 } as RateLimitConfig,
  /** Read endpoints (GET): relaxed */
  read: { max: 120, windowSec: 60 } as RateLimitConfig,
  /** Webhook endpoints: high throughput */
  webhook: { max: 200, windowSec: 60 } as RateLimitConfig,
} as const;

/* ─── In-Memory Store ───────────────────────────────────────────────────── */

interface WindowEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, WindowEntry>();

// Garbage-collect expired entries every 60s
const GC_INTERVAL = 60_000;
let lastGc = Date.now();

function gcExpired() {
  const now = Date.now();
  if (now - lastGc < GC_INTERVAL) return;
  lastGc = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/* ─── Core Logic ────────────────────────────────────────────────────────── */

/**
 * Check and increment rate limit for a given key.
 * Returns { allowed, remaining, resetAt }.
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  gcExpired();

  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.max - 1, resetAt };
  }

  // Existing window
  entry.count += 1;
  const remaining = Math.max(0, config.max - entry.count);
  const allowed = entry.count <= config.max;

  return { allowed, remaining, resetAt: entry.resetAt };
}

/* ─── Next.js Integration ───────────────────────────────────────────────── */

/**
 * Extract a rate-limit key from a request.
 * Uses IP → user ID → fallback to 'anonymous'.
 */
function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown';
  return `rl:${prefix}:${ip}`;
}

/**
 * Apply rate limiting to an API route handler.
 * Wraps the handler and returns 429 if limit exceeded.
 *
 * @example
 * ```ts
 * import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
 *
 * export const POST = withRateLimit(
 *   RATE_LIMITS.write,
 *   async (request) => {
 *     // ... handler logic
 *   }
 * );
 * ```
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: Request, context?: unknown) => Promise<Response>
) {
  return async function rateLimitedHandler(
    request: Request,
    context?: unknown
  ): Promise<Response> {
    const prefix = new URL(request.url).pathname;
    const key = getRateLimitKey(request, prefix);
    const { allowed, remaining, resetAt } = checkRateLimit(key, config);

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMIT',
            message: 'Too many requests. Please try again later.',
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          },
        }
      );
    }

    const response = await handler(request, context);

    // Attach rate-limit headers to successful responses
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(config.max));
    headers.set('X-RateLimit-Remaining', String(remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
