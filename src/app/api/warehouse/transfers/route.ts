import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  const supabase = await createClient();
  const orgId = perm.organizationId;

  let query = supabase
    .from('warehouse_transfers')
    .select()
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data: transfers, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transfers.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ transfers: transfers ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { from_facility_id, to_facility_id, items, notes } = body as {
    from_facility_id?: string;
    to_facility_id?: string;
    items?: Array<{ asset_id: string; quantity: number }>;
    notes?: string;
  };

  if (!from_facility_id) {
    return NextResponse.json(
      { error: 'from_facility_id is required.' },
      { status: 400 },
    );
  }

  if (!to_facility_id) {
    return NextResponse.json(
      { error: 'to_facility_id is required.' },
      { status: 400 },
    );
  }

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: 'At least one item is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: transfer, error: transferError } = await supabase
    .from('warehouse_transfers')
    .insert({
      organization_id: orgId,
      from_facility_id,
      to_facility_id,
      status: 'pending',
      initiated_by: perm.userId,
      items: JSON.stringify(items),
      notes: notes || null,
    })
    .select()
    .single();

  if (transferError || !transfer) {
    return NextResponse.json(
      { error: 'Failed to create transfer.', details: transferError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, transfer });
}
