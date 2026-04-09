import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/**
 * POST /api/time-off/[id]/review
 * Approve or deny a time-off request. Manager/admin only.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { action } = body as { action?: 'approve' | 'deny' };

  if (!action || !['approve', 'deny'].includes(action)) {
    return NextResponse.json({ error: 'action must be "approve" or "deny"' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the request
  const { data: timeOff, error: fetchErr } = await supabase
    .from('time_off_requests')
    .select('id, status, user_id, policy_id, days_requested')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (fetchErr || !timeOff) {
    return NextResponse.json({ error: 'Time-off request not found' }, { status: 404 });
  }

  if (timeOff.status !== 'pending') {
    return NextResponse.json({ error: `Request is already ${timeOff.status}` }, { status: 409 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'denied';

  const { data: updated, error: updateErr } = await supabase
    .from('time_off_requests')
    .update({
      status: newStatus,
      approved_by: perm.userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ error: 'Failed to update request', details: updateErr?.message }, { status: 500 });
  }

  // If approved, deduct from balance
  if (action === 'approve') {
    const currentYear = new Date().getFullYear();
    const { data: balance } = await supabase
      .from('time_off_balances')
      .select('used_days')
      .eq('user_id', timeOff.user_id)
      .eq('policy_id', timeOff.policy_id)
      .eq('year', currentYear)
      .single();

    if (balance) {
      await supabase
        .from('time_off_balances')
        .update({ used_days: (balance.used_days as number) + timeOff.days_requested })
        .eq('user_id', timeOff.user_id)
        .eq('policy_id', timeOff.policy_id)
        .eq('year', currentYear);
    }
  }

  return NextResponse.json({ success: true, request: updated });
}
