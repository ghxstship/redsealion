import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';
import { parsePagination } from '@/lib/pagination';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const pagination = parsePagination(url.searchParams);

  let query = supabase
    .from('rental_orders')
    .select('*, rental_line_items(count), clients(id, name), events(id, name)', { count: 'exact' })
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch rental orders', details: error.message }, { status: 500 });

  return NextResponse.json({
    orders: data ?? [],
    page: pagination.page,
    limit: pagination.limit,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pagination.limit),
    hasMore: pagination.page < Math.ceil((count ?? 0) / pagination.limit),
  });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { client_id, event_id, rental_start, rental_end, deposit_cents, notes } = body as Record<string, unknown>;

  if (!rental_start || !rental_end) return NextResponse.json({ error: 'rental_start and rental_end are required' }, { status: 400 });

  const supabase = await createClient();

  // Generate order number
  const { count } = await supabase
    .from('rental_orders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const orderNumber = `RNT-${String((count ?? 0) + 1).padStart(4, '0')}`;

  const { data: order, error } = await supabase
    .from('rental_orders')
    .insert({
      organization_id: perm.organizationId,
      order_number: orderNumber,
      client_id: (client_id as string) ?? null,
      event_id: (event_id as string) ?? null,
      rental_start: rental_start as string,
      rental_end: rental_end as string,
      deposit_cents: (deposit_cents as number) ?? 0,
      notes: (notes as string) ?? null,
    })
    .select()
    .single();

  if (error || !order) return NextResponse.json({ error: 'Failed to create rental order', details: error?.message }, { status: 500 });

  logAuditAction({ orgId: perm.organizationId, action: 'rental_order.create', entity: 'rental_orders', entityId: order.id, metadata: { order_number: orderNumber } }).catch(() => {});

  return NextResponse.json({ success: true, order }, { status: 201 });
}
