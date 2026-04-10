import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAudit } from '@/lib/audit';

interface RouteContext { params: Promise<{ id: string }> }

/** PATCH /api/org-chart/[id] — Update an org chart position */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const allowedFields = ['title', 'department', 'user_id', 'reports_to', 'level'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('org_chart_positions')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select('*, user:users!org_chart_positions_user_id_fkey(id, full_name, avatar_url)')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update position', details: error?.message }, { status: 500 });
  }

  await logAudit({ action: 'org_chart.position.updated', entityType: 'org_chart_position', entityId: id }, supabase);

  return NextResponse.json({ position: data });
}

/** DELETE /api/org-chart/[id] — Delete an org chart position */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('org_chart_positions')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete position', details: error.message }, { status: 500 });
  }

  await logAudit({ action: 'org_chart.position.deleted', entityType: 'org_chart_position', entityId: id }, supabase);

  return NextResponse.json({ success: true });
}
