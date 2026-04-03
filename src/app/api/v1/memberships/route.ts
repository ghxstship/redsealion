import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkHarborPermission, enforceHierarchyCeiling, isSoleOwner } from '@/lib/harbor-master/permissions';
import { checkSeatAvailability, incrementSeatUsage, decrementSeatUsage } from '@/lib/harbor-master/seats';
import { writeAuditLog, extractIpAddress, extractUserAgent } from '@/lib/harbor-master/audit';
import type { SeatType } from '@/types/harbor-master';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    user_id: targetUserId,
    organization_id,
    role_id,
    seat_type = 'internal',
  } = body as {
    user_id?: string;
    organization_id?: string;
    role_id?: string;
    seat_type?: SeatType;
  };

  if (!targetUserId || !organization_id || !role_id) {
    return NextResponse.json(
      { error: 'user_id, organization_id, and role_id are required' },
      { status: 400 },
    );
  }

  // Permission check
  const perm = await checkHarborPermission('manage', 'member', 'organization', organization_id);
  if (!perm || !perm.allowed) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Hierarchy ceiling
  const { data: targetRole } = await supabase
    .from('roles')
    .select('hierarchy_level')
    .eq('id', role_id)
    .single();

  if (perm.hierarchyLevel !== null && targetRole) {
    if (!enforceHierarchyCeiling(perm.hierarchyLevel, targetRole.hierarchy_level as number)) {
      return NextResponse.json({ error: 'Cannot assign a role above your own' }, { status: 403 });
    }
  }

  // Existing membership check
  const { data: existing } = await supabase
    .from('organization_memberships')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('organization_id', organization_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
  }

  // Seat check
  const seatCheck = await checkSeatAvailability(organization_id, seat_type);
  if (!seatCheck.allowed) {
    return NextResponse.json({ error: seatCheck.reason }, { status: 402 });
  }

  const { data: membership, error } = await supabase
    .from('organization_memberships')
    .insert({
      user_id: targetUserId,
      organization_id,
      role_id,
      seat_type,
      status: 'active',
      joined_via: 'manual_add',
      invited_by: user.id,
    })
    .select()
    .single();

  if (error || !membership) {
    return NextResponse.json(
      { error: 'Failed to create membership', details: error?.message },
      { status: 500 },
    );
  }

  await incrementSeatUsage(organization_id, seat_type);

  writeAuditLog({
    organizationId: organization_id,
    actorId: user.id,
    actorType: 'user',
    action: 'member.added',
    resourceType: 'organization_membership',
    resourceId: membership.id as string,
    metadata: { target_user_id: targetUserId, role_id, seat_type },
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  }).catch(() => {});

  return NextResponse.json({ success: true, membership }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const scopeType = url.searchParams.get('scope_type') ?? 'organization';
  const scopeId = url.searchParams.get('scope_id');

  if (!scopeId) {
    return NextResponse.json({ error: 'scope_id is required' }, { status: 400 });
  }

  let table = 'organization_memberships';
  let scopeColumn = 'organization_id';
  if (scopeType === 'team') {
    table = 'team_memberships';
    scopeColumn = 'team_id';
  } else if (scopeType === 'project') {
    table = 'project_memberships';
    scopeColumn = 'project_id';
  }

  const { data: memberships, error } = await supabase
    .from(table)
    .select('*, user:users!inner(id, email, display_name, avatar_url)')
    .eq(scopeColumn, scopeId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
  }

  return NextResponse.json({ memberships: memberships ?? [] });
}
