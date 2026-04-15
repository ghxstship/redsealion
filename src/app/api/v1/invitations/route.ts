import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { checkPermission, enforceHierarchyCeiling } from '@/lib/rbac/permissions';
import { checkSeatAvailability } from '@/lib/rbac/seats';
import { writeAuditLog, extractIpAddress, extractUserAgent } from '@/lib/rbac/audit';
import type { InvitationScopeType, SeatType } from '@/types/rbac';
import type { PlatformRole } from '@/lib/permissions';
import { getInvitationEmailConfig, renderInvitationEmail } from '@/lib/email/invitation-templates';
import { sendEmail } from '@/lib/email/send';

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const {
    scope_type,
    scope_id,
    invited_email,
    role_id,
    seat_type = 'internal',
    personal_message,
  } = body as {
    scope_type?: InvitationScopeType;
    scope_id?: string;
    invited_email?: string;
    role_id?: string;
    seat_type?: SeatType;
    personal_message?: string;
  };

  if (!scope_type || !scope_id || !invited_email || !role_id) {
    return NextResponse.json(
      { error: 'scope_type, scope_id, invited_email, and role_id are required' },
      { status: 400 },
    );
  }

  // Permission check
  const perm = await checkPermission('invite', 'member', scope_type, scope_id);
  if (!perm || !perm.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Get inviter's hierarchy level
  const { data: inviterRole } = await ctx.supabase
    .from('roles')
    .select('hierarchy_level')
    .eq('id', perm.roleId)
    .single();

  // Get target role hierarchy level
  const { data: targetRole } = await ctx.supabase
    .from('roles')
    .select('hierarchy_level')
    .eq('id', role_id)
    .single();

  if (!inviterRole || !targetRole) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  }

  // Hierarchy ceiling
  if (!enforceHierarchyCeiling(inviterRole.hierarchy_level as number, targetRole.hierarchy_level as number)) {
    return NextResponse.json(
      { error: 'Cannot invite to a role above your own hierarchy level' },
      { status: 403 },
    );
  }

  // Check for existing membership
  const orgId = perm.organizationId;
  if (!orgId) {
    return NextResponse.json({ error: 'Organization context required' }, { status: 400 });
  }

  const { data: existingMember } = await ctx.supabase
    .from('organization_memberships')
    .select('id, status')
    .eq('organization_id', orgId)
    .eq('user_id', (
      await ctx.supabase.from('users').select('id').eq('email', invited_email).single()
    ).data?.id ?? '00000000-0000-0000-0000-000000000000')
    .maybeSingle();

  // Check for existing pending invitation
  const { data: existingInvite } = await ctx.supabase
    .from('invitations')
    .select('id, status')
    .eq('invited_email', invited_email)
    .eq('scope_type', scope_type)
    .eq('scope_id', scope_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingMember && existingMember.status === 'active') {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
  }

  if (existingInvite) {
    return NextResponse.json({ error: 'A pending invitation already exists' }, { status: 409 });
  }

  // Seat limit check
  const seatCheck = await checkSeatAvailability(orgId, seat_type);
  if (!seatCheck.allowed) {
    return NextResponse.json({ error: seatCheck.reason }, { status: 402 });
  }

  // Generate token and create invitation
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');

  // Get org invite expiry config
  const { data: org } = await ctx.supabase
    .from('organizations')
    .select('invite_expiry_hours')
    .eq('id', orgId)
    .single();

  const expiryHours = (org?.invite_expiry_hours as number) ?? 168;
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();

  const { data: invitation, error: insertError } = await ctx.supabase
    .from('invitations')
    .insert({
      organization_id: orgId,
      scope_type,
      scope_id,
      invited_email,
      role_id,
      seat_type,
      invited_by: ctx.userId,
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

  // Audit log (fire-and-forget)
  writeAuditLog({
    organizationId: orgId,
    actorId: ctx.userId,
    actorType: 'user',
    action: 'invitation.sent',
    resourceType: 'invitation',
    resourceId: invitation.id as string,
    metadata: { invited_email, scope_type, scope_id, role_id, seat_type },
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  }).catch(() => {});

  // ── Send personalized invitation email ──
  // Resolve role name from role_id
  const { data: roleRow } = await ctx.supabase
    .from('roles')
    .select('name')
    .eq('id', role_id)
    .single();

  const roleName = (roleRow?.name ?? 'collaborator') as PlatformRole;

  // Resolve org details + inviter name
  const { data: orgDetails } = await ctx.supabase
    .from('organizations')
    .select('name, logo_url')
    .eq('id', orgId)
    .single();

  const { data: inviterUser } = await ctx.supabase
    .from('users')
    .select('full_name')
    .eq('id', ctx.userId)
    .single();

  const orgName = orgDetails?.name ?? 'Our Organization';
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.redsealion.com'}/invite/${token}`;
  const emailConfig = getInvitationEmailConfig(roleName, orgName, inviterUser?.full_name ?? undefined);
  const htmlBody = renderInvitationEmail(emailConfig, acceptUrl, orgName, orgDetails?.logo_url);

  sendEmail({
    to: invited_email,
    subject: emailConfig.subject,
    html: htmlBody,
    tags: [
      { name: 'type', value: 'invitation' },
      { name: 'role', value: roleName },
      { name: 'source', value: 'v1_api' },
    ],
  }).catch((err) => {
    import('@/lib/logger').then(({ createLogger: cl }) => cl('invitations').error('Email send failed', {}, err));
  });

  return NextResponse.json({ success: true, invitation, email_sent: true }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const url = new URL(request.url);
  const filter = url.searchParams.get('filter'); // 'sent' | 'received' | 'all'

  let query = ctx.supabase.from('invitations').select();

  if (filter === 'sent') {
    query = query.eq('invited_by', ctx.userId);
  } else if (filter === 'received') {
    const { data: userData } = await ctx.supabase
      .from('users')
      .select('email')
      .eq('id', ctx.userId)
      .single();
    if (userData) {
      query = query.eq('invited_email', userData.email as string);
    }
  }

  query = query.order('created_at', { ascending: false }).limit(100);

  const { data: invitations, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }

  return NextResponse.json({ invitations: invitations ?? [] });
}
