import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(request: NextRequest) {
  const perm = await checkPermission('settings', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const entityType = request.nextUrl.searchParams.get('entity_type');
  if (!entityType) {
    return NextResponse.json({ error: 'entity_type required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('saved_views')
    .select('*')
    .eq('organization_id', perm.organizationId)
    .eq('entity_type', entityType)
    .order('sort_order');

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('settings', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('saved_views')
    .insert({
      organization_id: perm.organizationId,
      creator_id: perm.userId,
      entity_type: body.entity_type,
      display_type: body.display_type ?? 'table',
      name: body.name,
      description: body.description ?? null,
      icon: body.icon ?? null,
      config: body.config ?? {},
      collaboration_type: body.collaboration_type ?? 'collaborative',
      is_default: body.is_default ?? false,
      sort_order: body.sort_order ?? 0,
      section_id: body.section_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create view' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
