import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireFeature } from '@/lib/api/tier-guard';
import { requirePermission } from '@/lib/api/permission-guard';
import { randomBytes } from 'crypto';
import { getAdapter, envPrefix } from '@/lib/integrations/registry';

import { createLogger } from '@/lib/logger';

const log = createLogger('integrations');

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;

  try {
    const tierError = await requireFeature('integrations');
    if (tierError) return tierError;

    const permError = await requirePermission('integrations', 'edit');
    if (permError) return permError;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adapter = getAdapter(platform);
    if (!adapter) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 },
      );
    }

    // Generate a cryptographically random state token for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Build the OAuth authorization URL using the adapter
    const prefix = envPrefix(platform);
    const clientId = process.env[`${prefix}_CLIENT_ID`] ?? '';
    const redirectUri =
      process.env[`${prefix}_REDIRECT_URI`] ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/integrations/${platform}/callback`;

    const { authUrl: baseAuthUrl } = await adapter.connect({
      clientId,
      redirectUri,
    });

    // Append state parameter to the auth URL
    const separator = baseAuthUrl.includes('?') ? '&' : '?';
    const authUrl = `${baseAuthUrl}&state=${encodeURIComponent(state)}`;

    // Sign the state with a secret so we can verify it on callback.
    // Store state in a secure, httpOnly cookie so the callback can validate it.
    const response = NextResponse.json({ authUrl, platform });
    response.cookies.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    log.error(`Integration connect error [${platform}]:`, {}, error);
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 },
    );
  }
}
