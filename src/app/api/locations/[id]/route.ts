import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('locations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: location, error } = await supabase
    .from('locations')
    .select()
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !location) return NextResponse.json({ error: 'Location not found' }, { status: 404 });

  return NextResponse.json({ location });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('locations', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['name', 'address', 'city', 'state', 'zip', 'country', 'latitude', 'longitude', 'notes', 'location_type'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: location, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !location) return NextResponse.json({ error: 'Failed to update location', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, location });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('locations', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('locations').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete location', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
