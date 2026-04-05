import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const perm = await checkPermission('settings', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const body = await request.json();

  // Only update provided fields
  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.config !== undefined) updates.config = body.config;
  if (body.display_type !== undefined) updates.display_type = body.display_type;
  if (body.collaboration_type !== undefined) updates.collaboration_type = body.collaboration_type;
  if (body.is_default !== undefined) updates.is_default = body.is_default;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
  if (body.section_id !== undefined) updates.section_id = body.section_id;

  const { data, error } = await supabase
    .from('saved_views')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update view' }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const perm = await checkPermission('settings', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();

  const { error } = await supabase
    .from('saved_views')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete view' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
