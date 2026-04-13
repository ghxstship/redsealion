import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-guard';
import { checkPermission } from '@/lib/rbac/permissions';
import { checkSeatAvailability, incrementSeatUsage } from '@/lib/rbac/seats';
import { writeAuditLog, extractIpAddress, extractUserAgent } from '@/lib/rbac/audit';
import type { InvitationScopeType } from '@/types/rbac';

export async function POST(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const { scope_type, scope_id, request_message } = body as {
    scope_type?: InvitationScopeType;
    scope_id?: string;
    request_message?: string;
  };

  if (!scope_type || !scope_id) {
    return NextResponse.json({ error: 'scope_type and scope_id are required' }, { status: 400 });
  }

  // Get organization_id from scope
  let orgId: string | null = null;
  if (scope_type === 'organization') {
    orgId = scope_id;
  } else if (scope_type === 'team') {
    const { data: team } = await ctx.supabase.from('teams').select('organization_id').eq('id', scope_id).single();
    orgId = team?.organization_id as string;
  } else if (scope_type === 'project') {
    const { data: project } = await ctx.supabase.from('projects').select('organization_id').eq('id', scope_id).single();
    orgId = project?.organization_id as string;
  }

  if (!orgId) {
    return NextResponse.json({ error: 'Scope not found' }, { status: 404 });
  }

  // Check existing membership
  if (scope_type === 'organization') {
    const { data: existing } = await ctx.supabase
      .from('organization_memberships')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('organization_id', scope_id)
      .eq('status', 'active')
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 });
    }
  }

  // Check for duplicate pending request
  const { data: existingRequest } = await ctx.supabase
    .from('join_requests')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('scope_type', scope_type)
    .eq('scope_id', scope_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.json({ error: 'A pending request already exists' }, { status: 409 });
  }

  // Visibility checks for teams/projects
  if (scope_type === 'team') {
    const { data: team } = await ctx.supabase.from('teams').select('visibility').eq('id', scope_id).single();
    if (team?.visibility === 'secret') {
      return NextResponse.json({ error: 'This team is not discoverable' }, { status: 404 });
    }
  }

  if (scope_type === 'project') {
    const { data: project } = await ctx.supabase.from('projects').select('visibility').eq('id', scope_id).single();
    if (project?.visibility === 'private') {
      const { data: orgMem } = await ctx.supabase
        .from('organization_memberships')
        .select('id')
        .eq('user_id', ctx.userId)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .maybeSingle();
      if (!orgMem) {
        return NextResponse.json({ error: 'This project is not visible' }, { status: 404 });
      }
    }
  }

  const { data: joinRequest, error } = await ctx.supabase
    .from('join_requests')
    .insert({
      user_id: ctx.userId,
      organization_id: orgId,
      scope_type,
      scope_id,
      status: 'pending',
      request_message: request_message ?? null,
    })
    .select()
    .single();

  if (error || !joinRequest) {
    return NextResponse.json(
      { error: 'Failed to create join request', details: error?.message },
      { status: 500 },
    );
  }

  writeAuditLog({
    organizationId: orgId,
    actorId: ctx.userId,
    actorType: 'user',
    action: 'join_request.submitted',
    resourceType: 'join_request',
    resourceId: joinRequest.id as string,
    metadata: { scope_type, scope_id },
    ipAddress: extractIpAddress(request),
    userAgent: extractUserAgent(request),
  }).catch(() => {});

  return NextResponse.json({ success: true, join_request: joinRequest }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { ctx, denied } = await requireAuth();
  if (denied) return denied;

  const { data: requests, error } = await ctx.supabase
    .from('join_requests')
    .select()
    .order('requested_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }

  return NextResponse.json({ join_requests: requests ?? [] });
}
