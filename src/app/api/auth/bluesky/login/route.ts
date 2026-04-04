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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBlueskyOAuthClient } from '@/lib/bluesky/oauth-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('bluesky-auth');

export async function POST(request: NextRequest) {
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
    // This resolves the handle → PDS → auth server, and returns a URL
    const authUrl = await client.authorize(handle, {
      // Store the FlyteDeck user ID in the state so we can link on callback
      state: JSON.stringify({ userId: user.id }),
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
}
