import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * POST /api/advances/[id]/items/batch — Batch add multiple line items
 *
 * Gap: H-14 — Only single-item POST existed. Pasting a spreadsheet or
 * importing an advance template needs batch insert.
 */

const WRITABLE_STATUSES = ['draft', 'open_for_submissions', 'changes_requested'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();

  const items = (body as Record<string, unknown>).items as Array<Record<string, unknown>>;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 422 });
  }

  if (items.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 items per batch' }, { status: 422 });
  }

  // Verify advance is writable
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('status, organization_id, line_item_count')
    .eq('id', id)
    .single();

  if (!advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const a = advance as Record<string, unknown>;
  if (!WRITABLE_STATUSES.includes(a.status as string)) {
    return NextResponse.json({ error: 'Advance is not in a writable state' }, { status: 400 });
  }

  // Build insert rows
  const currentSort = (a.line_item_count as number) ?? 0;
  const rows = items.map((item, idx) => {
    const qty = (item.quantity as number) ?? 1;
    const unitPrice = item.unit_price_cents as number | null ?? null;
    const mods = (item.selected_modifiers ?? []) as Array<{ price_adjustment_cents: number; quantity?: number }>;
    const modTotal = mods.reduce((sum, m) => sum + m.price_adjustment_cents * (m.quantity || 1), 0);

    return {
      organization_id: a.organization_id as string,
      advance_id: id,
      catalog_item_id: item.catalog_item_id ?? null,
      catalog_variant_id: item.catalog_variant_id ?? null,
      item_code: item.item_code ?? null,
      item_name: item.item_name,
      item_description: item.item_description ?? null,
      variant_name: item.variant_name ?? null,
      variant_sku: item.variant_sku ?? null,
      category_group_slug: item.category_group_slug ?? null,
      category_slug: item.category_slug ?? null,
      subcategory_slug: item.subcategory_slug ?? null,
      quantity: qty,
      unit_of_measure: item.unit_of_measure ?? 'day',
      unit_price_cents: unitPrice,
      modifier_total_cents: modTotal,
      line_total_cents: unitPrice !== null ? (unitPrice * qty) + modTotal : null,
      selected_modifiers: mods.length > 0 ? mods : undefined,
      make_model: item.make_model ?? null,
      purpose: item.purpose ?? null,
      notes: item.notes ?? null,
      service_start_date: item.service_start_date ?? null,
      service_end_date: item.service_end_date ?? null,
      service_date_ranges: item.service_date_ranges ?? [],
      is_existing: item.is_existing ?? false,
      is_tentative: item.is_tentative ?? false,
      shift_type: item.shift_type ?? null,
      hours_per_day: item.hours_per_day ?? null,
      headcount: item.headcount ?? null,
      power_requirements: item.power_requirements ?? null,
      submitted_by_user_id: ctx.userId,
      sort_order: currentSort + idx + 1,
    };
  });

  const { data, error } = await ctx.supabase
    .from('advance_line_items')
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: 'Failed to insert items', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count: data?.length ?? 0 }, { status: 201 });
}
