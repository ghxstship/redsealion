import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('expenses', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: expense, error } = await supabase
    .from('expenses')
    .select()
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !expense) return NextResponse.json({ error: 'Expense not found' }, { status: 404 });

  return NextResponse.json({ expense });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('expenses', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['category', 'amount', 'description', 'expense_date', 'status', 'receipt_url', 'proposal_id'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: expense, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !expense) return NextResponse.json({ error: 'Failed to update expense', details: error?.message }, { status: 500 });

  return NextResponse.json({ success: true, expense });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('expenses', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('organization_id', perm.organizationId);
  if (error) return NextResponse.json({ error: 'Failed to delete expense', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
