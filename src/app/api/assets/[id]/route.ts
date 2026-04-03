import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: asset, error } = await supabase
    .from('assets')
    .select('*, asset_location_history(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  return NextResponse.json({ asset });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'name', 'type', 'category', 'trackable', 'status', 'condition',
    'reusable', 'barcode', 'serial_number', 'purchase_cost', 'current_location',
    'notes', 'deployment_count',
  ];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  // If location changed, record in location history
  if ('current_location' in updates) {
    const { data: existing } = await supabase
      .from('assets')
      .select('current_location')
      .eq('id', id)
      .single();

    if (existing?.current_location) {
      await supabase.from('asset_location_history').insert({
        asset_id: id,
        from_location: existing.current_location,
        to_location: updates.current_location,
        moved_by: perm.userId,
        moved_at: new Date().toISOString(),
      });
    }
  }

  const { data: asset, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !asset) return NextResponse.json({ error: 'Failed to update asset', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, asset });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('assets', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('assets').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete asset', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
