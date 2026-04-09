import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET    /api/advances/templates/[id] — Get template detail
 * PATCH  /api/advances/templates/[id] — Update template
 * DELETE /api/advances/templates/[id] — Delete template
 *
 * Gap: H-02 — Completes template CRUD
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from('advance_templates')
    .select('*')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();

  const allowedFields = ['name', 'description', 'advance_type', 'advance_mode', 'template_data', 'is_active'];
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const f of allowedFields) {
    if ((body as Record<string, unknown>)[f] !== undefined) update[f] = (body as Record<string, unknown>)[f];
  }

  const { data, error } = await ctx.supabase
    .from('advance_templates')
    .update(update)
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to update template', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const { error } = await ctx.supabase
    .from('advance_templates')
    .delete()
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete template', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
