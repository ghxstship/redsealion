import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TOKEN_ENDPOINTS, envPrefix } from '@/lib/integrations/registry';

// TODO: Replace with real encryption (e.g. AES-256-GCM) once an encryption key is provisioned.
// This base64 encoding with a prefix is NOT secure — it is a placeholder only.
function encryptToken(token: string): string {
  return `enc_b64:${Buffer.from(token).toString('base64')}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(
      new URL(`/app/integrations?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/app/integrations?error=missing_code', request.url),
    );
  }

  // Validate state parameter against the cookie we set during connect
  const storedState = request.cookies.get(`oauth_state_${platform}`)?.value;
  if (!state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL('/app/integrations?error=invalid_state', request.url),
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.redirect(
        new URL('/app/integrations?error=no_org', request.url),
      );
    }

    // Exchange authorization code for tokens
    const prefix = envPrefix(platform);
    const clientId = process.env[`${prefix}_CLIENT_ID`] ?? '';
    const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] ?? '';
    const redirectUri =
      process.env[`${prefix}_REDIRECT_URI`] ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/integrations/${platform}/callback`;

    const tokenUrl = TOKEN_ENDPOINTS[platform];
    if (!tokenUrl) {
      return NextResponse.redirect(
        new URL(`/app/integrations?error=unsupported_platform`, request.url),
      );
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error(`Token exchange failed [${platform}]:`, errorBody);
      return NextResponse.redirect(
        new URL('/app/integrations?error=token_exchange_failed', request.url),
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token ?? tokenData.authed_user?.access_token ?? '';
    const refreshToken = tokenData.refresh_token ?? '';

    // Store encrypted tokens and mark integration as connected
    await supabase.from('integrations').upsert(
      {
        organization_id: userData.organization_id,
        platform,
        status: 'connected',
        access_token_encrypted: encryptToken(accessToken),
        refresh_token_encrypted: refreshToken ? encryptToken(refreshToken) : null,
        config: {
          token_type: tokenData.token_type ?? 'bearer',
          scope: tokenData.scope ?? '',
          instance_url: tokenData.instance_url ?? null,
          expires_in: tokenData.expires_in ?? null,
          connected_at: new Date().toISOString(),
        },
      },
      { onConflict: 'organization_id,platform' },
    );

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL(`/app/integrations/${platform}?connected=true`, request.url),
    );
    response.cookies.delete(`oauth_state_${platform}`);
    return response;
  } catch (err) {
    console.error(`OAuth callback error [${platform}]:`, err);
    return NextResponse.redirect(
      new URL('/app/integrations?error=callback_failed', request.url),
    );
  }
}
