import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

const VALID_ENTITY_TYPES = ['equipment', 'crew', 'project', 'lead', 'client'] as const;

export async function GET(request: NextRequest) {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const orgId = perm.organizationId;
  const { searchParams } = request.nextUrl;

  let query = supabase
    .from('tags')
    .select('id, entity_type, name, color, created_at')
    .eq('organization_id', orgId)
    .order('name');

  const entityType = searchParams.get('entity_type');
  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data: tags, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tags.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ tags });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { entity_type, name, color } = body as {
    entity_type?: string;
    name?: string;
    color?: string;
  };

  if (!entity_type || !name) {
    return NextResponse.json({ error: 'entity_type and name are required.' }, { status: 400 });
  }

  if (!VALID_ENTITY_TYPES.includes(entity_type as (typeof VALID_ENTITY_TYPES)[number])) {
    return NextResponse.json(
      { error: `Invalid entity_type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  const { data: tag, error } = await supabase
    .from('tags')
    .insert({
      organization_id: orgId,
      entity_type,
      name,
      color: color || '#3B82F6',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to create tag.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, tag });
}

export async function DELETE(request: NextRequest) {
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query parameter is required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Verify tag belongs to this org before deleting
  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Tag not found.' }, { status: 404 });
  }

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete tag.', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
