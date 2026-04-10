import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

// GAP-PTL-06: Helper to check project_portals permission with proposals fallback
async function checkPortalPermission(action: 'view' | 'create' | 'edit' | 'delete') {
  const perm = await checkPermission('project_portals', action)
    ?? await checkPermission('proposals', action);
  return perm;
}
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPortalPermission('view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: portal, error } = await supabase
    .from('project_portals')
    .select('*, projects(name, slug)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !portal) return NextResponse.json({ error: 'Portal not found' }, { status: 404 });

  return NextResponse.json({ portal });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPortalPermission('edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'is_published', 'call_time', 'pre_arrival_checklist', 'parking_instructions',
    'rideshare_instructions', 'transit_instructions', 'check_in_instructions',
    'faqs', 'amenities',
  ];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  // GAP-PTL-07: Always set updated_by on update
  updates.updated_by = perm.userId ?? null;

  const { data: portal, error } = await supabase
    .from('project_portals')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !portal) return NextResponse.json({ error: 'Failed to update portal', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, portal });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPortalPermission('delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('project_portals').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete portal', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
