import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const perm = await checkPermission('resources', 'edit', 'resource_scheduling');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.start_date) updates.start_date = body.start_date;
  if (body.end_date) updates.end_date = body.end_date;
  if (body.hours_per_day !== undefined) updates.hours_per_day = body.hours_per_day;
  if (body.role !== undefined) updates.role = body.role;
  if (body.notes !== undefined) updates.notes = body.notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: allocation, error } = await supabase
    .from('resource_allocations')
    .update(updates)
    .eq('organization_id', perm!.organizationId)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!allocation) {
    return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
  }

  return NextResponse.json({ data: allocation });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const perm = await checkPermission('resources', 'delete', 'resource_scheduling');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { error } = await supabase
    .from('resource_allocations')
    .delete()
    .eq('organization_id', perm!.organizationId)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
