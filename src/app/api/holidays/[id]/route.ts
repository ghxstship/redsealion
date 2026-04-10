import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/** PATCH /api/holidays/[id] — Update a holiday */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  const allowedFields = ['name', 'date', 'recurring'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('holiday_calendars')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update holiday', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ holiday: data });
}

/** DELETE /api/holidays/[id] — Delete a holiday */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('team', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('holiday_calendars')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete holiday', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
