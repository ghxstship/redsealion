import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * POST /api/advances/[id]/duplicate — Deep copy advance with line items
 *
 * Gap: M-02 — AdvanceListTable row action only had "View"
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  // Fetch the source advance
  const { data: source } = await ctx.supabase
    .from('production_advances')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (!source) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const s = source as Record<string, unknown>;

  // Generate a proper new advance number for the copy
  const { data: newNumber } = await ctx.supabase.rpc('generate_advance_number', { org_id: ctx.organizationId });

  // Create the new advance as draft
  const { data: newAdvance, error: advErr } = await ctx.supabase
    .from('production_advances')
    .insert({
      organization_id: ctx.organizationId,
      project_id: s.project_id,
      advance_number: newNumber ?? `ADV-${Date.now()}`,
      event_name: s.event_name,
      venue_name: s.venue_name,
      venue_address: s.venue_address,
      advance_type: s.advance_type,
      advance_mode: s.advance_mode,
      priority: s.priority,
      purpose: s.purpose,
      special_considerations: s.special_considerations,
      notes: s.notes,
      internal_notes: s.internal_notes,
      submission_instructions: s.submission_instructions,
      fulfillment_type: s.fulfillment_type,
      is_catalog_shared: s.is_catalog_shared,
      allow_ad_hoc_items: s.allow_ad_hoc_items,
      require_approval_per_contributor: s.require_approval_per_contributor,
      allowed_advance_types: s.allowed_advance_types,
      allowed_category_groups: s.allowed_category_groups,
      status: 'draft',
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (advErr || !newAdvance) {
    return NextResponse.json({ error: 'Failed to duplicate advance', details: advErr?.message }, { status: 500 });
  }

  // Copy line items
  const { data: sourceItems } = await ctx.supabase
    .from('advance_line_items')
    .select('*')
    .eq('advance_id', id)
    .order('sort_order', { ascending: true });

  if (sourceItems && sourceItems.length > 0) {
    const newItems = (sourceItems as Array<Record<string, unknown>>).map((item, idx) => ({
      organization_id: ctx.organizationId,
      advance_id: (newAdvance as Record<string, unknown>).id,
      catalog_item_id: item.catalog_item_id,
      catalog_variant_id: item.catalog_variant_id,
      item_code: item.item_code,
      item_name: item.item_name,
      item_description: item.item_description,
      variant_name: item.variant_name,
      variant_sku: item.variant_sku,
      category_group_slug: item.category_group_slug,
      category_slug: item.category_slug,
      subcategory_slug: item.subcategory_slug,
      quantity: item.quantity,
      unit_of_measure: item.unit_of_measure,
      unit_price_cents: item.unit_price_cents,
      modifier_total_cents: item.modifier_total_cents,
      line_total_cents: item.line_total_cents,
      selected_modifiers: item.selected_modifiers,
      make_model: item.make_model,
      purpose: item.purpose,
      notes: item.notes,
      service_date_ranges: item.service_date_ranges,
      is_existing: item.is_existing,
      is_tentative: item.is_tentative,
      shift_type: item.shift_type,
      hours_per_day: item.hours_per_day,
      headcount: item.headcount,
      power_requirements: item.power_requirements,
      submitted_by_user_id: ctx.userId,
      sort_order: idx + 1,
      // Reset fulfillment and approval statuses
      fulfillment_status: 'pending',
      approval_status: 'pending',
    }));

    await ctx.supabase.from('advance_line_items').insert(newItems);
  }

  return NextResponse.json({ data: newAdvance }, { status: 201 });
}
