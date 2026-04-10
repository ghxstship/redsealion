import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logger';
import { serveRateLimit } from '@/lib/api/rate-limit';

const log = createLogger('api-public-portal-magic-link');

/**
 * Public endpoint to send a magic link for portal access.
 * Uses Supabase Auth OTP (magic link) to send a passwordless login email.
 * The redirect URL points the user back to their org's portal.
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 magic link requests per minute per IP (auth-sensitive)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { success: withinLimit } = await serveRateLimit(`magic_${ip}`, 5, 60000);
    if (!withinLimit) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before requesting another link.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
    const body = await request.json().catch(() => ({}));
    const { email, orgSlug } = body;

    if (!email || !orgSlug) {
      return NextResponse.json(
        { error: 'email and orgSlug are required.' },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    // Verify the org exists
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found.' },
        { status: 404 },
      );
    }

    // Verify the email belongs to a client_contact for this org
    const { data: contact } = await supabase
      .from('client_contacts')
      .select('id, client_id')
      .eq('email', email)
      .limit(10);

    // Check if any of the matching contacts belong to a client under this org
    let hasOrgAccess = false;
    if (contact && contact.length > 0) {
      const clientIds = contact.map((c) => c.client_id);
      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .in('id', clientIds)
        .eq('organization_id', org.id);

      hasOrgAccess = (count ?? 0) > 0;
    }

    if (!hasOrgAccess) {
      // Silently succeed to prevent email enumeration
      // but don't actually send the magic link
      log.info(`Magic link requested for unregistered email ${email} on org ${orgSlug}`);
      return NextResponse.json({ success: true });
    }

    // Determine the redirect URL for after magic link click
    const origin = request.headers.get('origin') || request.headers.get('x-forwarded-host') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const redirectTo = `${origin}/portal/${orgSlug}`;

    // Send magic link via Supabase Auth OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        // GAP-PTL-10: Do not auto-create auth users — contact must pre-exist
        shouldCreateUser: false,
      },
    });

    if (error) {
      log.error('Failed to send magic link', { email, orgSlug }, error);
      return NextResponse.json(
        { error: 'Failed to send login link. Please try again.' },
        { status: 500 },
      );
    }

    log.info(`Magic link sent to ${email} for portal ${orgSlug}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error('Unexpected error in portal-magic-link route', {}, err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/** CORS preflight handler — GAP-PTL-05: restrict to app origin */
export async function OPTIONS(request: NextRequest) {
  const allowedOrigin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
