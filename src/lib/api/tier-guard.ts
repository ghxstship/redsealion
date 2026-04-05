import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SubscriptionTier } from '@/types/database';
import { tierMeetsMinimum, type FeatureKey, getRequiredTier } from '@/lib/subscription';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

/**
 * Server-side tier guard for API routes.
 * Returns null if access is granted, or a 403 NextResponse if denied.
 */
export async function requireTier(
  requiredTier: SubscriptionTier
): Promise<NextResponse | null> {
  const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', ctx.userId)
    .single();

  if (!userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_tier')
    .eq('id', ctx.organizationId)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  if (!tierMeetsMinimum(org.subscription_tier as SubscriptionTier, requiredTier)) {
    return NextResponse.json(
      { error: 'Upgrade required', required_tier: requiredTier },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Convenience: guard by feature key instead of tier directly.
 */
export async function requireFeature(
  feature: FeatureKey
): Promise<NextResponse | null> {
  return requireTier(getRequiredTier(feature));
}
