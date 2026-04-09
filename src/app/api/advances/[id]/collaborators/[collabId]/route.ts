import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * PATCH  /api/advances/[id]/collaborators/[collabId] — Accept/decline/update collaborator
 * DELETE /api/advances/[id]/collaborators/[collabId] — Revoke/remove collaborator
 *
 * Gap: H-06 — No accept/decline flow for collaborators
 * Gap: H-07 — No revoke mechanism
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; collabId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, collabId } = await params;
  const body = await request.json();

  const action = (body as Record<string, unknown>).action as string;

  if (!['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 422 });
  }

  // Verify the collaborator belongs to the current user
  const { data: collab } = await ctx.supabase
    .from('advance_collaborators')
    .select('user_id, status')
    .eq('id', collabId)
    .eq('advance_id', id)
    .single();

  if (!collab) {
    return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
  }

  const c = collab as Record<string, unknown>;

  // Only the invited user or org admin can accept/decline
  if (c.user_id !== ctx.userId) {
    // Check if org admin
    const { data: advance } = await ctx.supabase
      .from('production_advances')
      .select('organization_id')
      .eq('id', id)
      .single();

    if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
  }

  if (c.status !== 'invited') {
    return NextResponse.json({ error: 'Collaborator is not in invited state' }, { status: 400 });
  }

  const newStatus = action === 'accept' ? 'active' : 'declined';
  const update: Record<string, unknown> = {
    status: newStatus,
    responded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await ctx.supabase
    .from('advance_collaborators')
    .update(update)
    .eq('id', collabId)
    .eq('advance_id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update collaborator', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; collabId: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id, collabId } = await params;

  // Only org admin can revoke
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Only the owning organization can revoke collaborators' }, { status: 403 });
  }

  // Soft-revoke: set status to 'revoked' instead of hard delete
  const { data, error } = await ctx.supabase
    .from('advance_collaborators')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', collabId)
    .eq('advance_id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to revoke collaborator', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
