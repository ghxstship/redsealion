import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('proposals', 'view');
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
  const perm = await checkPermission('proposals', 'edit');
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
  const perm = await checkPermission('proposals', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('project_portals').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete portal', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
