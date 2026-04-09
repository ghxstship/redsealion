import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: transfer, error } = await supabase
    .from('warehouse_transfers')
    .select('*')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });

  return NextResponse.json({ transfer });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['status', 'notes', 'received_by', 'received_at'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  // Auto-set received_at on receive
  if (body.status === 'received' && !updates.received_at) {
    updates.received_at = new Date().toISOString();
    updates.received_by = perm.userId;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: transfer, error } = await supabase
    .from('warehouse_transfers')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !transfer) return NextResponse.json({ error: 'Failed to update transfer', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, transfer });
}
