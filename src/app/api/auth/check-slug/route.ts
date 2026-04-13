import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit';

/**
 * GET /api/auth/check-slug?slug=acme-productions
 *
 * H-09: Check whether an organization slug is available.
 * Returns { available: boolean }.
 */
export const GET = withRateLimit(RATE_LIMITS.read, async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug')?.trim().toLowerCase();

  if (!slug || slug.length < 2) {
    return NextResponse.json({ available: false, error: 'Slug must be at least 2 characters.' }, { status: 400 });
  }

  const service = await createServiceClient();

  const { data: existing } = await service
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  return NextResponse.json({ available: !existing });
});
