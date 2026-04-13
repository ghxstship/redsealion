import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { data: shipment, error } = await supabase
    .from('shipments')
    .select('*, shipment_line_items(*), events(id, name), clients(id, name), vendors(id, name), purchase_orders(id, po_number), rental_orders(id, order_number)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (error || !shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });

  return NextResponse.json({ shipment });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = [
    'status', 'carrier', 'tracking_number', 'origin_address', 'destination_address',
    'ship_date', 'estimated_arrival', 'actual_arrival', 'weight_lbs', 'num_pieces',
    'shipping_cost_cents', 'notes', 'freight_class', 'nmfc_code', 'declared_value_cents',
    'is_hazardous', 'bol_special_instructions', 'bol_generated_at'
  ];

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: shipment, error } = await supabase
    .from('shipments')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !shipment) return NextResponse.json({ error: 'Failed to update shipment', details: error?.message }, { status: 500 });

  if ('status' in updates) {
    dispatchWebhookEvent(perm.organizationId, 'shipment.status_changed', { shipment_id: id, status: updates.status }).catch(() => {});
    
    // L-1: Audit logging for status changes
    await supabase.from('audit_logs').insert({
      organization_id: perm.organizationId,
      user_id: perm.userId,
      action: 'shipment.status_changed',
      entity_type: 'shipment',
      entity_id: id,
      details: {
        new_status: updates.status,
        updated_fields: Object.keys(updates)
      }
    });
  }

  return NextResponse.json({ success: true, shipment });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const perm = await checkPermission('warehouse', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('shipments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (error) return NextResponse.json({ error: 'Failed to archive shipment', details: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

