/**
 * JSON Web Key Set (JWKS) endpoint for AT Protocol OAuth.
 *
 * Serves the application's public key so AT Protocol auth servers can
 * verify the client's identity during the OAuth flow (private_key_jwt).
 *
 * The corresponding private key is stored in ATPROTO_PRIVATE_KEY env var.
 */

export async function GET() {
  const publicKeyJwk = process.env.ATPROTO_PUBLIC_KEY;

  if (!publicKeyJwk) {
    return Response.json(
      { error: 'ATPROTO_PUBLIC_KEY not configured' },
      { status: 503 }
    );
  }

  try {
    const jwk = JSON.parse(publicKeyJwk);

    return Response.json({
      keys: [
        {
          ...jwk,
          kid: 'key-1',
          use: 'sig',
          alg: 'ES256',
        },
      ],
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return Response.json(
      { error: 'Invalid ATPROTO_PUBLIC_KEY format' },
      { status: 500 }
    );
  }
}
