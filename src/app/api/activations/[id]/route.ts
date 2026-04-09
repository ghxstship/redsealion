import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('activations', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: activation, error } = await supabase
    .from('activations')
    .select()
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !activation) return NextResponse.json({ error: 'Activation not found' }, { status: 404 });

  return NextResponse.json({ activation });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('activations', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['name', 'description', 'status', 'activation_type', 'start_date', 'end_date', 'budget', 'event_id', 'location_id'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: activation, error } = await supabase
    .from('activations')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !activation) return NextResponse.json({ error: 'Failed to update activation', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, activation });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('activations', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('activations').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete activation', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
