import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET  /api/advances/templates — List templates
 * POST /api/advances/templates — Create template from an advance
 *
 * Gap: H-02 — Template table existed but no API routes
 */

export async function GET(
  _request: NextRequest,
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { data, error } = await ctx.supabase
    .from('advance_templates')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch templates', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: NextRequest,
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const body = await request.json();

  const {
    name, description, advance_type, advance_mode, source_advance_id,
    default_line_items, default_settings,
  } = body as Record<string, unknown>;

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 422 });
  }

  // If saving from an existing advance, snapshot its line items
  let lineItemsSnapshot = default_line_items ?? [];
  if (source_advance_id && !default_line_items) {
    const { data: items } = await ctx.supabase
      .from('advance_line_items')
      .select('item_name, item_description, variant_name, variant_sku, catalog_item_id, catalog_variant_id, item_code, category_group_slug, category_slug, subcategory_slug, quantity, unit_of_measure, unit_price_cents, selected_modifiers, make_model, purpose, notes')
      .eq('advance_id', source_advance_id)
      .order('sort_order', { ascending: true });
    lineItemsSnapshot = items ?? [];
  }

  const { data, error } = await ctx.supabase
    .from('advance_templates')
    .insert({
      organization_id: ctx.organizationId,
      name,
      description: description ?? null,
      advance_type: advance_type ?? 'standard',
      advance_mode: advance_mode ?? 'direct',
      template_data: {
        line_items: lineItemsSnapshot,
        settings: default_settings ?? {},
      },
      created_by: ctx.userId,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create template', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
