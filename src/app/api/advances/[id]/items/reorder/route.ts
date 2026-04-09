import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * PATCH /api/advances/[id]/items/reorder — Batch update sort_order
 *
 * Gap: L-04 — Line items have sort_order but no endpoint to change it
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();

  const order = (body as Record<string, unknown>).order as Array<{ id: string; sort_order: number }>;
  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: 'order array is required' }, { status: 422 });
  }

  // Verify advance ownership
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Batch update sort orders
  const updates = order.map((item) =>
    ctx.supabase
      .from('advance_line_items')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id)
      .eq('advance_id', id),
  );

  await Promise.all(updates);

  return NextResponse.json({ success: true, updated: order.length });
}
