import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { notifyBidSubmitted } from '@/lib/notifications/triggers';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    const { id } = await params;

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bids, error } = await supabase
      .from('work_order_bids')
      .select('*, crew_profiles(user_id, skills, hourly_rate, users(full_name, email))')
      .eq('work_order_id', id)
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ bids });
  } catch (error: unknown) {
    console.error('Error fetching bids:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    const { id: workOrderId } = await params;

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { proposed_amount, proposed_start, proposed_end, notes } = body;

    // Must determine crew_profile_id from current user
    const { data: crewProfile, error: crewError } = await supabase
      .from('crew_profiles')
      .select('id')
      .eq('user_id', userAuth.user.id)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (crewError || !crewProfile) {
      return NextResponse.json({ error: 'User is not a valid crew profile' }, { status: 403 });
    }

    // 1. Verify bidding deadline
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('bidding_deadline')
      .eq('id', workOrderId)
      .single();

    if (woError || !wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }
    if (wo.bidding_deadline && new Date() > new Date(wo.bidding_deadline)) {
      return NextResponse.json({ error: 'Bidding deadline has passed' }, { status: 400 });
    }

    // 2. Compliance check
    const { count: complianceCount } = await supabase
      .from('compliance_documents')
      .select('*', { count: 'exact', head: true })
      .eq('crew_profile_id', crewProfile.id)
      .eq('status', 'verified');
    
    if (complianceCount === null || complianceCount === 0) {
      return NextResponse.json({ error: 'You must have at least one verified compliance document to bid on a work order.' }, { status: 403 });
    }

    // Insert bid
    const { data: bid, error: insertError } = await supabase
      .from('work_order_bids')
      .upsert({
        organization_id: ctx.organizationId,
        work_order_id: workOrderId,
        crew_profile_id: crewProfile.id,
        proposed_amount,
        proposed_start,
        proposed_end,
        notes,
        status: 'pending'
      }, {
        onConflict: 'work_order_id,crew_profile_id'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Fire-and-forget: notification + webhook + audit
    notifyBidSubmitted(workOrderId, ctx.organizationId, proposed_amount).catch(() => {});
    dispatchWebhookEvent(ctx.organizationId, 'bid.submitted', {
      bid_id: bid.id,
      work_order_id: workOrderId,
      proposed_amount,
    }).catch(() => {});
    logAuditAction({
      orgId: ctx.organizationId,
      action: 'bid.submitted',
      entity: 'work_order_bid',
      entityId: bid.id,
    }).catch(() => {});

    return NextResponse.json({ bid }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error submitting bid:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
