import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createServiceClient } from '@/lib/supabase/server';
import { createAccountLink } from '@/lib/payments/stripe-connect';

export async function GET(request: Request) {
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
    .select('stripe_connect_account_id')
    .eq('id', orgId)
    .single();

  if (orgError || !org) {
    return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
  }

  const accountId = org.stripe_connect_account_id as string | null;
  if (!accountId) {
    return NextResponse.json(
      { error: 'No Connect account found. Please start onboarding first.' },
      { status: 400 },
    );
  }

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
