import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { requireAdmin } from '@/lib/api/auth-guard';
import { SYSTEM_ROLE_IDS } from '@/types/harbor-master';
import type { OrganizationRole } from '@/types/database';

/**
 * Team invitation — delegates to Harbor Master invitations table.
 * Maps legacy role names to Harbor Master role IDs.
 */

const ROLE_MAP: Record<string, string> = {
  owner: SYSTEM_ROLE_IDS.ADMIN,
  admin: SYSTEM_ROLE_IDS.ADMIN,
  controller: SYSTEM_ROLE_IDS.ADMIN,
  manager: SYSTEM_ROLE_IDS.MANAGER,
  team_member: SYSTEM_ROLE_IDS.MEMBER,
  client: SYSTEM_ROLE_IDS.GUEST,
  contractor: SYSTEM_ROLE_IDS.GUEST,
  crew: SYSTEM_ROLE_IDS.GUEST,
  viewer: SYSTEM_ROLE_IDS.GUEST,
};

const VALID_ROLES: OrganizationRole[] = [
  'owner',
  'admin',
  'controller',
  'manager',
  'team_member',
  'client',
  'contractor',
  'crew',
  'viewer',
];

export async function POST(request: NextRequest) {
  const authMsg = await requireAdmin();
  if (authMsg.denied) return authMsg.denied;
  const perm = { organizationId: authMsg.ctx.organizationId, userId: authMsg.ctx.userId };

  const body = await request.json();
  const { email, role, personal_message } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  if (!role || !VALID_ROLES.includes(role as OrganizationRole)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;
  const normalizedEmail = email.trim().toLowerCase();

  // Check for existing pending invitation
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('invited_email', normalizedEmail)
    .eq('scope_type', 'organization')
    .eq('scope_id', orgId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'An invitation is already pending for this email' }, { status: 409 });
  }

  // Check if already a member
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existingUser) {
    return NextResponse.json({ error: 'This user is already a member of your organization' }, { status: 409 });
  }

  // Map legacy role to Harbor Master role_id
  const roleId = ROLE_MAP[role] ?? SYSTEM_ROLE_IDS.MEMBER;

  // Generate token and create invitation
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error: insertError } = await supabase
    .from('invitations')
    .insert({
      organization_id: orgId,
      scope_type: 'organization',
      scope_id: orgId,
      invited_email: normalizedEmail,
      role_id: roleId,
      seat_type: ['client', 'contractor', 'crew', 'viewer'].includes(role) ? 'external' : 'internal',
      invited_by: perm.userId,
      status: 'pending',
      token,
      personal_message: personal_message ?? null,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError || !invitation) {
    return NextResponse.json(
      { error: 'Failed to create invitation', details: insertError?.message },
      { status: 500 },
    );
  }

  // Audit log
  supabase.from('audit_log').insert({
    organization_id: orgId,
    user_id: perm.userId,
    actor_type: 'user',
    action: 'invitation.sent',
    entity_type: 'invitation',
    resource_type: 'invitation',
    entity_id: invitation.id,
    changes: {},
    metadata: { invited_email: normalizedEmail, role, role_id: roleId },
  }).then(() => {});

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: normalizedEmail,
      role,
      organization_id: orgId,
      invited_by: perm.userId,
      status: 'pending',
      expires_at: expiresAt,
    },
  }, { status: 201 });
}
