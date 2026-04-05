import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * PATCH /api/v1/api-keys/:id — Update API key settings
 * DELETE /api/v1/api-keys/:id — Revoke API key
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { name, scopes, is_active, rate_limit_rpm, allowed_ips } = body as {
    name?: string;
    scopes?: string[];
    is_active?: boolean;
    rate_limit_rpm?: number;
    allowed_ips?: string[];
  };

  const { data: apiKey } = await ctx.supabase
    .from('api_keys')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!apiKey) return NextResponse.json({ error: 'API key not found' }, { status: 404 });

  const { data: hasPerm } = await ctx.supabase.rpc('check_permission', {
    p_user_id: ctx.userId,
    p_action: 'manage',
    p_resource: 'api_key',
    p_scope: 'organization',
    p_scope_id: apiKey.organization_id,
  });

  if (!hasPerm) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (scopes !== undefined) updates.scopes = scopes;
  if (is_active !== undefined) updates.is_active = is_active;
  if (rate_limit_rpm !== undefined) updates.rate_limit_rpm = rate_limit_rpm;
  if (allowed_ips !== undefined) updates.allowed_ips = allowed_ips;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: updated, error } = await ctx.supabase
    .from('api_keys')
    .update(updates)
    .eq('id', id)
    .select('id, name, key_prefix, scopes, is_active, rate_limit_rpm')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });

  return NextResponse.json({ success: true, api_key: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { id } = await params;

  const { data: apiKey } = await ctx.supabase
    .from('api_keys')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!apiKey) return NextResponse.json({ error: 'API key not found' }, { status: 404 });

  const { data: hasPerm } = await ctx.supabase.rpc('check_permission', {
    p_user_id: ctx.userId,
    p_action: 'manage',
    p_resource: 'api_key',
    p_scope: 'organization',
    p_scope_id: apiKey.organization_id,
  });

  if (!hasPerm) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  await ctx.supabase.from('api_keys').update({
    revoked_at: new Date().toISOString(),
    is_active: false,
  }).eq('id', id);

  ctx.supabase.from('audit_log').insert({
    organization_id: apiKey.organization_id,
    user_id: ctx.userId,
    actor_type: 'user',
    action: 'api_key.revoked',
    entity_type: 'api_key',
    resource_type: 'api_key',
    entity_id: id,
    changes: {},
    metadata: {},
  }).then(() => {});

  return NextResponse.json({ success: true });
}
