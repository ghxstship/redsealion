import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

/**
 * OAuth callback route handler.
 *
 * After a user authenticates with an external provider (e.g. Google),
 * Supabase redirects here with an authorization code. We exchange it
 * for a session, then redirect the user into the app.
 *
 * Also handles magic-link and password-reset redirects that pass
 * through via the `next` query parameter.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // C-03: Check if this user has an active organization membership.
      // Google OAuth users skip the signup form's Step 2 (org provisioning),
      // so first-time OAuth users may land with no org.
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // H-03 + H-02: Create session record and log auth event
        await recordSessionAndEvent(user, request);

        const { data: membership } = await supabase
          .from('organization_memberships')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (!membership) {
          // No org — redirect to organization setup flow
          return NextResponse.redirect(`${origin}/signup/setup-org`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    const { createLogger } = await import('@/lib/logger');
    createLogger('auth').error('OAuth code exchange failed', {}, error);
  }

  // Redirect to login with an error indicator on failure
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}

/**
 * H-03: Create a session record in the sessions table.
 * H-02: Log the login event in auth_events.
 * M-03: Update login tracking fields on the user.
 */
async function recordSessionAndEvent(
  user: { id: string; email?: string },
  request: Request,
) {
  try {
    const service = await createServiceClient();
    const headerStore = await headers();
    const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? headerStore.get('x-real-ip')
      ?? null;
    const userAgent = headerStore.get('user-agent') ?? null;

    // H-03: Insert session record
    // Generate a hash placeholder — Supabase manages the actual session token
    const sessionHash = `callback-${user.id}-${Date.now()}`;

    await service.from('sessions').insert({
      user_id: user.id,
      session_token_hash: sessionHash,
      ip_address: ip,
      user_agent: userAgent,
      auth_method: 'oauth',
      mfa_verified: false,
      is_active: true,
      last_active_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    }).catch(() => { /* ignore if sessions table has issues */ });

    // H-02: Log the login event
    // Find the user's org for context
    const { data: membership } = await service
      .from('organization_memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    await service.from('auth_events').insert({
      user_id: user.id,
      organization_id: membership?.organization_id ?? null,
      event_type: 'login_success',
      ip_address: ip,
      user_agent: userAgent,
      metadata: { method: 'oauth' },
    }).catch(() => { /* non-fatal */ });

    // M-03: Update login tracking on user
    await service
      .from('users')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: ip,
        login_count: undefined, // We'll use a raw increment below
        last_active_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .catch(() => { /* non-fatal */ });

    // Increment login_count via RPC or raw update
    await service.rpc('increment_login_count', { p_user_id: user.id }).catch(() => {
      // Fallback: just update without increment if the RPC doesn't exist yet
    });
  } catch {
    // All session/event recording is non-fatal
  }
}
