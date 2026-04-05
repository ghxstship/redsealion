import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { createHash, randomBytes } from 'crypto';

/**
 * POST /api/v1/api-keys — Create API key (returns raw key exactly once)
 * GET /api/v1/api-keys — List API keys (masked)
 */
export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const { name, role_id, scopes = [], expires_at, rate_limit_rpm, allowed_ips = [] } = body as {
    name?: string;
    role_id?: string;
    scopes?: string[];
    expires_at?: string;
    rate_limit_rpm?: number;
    allowed_ips?: string[];
  };

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  // Permission check
  const { data: hasPerm } = await ctx.supabase.rpc('check_permission', {
    p_user_id: ctx.userId,
    p_action: 'manage',
    p_resource: 'api_key',
    p_scope: 'organization',
    p_scope_id: ctx.organizationId,
  });

  if (!hasPerm) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });

  // If role_id specified, validate hierarchy ceiling
  if (role_id) {
    const { data: keyRole } = await ctx.supabase.from('roles').select('hierarchy_level').eq('id', role_id).single();
    const { data: actorMembership } = await ctx.supabase
      .from('organization_memberships')
      .select('role_id, roles!organization_memberships_role_id_fkey(hierarchy_level)')
      .eq('user_id', ctx.userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    const actorLevel = (actorMembership as Record<string, unknown>)?.roles
      ? ((actorMembership as Record<string, unknown>).roles as Record<string, number>)?.hierarchy_level ?? 99
      : 99;

    if (keyRole && (keyRole.hierarchy_level as number) < actorLevel) {
      return NextResponse.json({ error: 'API key role cannot exceed your own hierarchy level' }, { status: 403 });
    }
  }

  // Generate the raw key
  const rawKey = `fd_live_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 16);

  const { data: apiKey, error } = await ctx.supabase
    .from('api_keys')
    .insert({
      organization_id: ctx.organizationId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      role_id: role_id ?? null,
      scopes,
      expires_at: expires_at ?? null,
      rate_limit_rpm: rate_limit_rpm ?? 60,
      allowed_ips: allowed_ips,
      is_active: true,
      created_by: ctx.userId,
    })
    .select('id, name, key_prefix, scopes, created_at, expires_at')
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create API key', details: error.message }, { status: 500 });

  ctx.supabase.from('audit_log').insert({
    organization_id: ctx.organizationId,
    user_id: ctx.userId,
    actor_type: 'user',
    action: 'api_key.created',
    entity_type: 'api_key',
    resource_type: 'api_key',
    entity_id: apiKey.id,
    changes: {},
    metadata: { name, scopes },
  }).then(() => {});

  // Return raw key exactly once
  return NextResponse.json({
    success: true,
    api_key: { ...apiKey, key: rawKey },
    warning: 'Store this key securely. It will not be shown again.',
  }, { status: 201 });
}

export async function GET() {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { data: keys, error } = await ctx.supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, last_used_at, expires_at, created_at, created_by')
    .eq('organization_id', ctx.organizationId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });

  return NextResponse.json({ api_keys: keys ?? [] });
}
