import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET /api/advances/[id]/collaborators — List collaborators
 * POST /api/advances/[id]/collaborators — Invite collaborator
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from('advance_collaborators')
    .select('*, users(full_name, email), organizations(name)')
    .eq('advance_id', id)
    .order('invited_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch collaborators', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  // Verify owning org
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('organization_id, advance_mode')
    .eq('id', id)
    .single();

  if (!advance || (advance as Record<string, unknown>).organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if ((advance as Record<string, unknown>).advance_mode !== 'collection') {
    return NextResponse.json({ error: 'Collaborators can only be added to collection mode advances' }, { status: 400 });
  }

  const body = await request.json();

  if (!body.user_id && !body.organization_id && !body.email) {
    return NextResponse.json({ error: 'Must provide user_id, organization_id, or email' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('advance_collaborators')
    .insert({
      advance_id: id,
      user_id: body.user_id ?? null,
      organization_id: body.organization_id ?? null,
      email: body.email ?? null,
      collaborator_role: body.collaborator_role ?? 'contributor',
      invited_by: ctx.userId,
      allowed_advance_types: body.allowed_advance_types ?? null,
      allowed_category_groups: body.allowed_category_groups ?? null,
      custom_instructions: body.custom_instructions ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to invite collaborator', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
