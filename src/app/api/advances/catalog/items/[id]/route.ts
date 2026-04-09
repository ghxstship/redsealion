import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET    /api/advances/catalog/items/[id] — Get item with variants
 * PATCH  /api/advances/catalog/items/[id] — Update item
 * DELETE /api/advances/catalog/items/[id] — Deactivate item
 *
 * Gap: H-16 — Catalog items could be browsed but not managed
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from('advance_catalog_items')
    .select('*, advance_catalog_variants(*), advance_item_modifier_lists(*, advance_modifier_lists(*, advance_modifier_options(*)))')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    'name', 'display_name', 'related_names', 'description', 'short_description',
    'product_type', 'procurement_method', 'variant_attributes', 'has_variants',
    'pricing_strategy', 'default_unit_of_measure', 'specifications',
    'prerequisites', 'recommended_items', 'bundle_components',
    'is_active', 'is_taxable', 'is_discountable', 'is_trackable',
    'image_urls', 'thumbnail_url', 'sort_order',
  ];

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of allowedFields) {
    if ((body as Record<string, unknown>)[f] !== undefined) update[f] = (body as Record<string, unknown>)[f];
  }

  const { data, error } = await ctx.supabase
    .from('advance_catalog_items')
    .update(update)
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update item', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  // Soft-deactivate instead of hard delete to preserve line item references
  const { data, error } = await ctx.supabase
    .from('advance_catalog_items')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to deactivate item', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
