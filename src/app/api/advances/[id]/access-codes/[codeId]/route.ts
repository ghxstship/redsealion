import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * DELETE /api/advances/[id]/access-codes/[codeId] — Revoke an access code
 *
 * Gap: C-02 — AccessCodeManager.tsx calls DELETE but no route existed
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; codeId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, codeId } = await params;

  // Verify advance belongs to user's org
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Deactivate instead of hard delete (preserves audit trail)
  const { data, error } = await ctx.supabase
    .from('advance_access_codes')
    .update({ is_active: false })
    .eq('id', codeId)
    .eq('advance_id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to revoke access code', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
