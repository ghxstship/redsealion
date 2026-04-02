import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createServiceClient } from '@/lib/supabase/server';
import {
  createConnectAccount,
  createAccountLink,
  getAccountStatus,
} from '@/lib/payments/stripe-connect';

export async function POST(request: Request) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createServiceClient();
  const orgId = perm.organizationId;

  // Get the organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, billing_email, stripe_connect_account_id')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
  }

  // If already has a Connect account, just generate a new onboarding link
  let accountId = org.stripe_connect_account_id as string | null;

  if (!accountId) {
    const email = (org.billing_email as string) || '';
    const account = await createConnectAccount(orgId, org.name as string, email);
    if (!account) {
      return NextResponse.json(
        { error: 'Failed to create Stripe Connect account. Stripe may not be configured.' },
        { status: 500 },
      );
    }
    accountId = account.id;

    // Store the account ID
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ stripe_connect_account_id: accountId })
      .eq('id', orgId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save Connect account.', details: updateError.message },
        { status: 500 },
      );
    }
  }

  // Generate the onboarding link
  const origin = request.headers.get('origin') || '';
  const returnUrl = `${origin}/app/settings?tab=payment&connect=complete`;
  const refreshUrl = `${origin}/app/settings?tab=payment&connect=refresh`;

  const link = await createAccountLink(accountId, returnUrl, refreshUrl);
  if (!link) {
    return NextResponse.json(
      { error: 'Failed to create onboarding link.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: link.url });
}

export async function GET() {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createServiceClient();
  const orgId = perm.organizationId;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('stripe_connect_account_id, stripe_connect_onboarding_complete')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
  }

  const accountId = org.stripe_connect_account_id as string | null;
  if (!accountId) {
    return NextResponse.json({
      connected: false,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    });
  }

  const status = await getAccountStatus(accountId);
  if (!status) {
    return NextResponse.json({
      connected: true,
      charges_enabled: false,
      payouts_enabled: false,
      details_submitted: false,
    });
  }

  // Update onboarding_complete if charges are enabled
  if (status.charges_enabled && !org.stripe_connect_onboarding_complete) {
    await supabase
      .from('organizations')
      .update({ stripe_connect_onboarding_complete: true })
      .eq('id', orgId);
  }

  return NextResponse.json({
    connected: true,
    ...status,
  });
}
