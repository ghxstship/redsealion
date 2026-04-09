import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * POST /api/advances/[id]/items/[itemId]/approve — Approve a line item
 *
 * Gap: C-09 — AdvanceLineItemRow has approve/reject buttons but no API backed them
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, itemId } = await params;

  // Verify advance belongs to user's org (only org admins can approve)
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Only the owning organization can approve items' }, { status: 403 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_line_items')
    .update({
      approval_status: 'approved',
      approved_by: ctx.userId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('advance_id', id)
    .eq('approval_status', 'pending')
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to approve item (may already be reviewed)', details: error?.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ data });
}
