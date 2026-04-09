import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/**
 * GET /api/projects/[id]/members — List members of a project.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_memberships')
    .select('id, user_id, seat_type, status, created_at, users(full_name, email, avatar_url)')
    .eq('project_id', id)
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch members', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/**
 * POST /api/projects/[id]/members — Add a member to a project.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { user_id, seat_type } = body as { user_id?: string; seat_type?: string };

  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
  }

  const validSeatTypes = ['project_admin', 'project_manager', 'project_member', 'project_viewer', 'project_guest'];
  const seatType = seat_type && validSeatTypes.includes(seat_type) ? seat_type : 'project_member';

  const supabase = await createClient();

  // Verify user is in the same org
  const { data: targetUser } = await supabase
    .from('organization_memberships')
    .select('user_id')
    .eq('user_id', user_id)
    .eq('organization_id', perm.organizationId)
    .eq('status', 'active')
    .single();

  if (!targetUser) {
    return NextResponse.json({ error: 'User not found in this organization' }, { status: 404 });
  }

  const { data: membership, error } = await supabase
    .from('project_memberships')
    .insert({
      project_id: id,
      user_id,
      organization_id: perm.organizationId,
      seat_type: seatType,
      status: 'active',
    })
    .select('id, user_id, seat_type, status, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add member', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: membership }, { status: 201 });
}

/**
 * DELETE /api/projects/[id]/members — Remove a member from a project.
 * Query param: ?user_id=UUID
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const userId = request.nextUrl.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'user_id query param is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('project_memberships')
    .delete()
    .eq('project_id', id)
    .eq('user_id', userId)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove member', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
