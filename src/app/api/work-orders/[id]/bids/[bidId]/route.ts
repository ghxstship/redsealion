import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { notifyBidResolved } from '@/lib/notifications/triggers';
import { createLogger } from '@/lib/logger';

const log = createLogger('work-orders:bids');

type BidResolutionStatus = 'accepted' | 'rejected' | 'withdrawn';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, bidId: string }> }
) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    const { id: workOrderId, bidId } = await params;

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const status = body.status as BidResolutionStatus | undefined; // Typically 'accepted', 'rejected', 'withdrawn'
    if (!status || !['accepted', 'rejected', 'withdrawn'].includes(status)) {
      return NextResponse.json({ error: 'Invalid bid status' }, { status: 400 });
    }

    // Authorization checks
    const { data: userAuth } = await supabase.auth.getUser();
    if (!userAuth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (status === 'withdrawn') {
      // Must be bid owner
      const { data: bidOwner, error: getBidError } = await supabase
        .from('work_order_bids')
        .select(`crew_profiles(user_id)`)
        .eq('id', bidId)
        .single();
        
      const bidOwnerProfile = bidOwner?.crew_profiles as { user_id?: string } | null;
      if (getBidError || !bidOwner || bidOwnerProfile?.user_id !== userAuth.user.id) {
        return NextResponse.json({ error: 'Forbidden. Can only withdraw your own bids.' }, { status: 403 });
      }
    } else {
      // For accepted/rejected, user must have 'edit' permission for work_orders
      const perm = await checkPermission('work_orders', 'edit');
      if (!perm || !perm.allowed) {
        return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 });
      }
    }
    
    const updateData: {
      status: BidResolutionStatus;
      accepted_by?: string;
      resolved_at?: string;
    } = { status };
    if (status === 'accepted' || status === 'rejected') {
      updateData.accepted_by = userAuth.user.id;
      updateData.resolved_at = new Date().toISOString();
    }
    
    // First update the bid status
    const { data: bid, error: updateError } = await supabase
      .from('work_order_bids')
      .update(updateData)
      .eq('id', bidId)
      .eq('work_order_id', workOrderId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (updateError) throw updateError;

    // If accepted, we must reject other bids and create a work_order_assignment!
    if (status === 'accepted') {
      // 1. Reject others
      await supabase
        .from('work_order_bids')
        .update({ status: 'rejected' })
        .eq('work_order_id', workOrderId)
        .neq('id', bidId)
        .eq('organization_id', ctx.organizationId);
      
      // 2. Create Assignment
      await supabase
        .from('work_order_assignments')
        .upsert({
          work_order_id: workOrderId,
          crew_profile_id: bid.crew_profile_id,
          status: 'accepted'
        }, {
          onConflict: 'work_order_id,crew_profile_id'
        });
        
      // 3. Mark work order as dispatched/assigned
      await supabase
        .from('work_orders')
        .update({ status: 'dispatched' })
        .eq('id', workOrderId);
    }
    
    const bidEvent = `bid.${status}` as const;
    logAuditAction({
      orgId: ctx.organizationId,
      action: bidEvent,
      entity: 'work_order_bid',
      entityId: bidId,
    }).catch(() => {});

    // Webhook + notification (fire-and-forget)
    dispatchWebhookEvent(ctx.organizationId, bidEvent, {
      bid_id: bidId,
      work_order_id: workOrderId,
      status,
      proposed_amount: bid.proposed_amount,
    }).catch(() => {});
    notifyBidResolved(bidId, workOrderId, ctx.organizationId, status).catch(() => {});

    return NextResponse.json({ bid });
  } catch (error: unknown) {
    log.error('Error updating bid', {}, error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
