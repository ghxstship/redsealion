import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface RouteContext { params: Promise<{ code: string }> }

/** Public endpoint: track a referral link click */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { code } = await context.params;
  const supabase = await createServiceClient();

  const { data: referral } = await supabase
    .from('referrals')
    .select('id, organization_id')
    .eq('referral_code', code)
    .single();

  if (!referral) {
    return NextResponse.json({ error: 'Referral not found.' }, { status: 404 });
  }

  // Record the click
  await supabase
    .from('referrals')
    .update({ clicked_at: new Date().toISOString() })
    .eq('id', referral.id);

  // Get the org's intake page URL
  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', referral.organization_id)
    .single();

  // Redirect to the intake page with referral tracking
  const redirectUrl = org
    ? `/intake/${org.slug}?ref=${code}`
    : '/';

  return NextResponse.redirect(new URL(redirectUrl, _request.url));
}
