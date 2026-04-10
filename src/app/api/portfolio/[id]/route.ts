import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('proposals', 'edit'); // 'proposals' feature toggles portfolio right now
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Ensure there are actually fields to update
  delete body.id;
  delete body.organization_id;
  delete body.created_at;

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_library')
    .update(body)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Item not found' }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('proposals', 'edit'); 
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  
  const supabase = await createClient();
  const { error } = await supabase
    .from('portfolio_library')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
