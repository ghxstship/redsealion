import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  // Verify requisition belongs to org
  const { data: req } = await supabase
    .from('purchase_requisitions')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('requisition_line_items')
    .select('*, vendors(id, name)')
    .eq('requisition_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to fetch line items', details: error.message }, { status: 500 });

  return NextResponse.json({ line_items: data ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { description, quantity, unit_cost_cents, vendor_id } = body as {
    description?: string;
    quantity?: number;
    unit_cost_cents?: number;
    vendor_id?: string;
  };

  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

  const supabase = await createClient();

  // Verify requisition belongs to org
  const { data: req } = await supabase
    .from('purchase_requisitions')
    .select('id')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

  const { data: lineItem, error } = await supabase
    .from('requisition_line_items')
    .insert({
      requisition_id: id,
      description,
      quantity: quantity ?? 1,
      unit_cost_cents: unit_cost_cents ?? 0,
      vendor_id: vendor_id || null,
    })
    .select()
    .single();

  if (error || !lineItem) return NextResponse.json({ error: 'Failed to create line item', details: error?.message }, { status: 500 });

  // Recalculate requisition total
  const { data: lines } = await supabase
    .from('requisition_line_items')
    .select('quantity, unit_cost_cents')
    .eq('requisition_id', id);

  const newTotal = (lines ?? []).reduce((sum: number, l: { quantity: number; unit_cost_cents: number }) => sum + (l.quantity * l.unit_cost_cents), 0);
  await supabase.from('purchase_requisitions').update({ total_cents: newTotal }).eq('id', id);

  logAuditAction({
    orgId: perm.organizationId,
    action: 'requisition_line_item.created',
    entity: 'requisition_line_item',
    entityId: lineItem.id,
    metadata: { requisition_id: id, description },
  }).catch(() => {});

  return NextResponse.json({ success: true, line_item: lineItem }, { status: 201 });
}
