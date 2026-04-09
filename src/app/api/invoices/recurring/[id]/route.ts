import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recurring_invoice_schedules')
    .select('*, clients(company_name)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  return NextResponse.json({ schedule: data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'frequency', 'next_issue_date', 'end_date', 'is_active',
    'template_data', 'base_amount', 'description',
  ];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data, error } = await supabase
    .from('recurring_invoice_schedules')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: 'Failed to update schedule', details: error?.message }, { status: 500 });
  return NextResponse.json({ success: true, schedule: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('invoices', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('recurring_invoice_schedules')
    .delete()
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to delete schedule', details: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
