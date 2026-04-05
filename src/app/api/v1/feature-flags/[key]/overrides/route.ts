import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';

/**
 * PUT /api/v1/feature-flags/:key/overrides — Set a flag override
 * DELETE /api/v1/feature-flags/:key/overrides — Remove a flag override
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { key } = await params;
  const body = await request.json().catch(() => ({}));
  const { organization_id, user_id: targetUserId, enabled, reason, expires_at } = body as {
    organization_id?: string;
    user_id?: string;
    enabled?: boolean;
    reason?: string;
    expires_at?: string;
  };

  if (enabled === undefined) {
    return NextResponse.json({ error: 'enabled is required' }, { status: 400 });
  }

  if (!organization_id && !targetUserId) {
    return NextResponse.json({ error: 'organization_id or user_id is required' }, { status: 400 });
  }

  // Fetch the flag
  const { data: flag } = await ctx.supabase
    .from('feature_flags')
    .select('id, is_platform_controlled')
    .eq('key', key)
    .single();

  if (!flag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });

  // Platform-controlled flags can only be overridden by platform admins
  if (flag.is_platform_controlled) {
    const { data: hasPlatformPerm } = await ctx.supabase.rpc('check_permission', {
      p_user_id: ctx.userId,
      p_action: 'manage',
      p_resource: 'feature_flag',
      p_scope: 'platform',
      p_scope_id: null,
    });

    if (!hasPlatformPerm) {
      return NextResponse.json({ error: 'Platform-controlled flags require platform admin access' }, { status: 403 });
    }
  } else if (organization_id) {
    const { data: hasOrgPerm } = await ctx.supabase.rpc('check_permission', {
      p_user_id: ctx.userId,
      p_action: 'manage',
      p_resource: 'feature_flag',
      p_scope: 'organization',
      p_scope_id: organization_id,
    });

    if (!hasOrgPerm) {
      return NextResponse.json({ error: 'Insufficient permissions to manage feature flags' }, { status: 403 });
    }
  }

  // Upsert override
  const { data: existing } = await ctx.supabase
    .from('feature_flag_overrides')
    .select('id')
    .eq('feature_flag_id', flag.id)
    .eq(organization_id ? 'organization_id' : 'user_id', organization_id ?? targetUserId ?? '')
    .maybeSingle();

  if (existing) {
    await ctx.supabase.from('feature_flag_overrides').update({
      enabled,
      reason: reason ?? null,
      set_by: ctx.userId,
      expires_at: expires_at ?? null,
    }).eq('id', existing.id);
  } else {
    await ctx.supabase.from('feature_flag_overrides').insert({
      feature_flag_id: flag.id,
      organization_id: organization_id ?? null,
      user_id: targetUserId ?? null,
      enabled,
      reason: reason ?? null,
      set_by: ctx.userId,
      expires_at: expires_at ?? null,
    });
  }

  ctx.supabase.from('audit_log').insert({
    organization_id: organization_id ?? null,
    user_id: ctx.userId,
    actor_type: 'user',
    action: 'feature_flag.override_set',
    entity_type: 'feature_flag',
    resource_type: 'feature_flag',
    entity_id: flag.id,
    changes: { after: { key, enabled } },
    metadata: {},
  }).then(() => {});

  return NextResponse.json({ success: true, key, enabled });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { key } = await params;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get('organization_id');
  const targetUserId = url.searchParams.get('user_id');

  const { data: flag } = await ctx.supabase
    .from('feature_flags')
    .select('id')
    .eq('key', key)
    .single();

  if (!flag) return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });

  let query = ctx.supabase
    .from('feature_flag_overrides')
    .delete()
    .eq('feature_flag_id', flag.id);

  if (organizationId) query = query.eq('organization_id', organizationId);
  if (targetUserId) query = query.eq('user_id', targetUserId);

  await query;

  ctx.supabase.from('audit_log').insert({
    organization_id: organizationId ?? null,
    user_id: ctx.userId,
    actor_type: 'user',
    action: 'feature_flag.override_removed',
    entity_type: 'feature_flag',
    resource_type: 'feature_flag',
    entity_id: flag.id,
    changes: {},
    metadata: { key },
  }).then(() => {});

  return NextResponse.json({ success: true });
}
