import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

/**
 * GET /api/projects — List all projects for the current organization.
 * Supports: ?limit=N, ?offset=N, ?status=active, ?q=search
 */
export async function GET(request: NextRequest) {
  const perm = await checkPermission('proposals', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const status = searchParams.get('status');
  const q = searchParams.get('q');

  const supabase = await createClient();

  let query = supabase
    .from('projects')
    .select('id, name, slug, status, visibility, starts_at, ends_at, created_at, updated_at', { count: 'exact' })
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}

/**
 * POST /api/projects — Create a new project.
 */
export async function POST(request: NextRequest) {
  const perm = await checkPermission('proposals', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { name, slug, status, visibility, description, starts_at, ends_at, project_code } = body as {
    name?: string;
    slug?: string;
    status?: string;
    visibility?: string;
    description?: string;
    starts_at?: string;
    ends_at?: string;
    project_code?: string;
  };

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // Auto-generate slug if not provided
  const projectSlug = slug ?? name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      organization_id: perm.organizationId,
      name,
      slug: projectSlug,
      status: status ?? 'active',
      visibility: visibility ?? 'private',
      description: description ?? null,
      starts_at: starts_at ?? null,
      ends_at: ends_at ?? null,
      project_code: project_code ?? null,
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A project with this slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create project', details: error.message }, { status: 500 });
  }

  // Auto-add creator as project_admin membership
  await supabase.from('project_memberships').insert({
    project_id: project.id,
    user_id: perm.userId,
    organization_id: perm.organizationId,
    seat_type: 'project_admin',
    status: 'active',
  }).select().single();

  return NextResponse.json({ data: project }, { status: 201 });
}
