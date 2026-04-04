/**
 * AT Protocol OAuth client metadata endpoint.
 *
 * The AT Protocol requires OAuth clients to serve their configuration
 * at a publicly accessible URL. The client_id IS this URL.
 *
 * @see https://atproto.com/specs/oauth#client-metadata
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function GET() {
  return Response.json({
    client_id: `${BASE_URL}/client-metadata.json`,
    client_name: 'FlyteDeck',
    client_uri: BASE_URL,
    logo_uri: `${BASE_URL}/favicon.ico`,
    tos_uri: `${BASE_URL}/terms`,
    policy_uri: `${BASE_URL}/privacy`,
    redirect_uris: [`${BASE_URL}/api/auth/bluesky/callback`],
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: 'ES256',
    dpop_bound_access_tokens: true,
    jwks_uri: `${BASE_URL}/jwks.json`,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Content-Type': 'application/json',
    },
  });
}
