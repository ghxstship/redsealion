import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('expenses', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: expense, error: fetchErr } = await supabase
    .from('expenses')
    .select('id, status, organization_id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchErr || !expense) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  if (expense.status !== 'approved') {
    return NextResponse.json({ error: `Cannot reimburse expense with status '${expense.status}'` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      status: 'reimbursed',
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to mark expense reimbursed', details: error?.message }, { status: 500 });
  }

  logAuditAction({
    orgId: perm.organizationId,
    action: 'expense.reimbursed',
    entity: 'expense',
    entityId: id,
    metadata: {},
  }).catch(() => {});

  return NextResponse.json({ success: true, expense: data });
}
