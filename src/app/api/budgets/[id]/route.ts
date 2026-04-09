import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('budgets', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_budgets')
    .select('*, proposals(name), budget_line_items(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
  return NextResponse.json({ budget: data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('budgets', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['total_budget', 'alert_threshold_percent', 'currency'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data, error } = await supabase
    .from('project_budgets')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to update budget', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, budget: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('budgets', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('project_budgets')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete budget', details: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
