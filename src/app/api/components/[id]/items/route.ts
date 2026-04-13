import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/components/[id]/items — List items for a component
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabase
    .from('component_items')
    .select(`
      *,
      advance_catalog_items(
        id, name, item_code, display_name, description,
        subcategory_id,
        advance_subcategories(
          name, slug,
          advance_categories(
            name, slug,
            advance_category_groups(name, slug, color_hex, icon)
          )
        )
      ),
      advance_catalog_variants(id, name, sku, price_cents),
      advance_line_items(id, advance_id, approval_status)
    `)
    .eq('component_id', id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

/**
 * POST /api/components/[id]/items — Add a catalog item to a component
 * This is the L6 assignment endpoint. It links an advance_catalog_item
 * to a component with quantity, pricing, and optional cart bridge.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: componentId } = await params;
  const body = await request.json();
  const {
    organization_id, catalog_item_id, catalog_variant_id,
    quantity, unit_price_cents, unit_of_measure, duration_days,
    advance_line_item_id, notes, sort_order
  } = body;

  if (!organization_id || !catalog_item_id) {
    return NextResponse.json({ error: 'organization_id and catalog_item_id are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('component_items')
    .insert({
      organization_id,
      component_id: componentId,
      catalog_item_id,
      catalog_variant_id: catalog_variant_id || null,
      quantity: quantity || 1,
      unit_price_cents: unit_price_cents || 0,
      unit_of_measure: unit_of_measure || 'day',
      duration_days: duration_days || 1,
      advance_line_item_id: advance_line_item_id || null,
      notes,
      sort_order: sort_order || 0,
      created_by: user.id,
    })
    .select(`
      *,
      advance_catalog_items(id, name, item_code)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If linking from cart, also update the advance_line_item with component_id
  if (advance_line_item_id) {
    await supabase
      .from('advance_line_items')
      .update({ component_id: componentId })
      .eq('id', advance_line_item_id);
  }

  return NextResponse.json(data, { status: 201 });
}
