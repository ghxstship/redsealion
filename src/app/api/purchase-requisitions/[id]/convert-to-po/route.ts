import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

/**
 * POST /api/purchase-requisitions/[id]/convert-to-po
 * Converts an approved requisition into a purchase order.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('purchase_orders', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { vendor_id, vendor_name, due_date } = body as {
    vendor_id?: string;
    vendor_name?: string;
    due_date?: string;
  };

  const supabase = await createClient();

  // Fetch and validate requisition
  const { data: req } = await supabase
    .from('purchase_requisitions')
    .select('*, requisition_line_items(*)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!req) return NextResponse.json({ error: 'Requisition not found' }, { status: 404 });

  if (req.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved requisitions can be converted to POs' }, { status: 400 });
  }

  // Generate PO number
  const { count } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);

  const poNumber = `PO-${String((count ?? 0) + 1).padStart(4, '0')}`;

  // Determine vendor name — from explicit param, from line items vendors, or fallback
  let resolvedVendorName = vendor_name || 'TBD';
  let resolvedVendorId = vendor_id || null;

  if (!vendor_name && !vendor_id) {
    // Try to use vendor from first line item
    const lineWithVendor = (req.requisition_line_items ?? []).find(
      (l: Record<string, unknown>) => l.vendor_id,
    );
    if (lineWithVendor) {
      resolvedVendorId = lineWithVendor.vendor_id as string;
      const { data: v } = await supabase.from('vendors').select('name').eq('id', resolvedVendorId!).single();
      resolvedVendorName = v?.name ?? resolvedVendorName;
    }
  }

  // Convert cents to dollars for PO
  const totalAmount = (req.total_cents ?? 0) / 100;

  // Create PO
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: perm.organizationId,
      po_number: poNumber,
      vendor_name: resolvedVendorName,
      vendor_id: resolvedVendorId,
      description: `Converted from requisition ${req.requisition_number}`,
      total_amount: totalAmount,
      status: 'draft',
      proposal_id: null,
      issued_date: null,
      due_date: due_date || null,
      created_by: perm.userId,
    })
    .select()
    .single();

  if (poError || !po) {
    return NextResponse.json({ error: 'Failed to create purchase order', details: poError?.message }, { status: 500 });
  }

  // Create PO line items from requisition line items
  const lineItems = (req.requisition_line_items ?? []).map((line: Record<string, unknown>) => ({
    po_id: po.id,
    description: line.description as string,
    quantity: line.quantity as number,
    unit_price: ((line.unit_cost_cents as number) ?? 0) / 100,
    amount: ((line.quantity as number) ?? 1) * (((line.unit_cost_cents as number) ?? 0) / 100),
    received_quantity: 0,
  }));

  if (lineItems.length > 0) {
    await supabase.from('purchase_order_line_items').insert(lineItems);
  }

  // Update requisition line items to reference the new PO
  const lineIds = (req.requisition_line_items ?? []).map((l: Record<string, unknown>) => l.id as string);
  if (lineIds.length > 0) {
    await supabase
      .from('requisition_line_items')
      .update({ purchase_order_id: po.id, status: 'ordered' })
      .in('id', lineIds);
  }

  // Update requisition status to ordered
  await supabase
    .from('purchase_requisitions')
    .update({ status: 'ordered' })
    .eq('id', id);

  logAuditAction({
    orgId: perm.organizationId,
    action: 'requisition.converted_to_po',
    entity: 'purchase_requisition',
    entityId: id,
    metadata: { po_id: po.id, po_number: poNumber, requisition_number: req.requisition_number },
  }).catch(() => {});

  return NextResponse.json({
    success: true,
    purchase_order: po,
    requisition_status: 'ordered',
  }, { status: 201 });
}
