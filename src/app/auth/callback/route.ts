import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth callback route handler.
 *
 * After a user authenticates with an external provider (e.g. Google),
 * Supabase redirects here with an authorization code. We exchange it
 * for a session, then redirect the user into the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const { createLogger } = await import('@/lib/logger');
    createLogger('auth').error('OAuth code exchange failed', {}, error);
  }

  // Redirect to login with an error indicator on failure
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
