import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * POST /api/advances/[id]/items/[itemId]/fulfillment — Update fulfillment status
 *
 * Gap: H-01 — The 14-state fulfillment pipeline was defined in constants but
 * had no API to drive it. Line item fulfillment_status was stuck at 'pending'.
 */

const FULFILLMENT_PIPELINE: Record<string, string[]> = {
  pending:        ['sourcing', 'cancelled'],
  sourcing:       ['quoted', 'confirmed', 'cancelled'],
  quoted:         ['confirmed', 'sourcing', 'cancelled'],
  confirmed:      ['reserved', 'in_transit', 'cancelled'],
  reserved:       ['in_transit', 'delivered', 'cancelled'],
  in_transit:     ['delivered', 'cancelled'],
  delivered:      ['inspected', 'damaged'],
  inspected:      ['setup_complete', 'damaged'],
  setup_complete: ['active'],
  active:         ['struck'],
  struck:         ['returned', 'damaged'],
  returned:       [],
  damaged:        [],
  cancelled:      [],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, itemId } = await params;
  const body = await request.json();

  const targetStatus = (body as Record<string, unknown>).status as string;
  if (!targetStatus || !Object.keys(FULFILLMENT_PIPELINE).includes(targetStatus)) {
    return NextResponse.json({ error: 'Invalid fulfillment status' }, { status: 422 });
  }

  // Verify advance belongs to org
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Get current fulfillment status
  const { data: item } = await ctx.supabase
    .from('advance_line_items')
    .select('fulfillment_status')
    .eq('id', itemId)
    .eq('advance_id', id)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
  }

  const currentStatus = (item as Record<string, unknown>).fulfillment_status as string;
  const allowed = FULFILLMENT_PIPELINE[currentStatus] ?? [];

  if (!allowed.includes(targetStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${currentStatus}' to '${targetStatus}'. Allowed: ${allowed.join(', ')}` },
      { status: 400 },
    );
  }

  // Build update
  const update: Record<string, unknown> = {
    fulfillment_status: targetStatus,
    updated_at: new Date().toISOString(),
  };

  // Add delivery tracking if relevant
  if (targetStatus === 'delivered') update.actual_delivery_at = new Date().toISOString();
  if (targetStatus === 'returned') update.returned_at = new Date().toISOString();
  if ((body as Record<string, unknown>).tracking_number) update.tracking_number = (body as Record<string, unknown>).tracking_number;
  if ((body as Record<string, unknown>).vendor_confirmation_number) update.vendor_confirmation_number = (body as Record<string, unknown>).vendor_confirmation_number;
  if ((body as Record<string, unknown>).damage_report) update.damage_report = (body as Record<string, unknown>).damage_report;

  const { data, error } = await ctx.supabase
    .from('advance_line_items')
    .update(update)
    .eq('id', itemId)
    .eq('advance_id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update fulfillment status', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
