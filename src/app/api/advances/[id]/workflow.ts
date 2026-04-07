import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { validateStatusTransition } from '@/lib/advances/validations';
import type { AdvanceMode, AdvanceStatus } from '@/types/database';

/**
 * Shared workflow action handler for advance status transitions.
 * Each action route imports this and calls it with the target status.
 */
export async function transitionAdvanceStatus(
  advanceId: string,
  targetStatus: AdvanceStatus,
  options?: { reason?: string; note?: string },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('status, advance_mode, organization_id')
    .eq('id', advanceId)
    .single();

  if (!advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const a = advance as Record<string, unknown>;

  // Only owning org can perform workflow actions (except contributor submit)
  if (a.organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden — only the owning organization can perform this action' }, { status: 403 });
  }

  const validation = validateStatusTransition(
    a.advance_mode as AdvanceMode,
    a.status as AdvanceStatus,
    targetStatus,
  );

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const update: Record<string, unknown> = { status: targetStatus };

  if (targetStatus === 'approved' || targetStatus === 'rejected') {
    update.reviewed_by = ctx.userId;
    update.reviewed_at = new Date().toISOString();
  }
  if (targetStatus === 'rejected' && options?.reason) {
    update.rejection_reason = options.reason;
  }
  if (targetStatus === 'changes_requested' && options?.note) {
    update.changes_requested_note = options.note;
  }

  const { data, error } = await ctx.supabase
    .from('production_advances')
    .update(update)
    .eq('id', advanceId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ─── Individual Action Route Handlers ───

export async function createSubmitHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return transitionAdvanceStatus(id, 'submitted');
}

export async function createOpenHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return transitionAdvanceStatus(id, 'open_for_submissions');
}

export async function createCloseSubmissionsHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return transitionAdvanceStatus(id, 'under_review');
}

export async function createApproveHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return transitionAdvanceStatus(id, 'approved');
}

export async function createRejectHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return transitionAdvanceStatus(id, 'rejected', { reason: body.reason });
}

export async function createRequestChangesHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  return transitionAdvanceStatus(id, 'changes_requested', { note: body.note });
}

export async function createCancelHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return transitionAdvanceStatus(id, 'cancelled');
}
