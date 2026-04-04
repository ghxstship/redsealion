import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth checks if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/', '/pricing', '/login', '/signup', '/reactivate', '/auth/callback', '/client-metadata.json', '/jwks.json'];
  const isPublicRoute = publicRoutes.includes(pathname);
  const isPortalRoute = pathname.startsWith('/portal/');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';
  const isAppRoute = pathname.startsWith('/app');
  const isApiRoute = pathname.startsWith('/api/');

  // Redirect unauthenticated users trying to access /app
  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  // ---------------------------------------------------------------------------
  // Harbor Master: User status + session enforcement on every authenticated request
  // Performance: check cookie cache first (set for 60s), fall back to DB
  // ---------------------------------------------------------------------------
  if (user && (isAppRoute || isApiRoute)) {
    const statusCookie = request.cookies.get('fd_user_status')?.value;
    let userStatus: string | null = statusCookie ?? null;

    if (!userStatus) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('status')
        .eq('id', user.id)
        .single();

      userStatus = (userRecord?.status as string) ?? 'active';

      // Cache in response cookie for 60 seconds
      supabaseResponse.cookies.set('fd_user_status', userStatus, {
        maxAge: 60,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      });
    }

    // Rewrite the block below to use the cached/fetched status
    const statusToCheck = userStatus;
    const isApiRouteCheck = isApiRoute;

    if (statusToCheck === 'suspended') {
      if (isApiRouteCheck) {
        return NextResponse.json(
          { error: 'Account suspended', reason: 'Your account has been suspended. Contact your administrator.' },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'account_suspended');
      return NextResponse.redirect(url);
    }

    if (statusToCheck === 'deactivated') {
      if (isApiRouteCheck) {
        return NextResponse.json(
          { error: 'Account deactivated', reactivation_url: '/reactivate' },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/reactivate';
      return NextResponse.redirect(url);
    }

    if (statusToCheck === 'pending_deletion') {
      if (isApiRouteCheck) {
        return NextResponse.json(
          { error: 'Account pending deletion' },
          { status: 403 },
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'account_deleted');
      return NextResponse.redirect(url);
    }
  }

  // MFA check (only when not cached — runs on first request after cache expires)
  if (user && isAppRoute && !pathname.startsWith('/app/settings/security/mfa')) {
    // Only run MFA check if status was fetched from DB (no cache cookie existed)
    const statusCookie = request.cookies.get('fd_user_status')?.value;
    if (!statusCookie) {
      const { data: membership } = await supabase
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (membership) {
        const { data: authSettings } = await supabase
          .from('auth_settings')
          .select('require_mfa')
          .eq('organization_id', membership.organization_id)
          .single();

        if (authSettings?.require_mfa) {
          const { data: activeSession } = await supabase
            .from('sessions')
            .select('mfa_verified')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (activeSession && !activeSession.mfa_verified) {
            const url = request.nextUrl.clone();
            url.pathname = '/app/settings/security/mfa';
            return NextResponse.redirect(url);
          }
        }
      }
    }
  }

  return supabaseResponse;
}
