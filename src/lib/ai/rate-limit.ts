/**
 * AI Rate Limiter — in-memory sliding window rate limiter.
 *
 * Provides per-user and per-org rate limiting for AI endpoints.
 * Uses a simple in-memory store suitable for single-instance deployments.
 * For multi-instance, swap to Upstash Redis or similar.
 *
 * @module lib/ai/rate-limit
 */

import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('ai-rate-limit');

interface RateLimitEntry {
  timestamps: number[];
}

// In-memory stores — keyed by userId or orgId
const userStore = new Map<string, RateLimitEntry>();
const orgStore = new Map<string, RateLimitEntry>();

// Limits
const USER_LIMIT = 20;    // 20 requests per minute per user
const USER_WINDOW_MS = 60_000;

const ORG_LIMIT = 200;    // 200 requests per hour per org
const ORG_WINDOW_MS = 3_600_000;

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userStore) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < USER_WINDOW_MS);
    if (entry.timestamps.length === 0) userStore.delete(key);
  }
  for (const [key, entry] of orgStore) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < ORG_WINDOW_MS);
    if (entry.timestamps.length === 0) orgStore.delete(key);
  }
}, 300_000);

function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Check rate limits for an AI request.
 * Returns a 429 NextResponse if rate limited, or null if allowed.
 */
export function checkAiRateLimit(
  userId: string,
  orgId: string
): NextResponse | null {
  // Check user limit first (tighter window)
  const userResult = checkLimit(userStore, userId, USER_LIMIT, USER_WINDOW_MS);
  if (!userResult.allowed) {
    const retryAfter = Math.ceil(userResult.retryAfterMs / 1000);
    log.warn('User rate limited', { userId, retryAfter });
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. Please wait before sending more messages.',
        retryAfter,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  // Check org limit
  const orgResult = checkLimit(orgStore, orgId, ORG_LIMIT, ORG_WINDOW_MS);
  if (!orgResult.allowed) {
    const retryAfter = Math.ceil(orgResult.retryAfterMs / 1000);
    log.warn('Org rate limited', { orgId, retryAfter });
    return NextResponse.json(
      {
        error: 'Organization rate limit exceeded. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  return null;
}
