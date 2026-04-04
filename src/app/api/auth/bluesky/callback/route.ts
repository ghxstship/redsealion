/**
 * Bluesky OAuth callback handler.
 *
 * After the user authorizes on Bluesky, they are redirected here with
 * an authorization code. We exchange it for tokens, extract the DID,
 * and link the Bluesky identity to the authenticated FlyteDeck user.
 *
 * GET /api/auth/bluesky/callback?code=...&state=...&iss=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { Agent } from '@atproto/api';
import { getBlueskyOAuthClient } from '@/lib/bluesky/oauth-client';
import { linkBlueskyAccount } from '@/lib/bluesky/link';
import { createLogger } from '@/lib/logger';

const logger = createLogger('bluesky-auth');

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  try {
    const client = await getBlueskyOAuthClient();

    // Exchange the authorization code for an AT Protocol session
    // The client handles DPoP, token exchange, and session storage
    const { session, state } = await client.callback(
      new URL(request.url).searchParams
    );

    // Extract the FlyteDeck user ID from the OAuth state
    let userId: string | null = null;
    if (state) {
      try {
        const parsed = JSON.parse(state);
        userId = parsed.userId;
      } catch {
        logger.warn('Failed to parse OAuth state', { state });
      }
    }

    if (!userId) {
      logger.error('No user ID in Bluesky OAuth callback state', { state });
      return NextResponse.redirect(
        `${origin}/app/settings?error=bluesky_link_failed&reason=no_user`
      );
    }

    // Get the user's DID and handle from the session
    const did = session.did;

    // Resolve handle from the DID — the session sub is the DID
    let handle: string = did;
    try {
      // The agent can resolve the handle
      const session = await client.restore(did);
      const agent = new Agent(session);
      const profile = await agent.getProfile({ actor: did });
      handle = profile.data.handle ?? did;
    } catch {
      // Non-fatal — we can still link with just the DID
      logger.warn('Failed to resolve Bluesky handle from DID', { did });
    }

    // Link the Bluesky identity to the FlyteDeck user
    await linkBlueskyAccount({ userId, did, handle });

    // Redirect back to settings with success indicator
    return NextResponse.redirect(
      `${origin}/app/settings?bluesky_linked=true&handle=${encodeURIComponent(handle)}`
    );
  } catch (error) {
    logger.error('Bluesky OAuth callback failed', {}, error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      `${origin}/app/settings?error=bluesky_link_failed&reason=${encodeURIComponent(message)}`
    );
  }
}
