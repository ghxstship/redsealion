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
    .eq('organization_id', ctx.organizationId)
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
    .eq('organization_id', ctx.organizationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update status', details: error.message }, { status: 500 });
  }

  // H-05: Dispatch in-app notifications (fire-and-forget)
  try {
    const d = data as Record<string, unknown>;
    const STATUS_LABELS: Record<string, string> = {
      submitted: 'submitted for review',
      approved: 'approved',
      rejected: 'rejected',
      changes_requested: 'sent back for changes',
      on_hold: 'placed on hold',
      partially_fulfilled: 'partially fulfilled',
      fulfilled: 'marked as fulfilled',
      completed: 'completed',
      cancelled: 'cancelled',
    };
    const label = STATUS_LABELS[targetStatus] ?? targetStatus.replace(/_/g, ' ');
    const title = `Advance ${d.advance_number} ${label}`;

    // Notify the advance creator (if not the actor)
    const recipients: string[] = [];
    if (d.created_by && d.created_by !== ctx.userId) {
      recipients.push(d.created_by as string);
    }

    // Notify active collaborators
    const { data: collabs } = await ctx.supabase
      .from('advance_collaborators')
      .select('user_id')
      .eq('advance_id', advanceId)
      .eq('invite_status', 'accepted');

    if (collabs) {
      for (const c of collabs as Array<{ user_id: string | null }>) {
        if (c.user_id && c.user_id !== ctx.userId && !recipients.includes(c.user_id)) {
          recipients.push(c.user_id);
        }
      }
    }

    if (recipients.length > 0) {
      const notifications = recipients.map((uid) => ({
        organization_id: ctx.organizationId,
        user_id: uid,
        type: 'advance_status_change',
        title,
        body: `${d.event_name ?? 'Advance'} has been ${label}.${options?.reason ? ` Reason: ${options.reason}` : ''}`,
        entity_type: 'advance',
        entity_id: advanceId,
        is_read: false,
      }));
      await ctx.supabase.from('notifications').insert(notifications);
    }
  } catch {
    // Notification failures must not block the workflow
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
