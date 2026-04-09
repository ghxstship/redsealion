import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET  /api/advances/[id]/items/[itemId] — Get single line item
 * PATCH /api/advances/[id]/items/[itemId] — Update line item
 * DELETE /api/advances/[id]/items/[itemId] — Delete line item
 *
 * Gap: C-01 (no update/delete), C-11 (no GET for individual items)
 */

const WRITABLE_STATUSES = ['draft', 'open_for_submissions', 'changes_requested'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, itemId } = await params;

  const { data, error } = await ctx.supabase
    .from('advance_line_items')
    .select('*')
    .eq('advance_id', id)
    .eq('id', itemId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, itemId } = await params;
  const body = await request.json();

  // Verify the advance is in a writable state
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('status, organization_id')
    .eq('id', id)
    .single();

  if (!advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const a = advance as Record<string, unknown>;
  if (!WRITABLE_STATUSES.includes(a.status as string)) {
    return NextResponse.json(
      { error: 'Advance is not in a writable state' },
      { status: 400 },
    );
  }

  // Verify line item exists and belongs to this advance
  const { data: existing } = await ctx.supabase
    .from('advance_line_items')
    .select('id, submitted_by_user_id, approval_status')
    .eq('id', itemId)
    .eq('advance_id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
  }

  const item = existing as Record<string, unknown>;

  // Collaborators can only edit their own pending items
  if (a.organization_id !== ctx.organizationId) {
    if (item.submitted_by_user_id !== ctx.userId) {
      return NextResponse.json({ error: 'Cannot edit another user\'s line item' }, { status: 403 });
    }
    if (item.approval_status !== 'pending') {
      return NextResponse.json({ error: 'Cannot edit an already-reviewed line item' }, { status: 400 });
    }
  }

  // Build update payload — only allow specific fields
  const allowedFields = [
    'item_name', 'item_description', 'variant_name', 'variant_sku',
    'quantity', 'unit_of_measure', 'make_model', 'selected_modifiers',
    'service_start_date', 'service_end_date', 'service_date_ranges',
    'load_in_date', 'strike_date',
    'purpose', 'special_considerations', 'notes', 'special_request',
    'unit_price_cents', 'is_existing', 'is_tentative',
    'shift_type', 'hours_per_day', 'headcount', 'power_requirements',
    'sort_order', 'internal_notes',
  ];

  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  }

  // Recalculate line_total_cents if pricing fields changed
  if (update.unit_price_cents !== undefined || update.quantity !== undefined || update.selected_modifiers !== undefined) {
    const qty = (update.quantity ?? body.quantity ?? 1) as number;
    const unitPrice = (update.unit_price_cents ?? body.unit_price_cents ?? null) as number | null;
    const mods = (update.selected_modifiers ?? body.selected_modifiers ?? []) as Array<{ price_adjustment_cents: number; quantity?: number }>;
    const modTotal = mods.reduce((sum, m) => sum + m.price_adjustment_cents * (m.quantity || 1), 0);
    update.modifier_total_cents = modTotal;
    update.line_total_cents = unitPrice !== null ? (unitPrice * qty) + modTotal : null;
  }

  update.updated_at = new Date().toISOString();

  const { data, error } = await ctx.supabase
    .from('advance_line_items')
    .update(update)
    .eq('id', itemId)
    .eq('advance_id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update line item', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, itemId } = await params;

  // Verify advance is writable
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('status, organization_id')
    .eq('id', id)
    .single();

  if (!advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const a = advance as Record<string, unknown>;
  if (!WRITABLE_STATUSES.includes(a.status as string)) {
    return NextResponse.json(
      { error: 'Advance is not in a writable state' },
      { status: 400 },
    );
  }

  // Verify item exists
  const { data: existing } = await ctx.supabase
    .from('advance_line_items')
    .select('id, submitted_by_user_id')
    .eq('id', itemId)
    .eq('advance_id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
  }

  // Collaborators can only delete their own items
  const item = existing as Record<string, unknown>;
  if (a.organization_id !== ctx.organizationId && item.submitted_by_user_id !== ctx.userId) {
    return NextResponse.json({ error: 'Cannot delete another user\'s line item' }, { status: 403 });
  }

  const { error } = await ctx.supabase
    .from('advance_line_items')
    .delete()
    .eq('id', itemId)
    .eq('advance_id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete line item', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
