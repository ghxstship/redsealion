/**
 * AT Protocol OAuth client singleton for Bluesky authentication.
 *
 * This module initializes a confidential OAuth client that can:
 * 1. Initiate authorization flows (redirect user to Bluesky)
 * 2. Handle callbacks (exchange code for tokens)
 * 3. Restore sessions (for API calls on behalf of linked users)
 *
 * The client requires:
 * - HTTPS in production (AT Protocol mandate)
 * - ES256 key pair for client authentication (private_key_jwt)
 * - Public endpoints for client-metadata.json and jwks.json
 *
 * @see https://atproto.com/specs/oauth
 */

import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { JoseKey } from '@atproto/jwk-jose';
import { SupabaseStateStore, SupabaseSessionStore } from './storage';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

let _client: NodeOAuthClient | null = null;

/**
 * Get or create the AT Protocol OAuth client singleton.
 *
 * Lazily initialized because the key import is async and we only want
 * to create the client once per server process.
 */
export async function getBlueskyOAuthClient(): Promise<NodeOAuthClient> {
  if (_client) return _client;

  const privateKeyJwk = process.env.ATPROTO_PRIVATE_KEY;
  if (!privateKeyJwk) {
    throw new Error(
      'ATPROTO_PRIVATE_KEY environment variable is required for Bluesky OAuth. ' +
      'Generate an ES256 key pair and set the private key in JWK format.'
    );
  }

  const key = await JoseKey.fromImportable(privateKeyJwk, 'key-1');

  _client = new NodeOAuthClient({
    clientMetadata: {
      client_name: 'FlyteDeck',
      client_id: `${BASE_URL}/client-metadata.json`,
      client_uri: BASE_URL,
      redirect_uris: [`${BASE_URL}/api/auth/bluesky/callback`],
      scope: 'atproto transition:generic',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'private_key_jwt',
      token_endpoint_auth_signing_alg: 'ES256',
      dpop_bound_access_tokens: true,
      jwks_uri: `${BASE_URL}/jwks.json`,
    },
    stateStore: new SupabaseStateStore(),
    sessionStore: new SupabaseSessionStore(),
    keyset: [key],
  });

  return _client;
}
