import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/** GET /api/time-off/[id] — Fetch a single time-off request */
export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('time_tracking', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('time_off_requests')
    .select('*, users!time_off_requests_user_id_fkey(id, full_name, avatar_url)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Time-off request not found' }, { status: 404 });
  return NextResponse.json({ request: data });
}

/** PATCH /api/time-off/[id] — Update a time-off request (owner only, pending status) */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('time_tracking', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  // Only the requester can update, and only while pending
  const { data: existing } = await supabase
    .from('time_off_requests')
    .select('user_id, status')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.user_id !== perm.userId) return NextResponse.json({ error: 'Only the requester can modify' }, { status: 403 });
  if (existing.status !== 'pending') return NextResponse.json({ error: 'Only pending requests can be modified' }, { status: 409 });

  const allowedFields = ['start_date', 'end_date', 'type', 'notes'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data, error } = await supabase
    .from('time_off_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to update', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, request: data });
}

/** DELETE /api/time-off/[id] — Withdraw/cancel a pending time-off request */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('time_tracking', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Only the requester can withdraw, and only while pending
  const { data: existing } = await supabase
    .from('time_off_requests')
    .select('user_id, status')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.user_id !== perm.userId) return NextResponse.json({ error: 'Only the requester can withdraw' }, { status: 403 });
  if (existing.status !== 'pending') return NextResponse.json({ error: 'Only pending requests can be withdrawn' }, { status: 409 });

  const { error } = await supabase
    .from('time_off_requests')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to cancel', details: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
