import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET  /api/advances/inventory/locations — List inventory locations
 * POST /api/advances/inventory/locations — Create location
 *
 * Gap: H-03 — Inventory tables existed but no API surface
 */

export async function GET(_request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { data, error } = await ctx.supabase
    .from('advance_inventory_locations')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch locations', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const body = await request.json();
  const b = body as Record<string, unknown>;

  if (!b.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_inventory_locations')
    .insert({
      organization_id: ctx.organizationId,
      name: b.name,
      location_type: b.location_type ?? 'warehouse',
      address: b.address ?? null,
      contact_info: b.contact_info ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create location', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
