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

    // Determine the redirect URL for after magic link click
    const origin = request.headers.get('origin') || request.headers.get('x-forwarded-host') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const redirectTo = `${origin}/portal/${orgSlug}`;

    // Send magic link via Supabase Auth OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true, // Allow new portal users to be created automatically
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

/** CORS preflight handler */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
