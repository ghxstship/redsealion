/**
 * Bluesky OAuth login initiation.
 *
 * Accepts a Bluesky handle (e.g. "alice.bsky.social") and redirects
 * the user to the Bluesky authorization server. The user must already
 * be authenticated with FlyteDeck — this is a "link account" flow,
 * not a standalone login.
 *
 * POST /api/auth/bluesky/login
 * Body: { "handle": "alice.bsky.social" }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBlueskyOAuthClient } from '@/lib/bluesky/oauth-client';
import { createLogger } from '@/lib/logger';
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { createHmac, randomBytes } from 'crypto';

const logger = createLogger('bluesky-auth');

/**
 * L-06: Sign the OAuth state parameter with HMAC to prevent forgery.
 * The state contains the userId, a nonce, and a signature.
 */
function signState(userId: string): string {
  const secret = process.env.BLUESKY_STATE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'fallback-secret';
  const nonce = randomBytes(16).toString('hex');
  const payload = JSON.stringify({ userId, nonce });
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return JSON.stringify({ userId, nonce, sig });
}

export const POST = withRateLimit(RATE_LIMITS.auth, async function POST(request: Request) {
  try {
    // Require authenticated user (link-account flow)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Sign in to FlyteDeck first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const handle = body.handle?.trim();

    if (!handle) {
      return NextResponse.json(
        { error: 'Bluesky handle is required (e.g. alice.bsky.social)' },
        { status: 400 }
      );
    }

    const client = await getBlueskyOAuthClient();

    // Initiate the AT Protocol OAuth flow
    // L-06: Use HMAC-signed state to prevent state forgery
    const authUrl = await client.authorize(handle, {
      state: signState(user.id),
    });

    return NextResponse.json({ url: authUrl.toString() });
  } catch (error) {
    logger.error('Bluesky OAuth initiation failed', {}, error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to initiate Bluesky authentication: ${message}` },
      { status: 500 }
    );
  }
});
