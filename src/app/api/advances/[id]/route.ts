import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET /api/advances/[id] — Advance detail (scoped by role)
 * PATCH /api/advances/[id] — Update draft/open advance
 * DELETE /api/advances/[id] — Delete draft only
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;

  const { data: advance, error } = await ctx.supabase
    .from('production_advances')
    .select('*, projects(name)')
    .eq('id', id)
    .single();

  if (error || !advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  // Fetch line items
  const { data: lineItems } = await ctx.supabase
    .from('advance_line_items')
    .select('*')
    .eq('advance_id', id)
    .order('sort_order', { ascending: true });

  // Fetch collaborators if collection mode
  let collaborators = null;
  if ((advance as Record<string, unknown>).advance_mode === 'collection') {
    const { data: collabs } = await ctx.supabase
      .from('advance_collaborators')
      .select('*, users(full_name, email), organizations(name)')
      .eq('advance_id', id)
      .order('invited_at', { ascending: true });
    collaborators = collabs;
  }

  // Fetch status history
  const { data: statusHistory } = await ctx.supabase
    .from('advance_status_history')
    .select('*')
    .eq('advance_id', id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    data: {
      ...advance,
      line_items: lineItems ?? [],
      collaborators,
      status_history: statusHistory ?? [],
    },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();

  // Verify ownership
  const { data: existing } = await ctx.supabase
    .from('production_advances')
    .select('status, organization_id, version')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  if ((existing as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const status = (existing as Record<string, unknown>).status as string;
  if (!['draft', 'open_for_submissions', 'changes_requested'].includes(status)) {
    return NextResponse.json(
      { error: 'Cannot edit advance in current status', status },
      { status: 400 },
    );
  }

  // Build update object — only include fields that were sent
  const update: Record<string, unknown> = {};
  const allowedFields = [
    'event_name', 'venue_name', 'venue_address', 'advance_type', 'priority',
    'service_start_date', 'service_end_date', 'load_in_date', 'strike_date',
    'submission_deadline', 'purpose', 'special_considerations', 'notes',
    'internal_notes', 'submission_instructions', 'fulfillment_type',
    'is_catalog_shared', 'allow_ad_hoc_items', 'require_approval_per_contributor',
    'allowed_advance_types', 'allowed_category_groups', 'max_submissions',
  ];

  for (const field of allowedFields) {
    if (field in body) update[field] = body[field];
  }

  // Optimistic locking
  if (body.version) {
    update.version = body.version;
  }

  const { data, error } = await ctx.supabase
    .from('production_advances')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '40001') {
      return NextResponse.json({ error: 'Version conflict — please refresh and try again' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update advance', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;

  const { data: existing } = await ctx.supabase
    .from('production_advances')
    .select('status, organization_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  if ((existing as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if ((existing as Record<string, unknown>).status !== 'draft') {
    return NextResponse.json({ error: 'Only draft advances can be deleted' }, { status: 400 });
  }

  const { error } = await ctx.supabase.from('production_advances').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete advance', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true } });
}
