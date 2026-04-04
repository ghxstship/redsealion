import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/harbor-master/feature-flags';
import { checkSeatAvailability, incrementSeatUsage } from '@/lib/harbor-master/seats';
import { writeAuditLog, extractIpAddress, extractUserAgent } from '@/lib/harbor-master/audit';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { code } = body as { code?: string };

  if (!code) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 });
  }

  // Fetch invite code
  const { data: inviteCode } = await supabase
    .from('invite_codes')
    .select()
    .eq('code', code)
    .single();

  if (!inviteCode) {
    return NextResponse.json({ error: 'Invite code not found' }, { status: 404 });
  }

  const orgId = inviteCode.organization_id as string;

  // Feature flag
  const enabled = await isFeatureEnabled('invite_codes', orgId, user.id);
  if (!enabled) {
    return NextResponse.json({ error: 'Invite codes feature is not enabled' }, { status: 403 });
  }

  // Active check
  if (!inviteCode.is_active) {
    return NextResponse.json({ error: 'Invite code has been deactivated' }, { status: 410 });
  }

  // Expiry
  if (inviteCode.expires_at && new Date(inviteCode.expires_at as string) < new Date()) {
    return NextResponse.json({ error: 'Invite code has expired' }, { status: 410 });
  }

  // Depleted
  if (inviteCode.max_uses !== null && (inviteCode.current_uses as number) >= (inviteCode.max_uses as number)) {
    return NextResponse.json({ error: 'Invite code has been fully redeemed' }, { status: 410 });
  }

  // Scope toggle
  const scopeType = inviteCode.scope_type as string;
  if (scopeType === 'organization') {
    const { data: org } = await supabase
      .from('organizations')
      .select('invite_code_enabled')
      .eq('id', orgId)
      .single();
    if (org && !(org.invite_code_enabled as boolean)) {
      return NextResponse.json({ error: 'Invite codes are disabled for this organization' }, { status: 403 });
    }
  }

  // Already redeemed
  const { data: existingRedemption } = await supabase
    .from('invite_code_redemptions')
    .select('id')
    .eq('invite_code_id', inviteCode.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingRedemption) {
    return NextResponse.json({ error: 'You have already redeemed this code' }, { status: 409 });
  }

  // Already member
  const { data: existingMembership } = await supabase
    .from('organization_memberships')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json({ error: 'You are already a member' }, { status: 409 });
  }

  // Domain restriction
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single();
  const userEmail = userData?.email as string;

  if (inviteCode.restrict_to_domain) {
    const emailDomain = userEmail.split('@')[1]?.toLowerCase();
    if (emailDomain !== (inviteCode.restrict_to_domain as string).toLowerCase()) {
      return NextResponse.json({ error: 'Your email domain does not match' }, { status: 403 });
    }
  }

  if (inviteCode.restrict_to_emails && (inviteCode.restrict_to_emails as string[]).length > 0) {
    const normalizedEmail = userEmail.toLowerCase();
    const allowed = (inviteCode.restrict_to_emails as string[]).map(e => e.toLowerCase());
    if (!allowed.includes(normalizedEmail)) {
      return NextResponse.json({ error: 'Your email is not in the allowed list' }, { status: 403 });
    }
  }

  // Seat check
  const seatType = inviteCode.seat_type as 'internal' | 'external';
  const seatCheck = await checkSeatAvailability(orgId, seatType);
  if (!seatCheck.allowed) {
    return NextResponse.json({ error: seatCheck.reason }, { status: 402 });
  }

  // Requires approval?
  if (inviteCode.requires_approval) {
    const { data: joinRequest } = await supabase
      .from('join_requests')
      .insert({
        user_id: user.id,
        organization_id: orgId,
        scope_type: inviteCode.scope_type,
        scope_id: inviteCode.scope_id,
        status: 'pending',
        auto_source: 'invite_code_with_approval',
      })
      .select()
      .single();

    // Record redemption without membership
    await supabase.from('invite_code_redemptions').insert({
      invite_code_id: inviteCode.id,
      user_id: user.id,
      membership_scope: scopeType,
    });

    // Increment uses
    await supabase
      .from('invite_codes')
      .update({ current_uses: (inviteCode.current_uses as number) + 1 })
      .eq('id', inviteCode.id);

    return NextResponse.json({
      success: true,
      status: 'pending_approval',
      join_request: joinRequest,
    });
  }

  // Create membership
  const { data: membership, error: memberError } = await supabase
    .from('organization_memberships')
    .insert({
      user_id: user.id,
      organization_id: orgId,
      role_id: inviteCode.role_id,
      seat_type: seatType,
      status: 'active',
      joined_via: 'invite_code',
    })
    .select()
    .single();

  if (memberError || !membership) {
    return NextResponse.json(
      { error: 'Failed to create membership', details: memberError?.message },
      { status: 500 },
    );
  }

  // Record redemption
  await supabase.from('invite_code_redemptions').insert({
    invite_code_id: inviteCode.id,
    user_id: user.id,
    resulted_in_membership_id: membership.id,
    membership_scope: scopeType,
  });

  // Increment uses
  await supabase
    .from('invite_codes')
    .update({ current_uses: (inviteCode.current_uses as number) + 1 })
    .eq('id', inviteCode.id);

  // Increment seat usage
  await incrementSeatUsage(orgId, seatType);

  // Audit
  writeAuditLog({
    organizationId: orgId,
    actorId: user.id,
    actorType: 'user',
    action: 'invite_code.redeemed',
    resourceType: 'invite_code',
    resourceId: inviteCode.id as string,
    metadata: { code, membership_id: membership.id },
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  }).catch(() => {});

  return NextResponse.json({ success: true, membership });
}
