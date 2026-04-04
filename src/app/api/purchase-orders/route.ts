import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireFeature } from '@/lib/api/tier-guard';

export async function GET(request: NextRequest) {
  const tierError = await requireFeature('profitability');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status');

  let query = supabase
    .from('purchase_orders')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch purchase orders.', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ purchase_orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const tierError = await requireFeature('profitability');
  if (tierError) return tierError;

  const perm = await checkPermission('tasks', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    vendor_name,
    description,
    total_amount,
    proposal_id,
    due_date,
  } = body as {
    vendor_name?: string;
    description?: string;
    total_amount?: number;
    proposal_id?: string;
    due_date?: string;
  };

  if (!vendor_name || total_amount == null) {
    return NextResponse.json({ error: 'vendor_name and total_amount are required.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Generate PO number
  const { count } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);

  const poNumber = `PO-${String((count ?? 0) + 1).padStart(4, '0')}`;

  const { data, error: insertError } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: perm.organizationId,
      po_number: poNumber,
      vendor_name,
      description: description || null,
      total_amount,
      status: 'draft',
      proposal_id: proposal_id || null,
      issued_date: null,
      due_date: due_date || null,
    })
    .select()
    .single();

  if (insertError || !data) {
    return NextResponse.json({ error: 'Failed to create purchase order.', details: insertError?.message }, { status: 500 });
  }

  return NextResponse.json({ purchase_order: data });
}
