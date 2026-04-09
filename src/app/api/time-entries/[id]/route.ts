import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('time_tracking', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'description', 'start_time', 'end_time', 'duration_minutes',
    'billable', 'proposal_id', 'phase_id',
  ];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: entry, error } = await supabase
    .from('time_entries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', perm.userId)
    .select()
    .single();

  if (error || !entry) return NextResponse.json({ error: 'Failed to update time entry', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, entry });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('time_tracking', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase.from('time_entries').delete().eq('id', id).eq('user_id', perm.userId);
  if (error) return NextResponse.json({ error: 'Failed to delete time entry', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
