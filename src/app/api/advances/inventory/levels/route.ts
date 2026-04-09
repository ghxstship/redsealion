import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET  /api/advances/inventory/levels — Query stock levels
 * POST /api/advances/inventory/levels — Record/update stock level
 *
 * Gap: H-03 — Inventory tables existed but no API surface
 */

export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const locationId = url.searchParams.get('location_id');
  const catalogItemId = url.searchParams.get('catalog_item_id');

  let query = ctx.supabase
    .from('advance_inventory_levels')
    .select('*, advance_catalog_items(name, item_code), advance_inventory_locations(name)')
    .eq('organization_id', ctx.organizationId);

  if (locationId) query = query.eq('location_id', locationId);
  if (catalogItemId) query = query.eq('catalog_item_id', catalogItemId);

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch levels', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const body = await request.json();
  const b = body as Record<string, unknown>;

  if (!b.catalog_item_id || !b.location_id) {
    return NextResponse.json({ error: 'catalog_item_id and location_id are required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_inventory_levels')
    .upsert(
      {
        organization_id: ctx.organizationId,
        catalog_item_id: b.catalog_item_id,
        location_id: b.location_id,
        quantity_on_hand: b.quantity_on_hand ?? 0,
        quantity_reserved: b.quantity_reserved ?? 0,
        quantity_available: (b.quantity_on_hand as number ?? 0) - (b.quantity_reserved as number ?? 0),
        reorder_point: b.reorder_point ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'catalog_item_id,location_id' },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update level', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
