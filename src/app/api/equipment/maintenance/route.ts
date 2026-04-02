import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('equipment', 'view');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;
  const { searchParams } = request.nextUrl;

  let query = supabase
    .from('maintenance_records')
    .select('*')
    .eq('organization_id', orgId)
    .order('scheduled_date', { ascending: false });

  const assetId = searchParams.get('assetId');
  if (assetId) {
    query = query.eq('asset_id', assetId);
  }

  const status = searchParams.get('status');
  if (status) {
    query = query.eq('status', status);
  }

  const { data: records, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('equipment', 'create');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    asset_id,
    type,
    description,
    scheduled_date,
    cost,
    notes,
  } = body as {
    asset_id?: string;
    type?: string;
    description?: string;
    scheduled_date?: string;
    cost?: number;
    notes?: string;
  };

  if (!asset_id) {
    return NextResponse.json({ error: 'asset_id is required.' }, { status: 400 });
  }

  if (!type) {
    return NextResponse.json({ error: 'type is required.' }, { status: 400 });
  }

  if (!scheduled_date) {
    return NextResponse.json({ error: 'scheduled_date is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: record, error: insertError } = await supabase
    .from('maintenance_records')
    .insert({
      organization_id: orgId,
      asset_id,
      type,
      description: description || null,
      scheduled_date,
      status: 'scheduled',
      cost: cost ?? null,
      performed_by: perm.userId,
      notes: notes || null,
    })
    .select()
    .single();

  if (insertError || !record) {
    return NextResponse.json(
      { error: 'Failed to create maintenance record.', details: insertError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, record });
}
