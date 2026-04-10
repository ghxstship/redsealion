import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const orderType = url.searchParams.get('order_type');

  let query = supabase
    .from('fabrication_orders')
    .select('*, bill_of_materials(count), shop_floor_logs(count), events(id, name)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (orderType) query = query.eq('order_type', orderType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch fabrication orders', details: error.message }, { status: 500 });

  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, order_type, event_id, proposal_id, quantity, unit_cost_cents, start_date, due_date, priority, assigned_to, notes, estimated_labor_cents, actual_labor_cents, material_cost_cents, assigned_equipment_id } = body as Record<string, unknown>;

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const supabase = await createClient();

  // Generate order number
  const { count } = await supabase
    .from('fabrication_orders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const orderNumber = `FAB-${String((count ?? 0) + 1).padStart(4, '0')}`;

  const { data: order, error } = await supabase
    .from('fabrication_orders')
    .insert({
      organization_id: perm.organizationId,
      order_number: orderNumber,
      name: name as string,
      order_type: (order_type as string) ?? 'fabrication',
      event_id: (event_id as string) ?? null,
      proposal_id: (proposal_id as string) ?? null,
      quantity: (quantity as number) ?? 1,
      unit_cost_cents: (unit_cost_cents as number) ?? 0,
      total_cost_cents: ((quantity as number) ?? 1) * ((unit_cost_cents as number) ?? 0),
      start_date: (start_date as string) ?? null,
      due_date: (due_date as string) ?? null,
      priority: (priority as string) ?? 'medium',
      assigned_to: (assigned_to as string) ?? null,
      notes: (notes as string) ?? null,
      estimated_labor_cents: (estimated_labor_cents as number) ?? 0,
      actual_labor_cents: (actual_labor_cents as number) ?? 0,
      material_cost_cents: (material_cost_cents as number) ?? 0,
      assigned_equipment_id: (assigned_equipment_id as string) ?? null,
    })
    .select()
    .single();

  if (error || !order) return NextResponse.json({ error: 'Failed to create order', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, order }, { status: 201 });
}
