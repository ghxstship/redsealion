import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkHarborPermission } from '@/lib/harbor-master/permissions';
import { isFeatureEnabled } from '@/lib/harbor-master/feature-flags';
import { writeAuditLog, extractIpAddress, extractUserAgent } from '@/lib/harbor-master/audit';
import type { InvitationScopeType, SeatType } from '@/types/harbor-master';

function generateCode(orgSlug: string, scopeType: string): string {
  const scopeAbbrev = scopeType === 'organization' ? 'ORG' : scopeType === 'team' ? 'TM' : 'PRJ';
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${orgSlug.toUpperCase().slice(0, 8)}-${scopeAbbrev}${year}-${random}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    scope_type,
    scope_id,
    role_id,
    seat_type = 'internal',
    label,
    max_uses,
    requires_approval = false,
    restrict_to_domain,
    restrict_to_emails = [],
    expires_at,
    count = 1,
  } = body as {
    scope_type?: InvitationScopeType;
    scope_id?: string;
    role_id?: string;
    seat_type?: SeatType;
    label?: string;
    max_uses?: number;
    requires_approval?: boolean;
    restrict_to_domain?: string;
    restrict_to_emails?: string[];
    expires_at?: string;
    count?: number;
  };

  if (!scope_type || !scope_id || !role_id) {
    return NextResponse.json(
      { error: 'scope_type, scope_id, and role_id are required' },
      { status: 400 },
    );
  }

  // Permission check
  const perm = await checkHarborPermission('manage', 'invite_code', 'organization', scope_id);
  if (!perm || !perm.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const orgId = perm.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
  }

  // Feature flag check
  const inviteCodesEnabled = await isFeatureEnabled('invite_codes', orgId, user.id);
  if (!inviteCodesEnabled) {
    return NextResponse.json({ error: 'Invite codes feature is not enabled for your plan' }, { status: 403 });
  }

  if (count > 1) {
    const bulkEnabled = await isFeatureEnabled('bulk_invitations', orgId, user.id);
    if (!bulkEnabled) {
      return NextResponse.json({ error: 'Bulk invitations feature is not enabled for your plan' }, { status: 403 });
    }
  }

  // Get org slug for code generation
  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', orgId)
    .single();

  const orgSlug = (org?.slug as string) ?? 'ORG';

  // Generate codes
  const codes = [];
  for (let i = 0; i < Math.min(count, 100); i++) {
    const code = generateCode(orgSlug, scope_type);
    codes.push({
      code,
      organization_id: orgId,
      scope_type,
      scope_id,
      role_id,
      seat_type,
      created_by: user.id,
      label: label ?? null,
      max_uses: max_uses ?? null,
      requires_approval,
      restrict_to_domain: restrict_to_domain ?? null,
      restrict_to_emails: restrict_to_emails ?? [],
      expires_at: expires_at ?? null,
    });
  }

  const { data: inserted, error } = await supabase
    .from('invite_codes')
    .insert(codes)
    .select();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create invite codes', details: error.message },
      { status: 500 },
    );
  }

  // Audit
  const auditAction = count > 1 ? 'invite_code.bulk_created' : 'invite_code.created';
  writeAuditLog({
    organizationId: orgId,
    actorId: user.id,
    actorType: 'user',
    action: auditAction,
    resourceType: 'invite_code',
    resourceId: inserted?.[0]?.id as string ?? '',
    metadata: { count, scope_type, scope_id, role_id },
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  }).catch(() => {});

  return NextResponse.json({ success: true, codes: inserted }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: codes, error } = await supabase
    .from('invite_codes')
    .select()
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch invite codes' }, { status: 500 });
  }

  return NextResponse.json({ codes: codes ?? [] });
}
