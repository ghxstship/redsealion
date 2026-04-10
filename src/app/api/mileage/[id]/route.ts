import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('expenses', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: mileage, error } = await supabase
    .from('mileage_entries')
    .select()
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !mileage) return NextResponse.json({ error: 'Mileage entry not found' }, { status: 404 });

  return NextResponse.json({ mileage });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('expenses', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['origin', 'destination', 'distance_miles', 'notes', 'trip_date', 'proposal_id', 'is_billable'];
  const ObjectHasFields = allowedFields.some((f) => f in body);
  if (!ObjectHasFields) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  // Handle re-calculation if distance changes
  if ('distance_miles' in updates) {
    const { data: org } = await supabase.from('organizations').select('mileage_rate').eq('id', perm.organizationId).single();
    const rate = (org?.mileage_rate as number) ?? 0.70;
    updates['rate_per_mile'] = rate;
    updates['amount'] = Number(updates['distance_miles']) * rate;
  }

  const { data: mileage, error } = await supabase
    .from('mileage_entries')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !mileage) return NextResponse.json({ error: 'Failed to update mileage', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, mileage });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('expenses', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('mileage_entries').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete mileage', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
