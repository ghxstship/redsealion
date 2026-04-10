import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (typeof body.packed !== 'boolean') {
    return NextResponse.json({ error: 'packed boolean is required' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('packing_list_items')
    .update({ packed: body.packed })
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }

  return NextResponse.json({ success: true, item: data });
}
