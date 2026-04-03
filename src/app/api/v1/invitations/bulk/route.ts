import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/v1/invitations/bulk — Bulk send invitations
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { invitations } = body as {
    invitations?: Array<{
      scope_type: string;
      scope_id: string;
      invited_email: string;
      role_id: string;
      seat_type?: string;
      personal_message?: string;
    }>;
  };

  if (!invitations || invitations.length === 0) {
    return NextResponse.json({ error: 'invitations array is required' }, { status: 400 });
  }

  // Get user's org
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (!membership) return NextResponse.json({ error: 'No active membership' }, { status: 403 });

  const orgId = membership.organization_id as string;

  // Check bulk_invite permission
  const { data: hasBulkPerm } = await supabase.rpc('check_permission', {
    p_user_id: user.id,
    p_action: 'bulk_invite',
    p_resource: 'member',
    p_scope: 'organization',
    p_scope_id: orgId,
  });

  if (!hasBulkPerm) {
    return NextResponse.json({ error: 'Insufficient permissions for bulk invitations' }, { status: 403 });
  }

  // Check feature flag
  const { data: flagEnabled } = await supabase.rpc('evaluate_feature_flag', {
    p_key: 'bulk_invitations',
    p_org_id: orgId,
    p_user_id: user.id,
  });

  if (!flagEnabled) {
    return NextResponse.json({ error: 'Bulk invitations feature is not available on your plan' }, { status: 403 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('invite_expiry_hours')
    .eq('id', orgId)
    .single();

  const expiryHours = (org?.invite_expiry_hours as number) ?? 168;

  const results: Array<{ email: string; status: string; id?: string }> = [];

  for (const inv of invitations) {
    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

    const { data: created, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: orgId,
        scope_type: inv.scope_type,
        scope_id: inv.scope_id,
        invited_email: inv.invited_email,
        role_id: inv.role_id,
        seat_type: inv.seat_type ?? 'internal',
        invited_by: user.id,
        token,
        personal_message: inv.personal_message ?? null,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (error) {
      results.push({ email: inv.invited_email, status: 'failed' });
    } else {
      results.push({ email: inv.invited_email, status: 'sent', id: created.id });
    }
  }

  supabase.from('audit_log').insert({
    organization_id: orgId,
    user_id: user.id,
    actor_type: 'user',
    action: 'invitation.bulk_sent',
    entity_type: 'invitation',
    resource_type: 'invitation',
    entity_id: orgId,
    changes: {},
    metadata: { count: invitations.length, succeeded: results.filter(r => r.status === 'sent').length },
  }).then(() => {});

  return NextResponse.json({
    success: true,
    total: invitations.length,
    sent: results.filter(r => r.status === 'sent').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  });
}
