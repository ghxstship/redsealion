import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

/**
 * GET /api/projects/[id] — Fetch a single project with related data.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, project_memberships(id, user_id, seat_type, status, users(full_name, email, avatar_url))')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ data: project });
}

/**
 * PATCH /api/projects/[id] — Update project fields.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'name', 'slug', 'status', 'visibility', 'description',
    'starts_at', 'ends_at', 'venue_name', 'venue_address',
    'venue_phone', 'site_map_url', 'subtitle', 'presenter',
    'project_code', 'capacity', 'doors_time', 'daily_hours',
    'general_email',
  ];

  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: project, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Failed to update project', details: error?.message }, { status: 500 });
  }

  return NextResponse.json({ data: project });
}

/**
 * DELETE /api/projects/[id] — Soft-delete a project.
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('proposals', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('projects')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: perm.userId,
      status: 'archived',
    })
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete project', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
