import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/** PATCH /api/time-off/policies/[id] — Update a policy */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const allowedFields = ['name', 'type', 'days_per_year', 'carry_over_max', 'requires_approval'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('time_off_policies')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update policy', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ policy: data });
}

/** DELETE /api/time-off/policies/[id] — Delete a policy */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('time_off_policies')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete policy', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
