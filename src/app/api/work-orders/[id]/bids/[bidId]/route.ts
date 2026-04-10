import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { notifyBidResolved } from '@/lib/notifications/triggers';

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
    const { status } = body; // Typically 'accepted', 'rejected', 'withdrawn'

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
        
      if (getBidError || !bidOwner || (bidOwner.crew_profiles as any)?.user_id !== userAuth.user.id) {
        return NextResponse.json({ error: 'Forbidden. Can only withdraw your own bids.' }, { status: 403 });
      }
    } else {
      // For accepted/rejected, user must have 'edit' permission for work_orders
      const perm = await checkPermission('work_orders', 'edit');
      if (!perm || !perm.allowed) {
        return NextResponse.json({ error: 'Forbidden. Admins only.' }, { status: 403 });
      }
    }
    
    const updateData: any = { status };
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
    
    logAuditAction({
      orgId: ctx.organizationId,
      action: `bid.${status}` as any, // 'bid.accepted', 'bid.rejected', 'bid.withdrawn'
      entity: 'work_order_bid',
      entityId: bidId,
    }).catch(() => {});

    // Webhook + notification (fire-and-forget)
    dispatchWebhookEvent(ctx.organizationId, `bid.${status}` as any, {
      bid_id: bidId,
      work_order_id: workOrderId,
      status,
      proposed_amount: bid.proposed_amount,
    }).catch(() => {});
    notifyBidResolved(bidId, workOrderId, ctx.organizationId, status).catch(() => {});

    return NextResponse.json({ bid });
  } catch (error: any) {
    console.error('Error updating bid:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
