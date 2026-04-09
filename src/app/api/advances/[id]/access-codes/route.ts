import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * GET  /api/advances/[id]/access-codes — List access codes
 * POST /api/advances/[id]/access-codes — Generate new access code
 *
 * Gap: C-02 — AccessCodeManager.tsx calls these endpoints but they didn't exist
 */

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for readability
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from('advance_access_codes')
    .select('*')
    .eq('advance_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch access codes', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;
  const { id } = await params;
  const body = await request.json();

  // Verify advance exists and belongs to the user's org
  const { data: advance } = await ctx.supabase
    .from('production_advances')
    .select('organization_id, advance_mode')
    .eq('id', id)
    .single();

  if (!advance) {
    return NextResponse.json({ error: 'Advance not found' }, { status: 404 });
  }

  const a = advance as Record<string, unknown>;

  if (a.organization_id !== ctx.organizationId) {
    return NextResponse.json({ error: 'Only the owning organization can create access codes' }, { status: 403 });
  }

  if (a.advance_mode !== 'collection') {
    return NextResponse.json({ error: 'Access codes are only available for collection mode advances' }, { status: 400 });
  }

  // Generate a unique code
  let code = body.code ?? generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await ctx.supabase
      .from('advance_access_codes')
      .select('id')
      .eq('advance_id', id)
      .eq('code', code)
      .single();
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  const { data, error } = await ctx.supabase
    .from('advance_access_codes')
    .insert({
      advance_id: id,
      code,
      code_type: body.code_type ?? 'multi_use',
      collaborator_role: body.collaborator_role ?? 'contributor',
      allowed_advance_types: body.allowed_advance_types ?? null,
      allowed_category_groups: body.allowed_category_groups ?? null,
      allowed_domains: body.allowed_domains ?? null,
      max_uses: body.max_uses ?? null,
      expires_at: body.expires_at ?? null,
      is_active: true,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create access code', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
