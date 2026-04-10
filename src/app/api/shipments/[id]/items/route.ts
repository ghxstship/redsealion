import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/**
 * GET /api/shipments/[id]/items — List line items for a shipment
 * POST /api/shipments/[id]/items — Add a line item
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify shipment belongs to org
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

  const { data: items, error } = await supabase
    .from('shipment_line_items')
    .select('*')
    .eq('shipment_id', id)
    .order('created_at');

  if (error) return NextResponse.json({ error: 'Failed to fetch items', details: error.message }, { status: 500 });

  return NextResponse.json({ items: items ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { description, quantity, equipment_id, serial_number, condition, weight_lbs, notes } = body as Record<string, unknown>;

  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

  const supabase = await createClient();

  // Verify shipment belongs to org
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

  const { data: item, error } = await supabase
    .from('shipment_line_items')
    .insert({
      shipment_id: id,
      description: description as string,
      quantity: (quantity as number) ?? 1,
      equipment_id: (equipment_id as string) ?? null,
      serial_number: (serial_number as string) ?? null,
      condition: (condition as string) ?? 'good',
      weight_lbs: (weight_lbs as number) ?? null,
      notes: (notes as string) ?? null,
    })
    .select()
    .single();

  if (error || !item) return NextResponse.json({ error: 'Failed to add line item', details: error?.message }, { status: 500 });

  // Update num_pieces on shipment
  const { data: countData } = await supabase
    .from('shipment_line_items')
    .select('quantity')
    .eq('shipment_id', id);

  const totalPieces = (countData ?? []).reduce((sum, i) => sum + ((i.quantity as number) ?? 1), 0);
  await supabase.from('shipments').update({ num_pieces: totalPieces }).eq('id', id);

  return NextResponse.json({ success: true, item }, { status: 201 });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const url = new URL(request.url);
  const itemId = url.searchParams.get('itemId');

  if (!itemId) return NextResponse.json({ error: 'itemId query parameter is required' }, { status: 400 });

  const supabase = await createClient();

  // Verify shipment belongs to org
  const { data: shipment } = await supabase
    .from('shipments')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

  const { error } = await supabase
    .from('shipment_line_items')
    .delete()
    .eq('id', itemId)
    .eq('shipment_id', id);

  if (error) return NextResponse.json({ error: 'Failed to delete item', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
