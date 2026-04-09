import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET    /api/advances/catalog/items — List catalog items with filtering
 * POST   /api/advances/catalog/items — Create catalog item
 *
 * Gap: H-16 — Catalog items could be browsed but not created/managed
 */

export async function GET(
  request: NextRequest,
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const subcategoryId = url.searchParams.get('subcategory_id');
  const search = url.searchParams.get('q');
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100);
  const offset = (page - 1) * limit;

  let query = ctx.supabase
    .from('advance_catalog_items')
    .select('*, advance_catalog_variants(*)', { count: 'exact' })
    .eq('organization_id', ctx.organizationId)
    .eq('is_active', true);

  if (subcategoryId) query = query.eq('subcategory_id', subcategoryId);
  if (search) query = query.textSearch('search_vector', search, { type: 'websearch' });

  query = query
    .order('sort_order', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch catalog items', details: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: { page, limit, total: count ?? 0 },
  });
}

export async function POST(
  request: NextRequest,
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const body = await request.json();
  const b = body as Record<string, unknown>;

  if (!b.name || !b.item_code || !b.subcategory_id) {
    return NextResponse.json({ error: 'name, item_code, and subcategory_id are required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_catalog_items')
    .insert({
      organization_id: ctx.organizationId,
      subcategory_id: b.subcategory_id,
      item_code: b.item_code,
      sku_prefix: b.sku_prefix ?? null,
      name: b.name,
      display_name: b.display_name ?? null,
      related_names: b.related_names ?? [],
      description: b.description ?? null,
      short_description: b.short_description ?? null,
      product_type: b.product_type ?? 'standard',
      procurement_method: b.procurement_method ?? 'rent',
      variant_attributes: b.variant_attributes ?? [],
      has_variants: b.has_variants ?? false,
      pricing_strategy: b.pricing_strategy ?? 'fixed',
      default_unit_of_measure: b.default_unit_of_measure ?? 'day',
      specifications: b.specifications ?? {},
      prerequisites: b.prerequisites ?? [],
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create catalog item', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
