import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const url = new URL(request.url);
  const direction = url.searchParams.get('direction');
  const status = url.searchParams.get('status');

  let query = supabase
    .from('shipments')
    .select('*, shipment_line_items(count), events(id, name), clients(id, name), vendors(id, name)')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (direction) query = query.eq('direction', direction);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Failed to fetch shipments', details: error.message }, { status: 500 });

  return NextResponse.json({ shipments: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const {
    direction, carrier, tracking_number, origin_address,
    destination_address, ship_date, estimated_arrival,
    weight_lbs, num_pieces, shipping_cost_cents, notes,
    event_id, rental_order_id, purchase_order_id, client_id, vendor_id,
  } = body as Record<string, unknown>;

  if (!direction || !['inbound', 'outbound'].includes(direction as string)) {
    return NextResponse.json({ error: 'direction is required (inbound or outbound)' }, { status: 400 });
  }

  const supabase = await createClient();

  // Generate shipment number
  const { count } = await supabase
    .from('shipments')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const prefix = direction === 'inbound' ? 'RCV' : 'SHP';
  const shipmentNumber = `${prefix}-${String((count ?? 0) + 1).padStart(5, '0')}`;

  const { data: shipment, error } = await supabase
    .from('shipments')
    .insert({
      organization_id: perm.organizationId,
      shipment_number: shipmentNumber,
      direction: direction as string,
      status: 'pending',
      carrier: (carrier as string) ?? null,
      tracking_number: (tracking_number as string) ?? null,
      origin_address: (origin_address as string) ?? null,
      destination_address: (destination_address as string) ?? null,
      ship_date: (ship_date as string) ?? null,
      estimated_arrival: (estimated_arrival as string) ?? null,
      weight_lbs: (weight_lbs as number) ?? null,
      num_pieces: (num_pieces as number) ?? 1,
      shipping_cost_cents: (shipping_cost_cents as number) ?? 0,
      notes: (notes as string) ?? null,
      event_id: (event_id as string) ?? null,
      rental_order_id: (rental_order_id as string) ?? null,
      purchase_order_id: (purchase_order_id as string) ?? null,
      client_id: (client_id as string) ?? null,
      vendor_id: (vendor_id as string) ?? null,
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error || !shipment) return NextResponse.json({ error: 'Failed to create shipment', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, shipment }, { status: 201 });
}
