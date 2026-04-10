import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { checkAutomationTriggers } from '@/lib/automations/trigger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), invoice_payments(*), clients(company_name, billing_address)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  return NextResponse.json({ invoice });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = await createClient();

  const allowedFields = ['status', 'due_date', 'memo', 'type'];
  const updates: Record<string, unknown> = {};
  for (const f of allowedFields) {
    if (f in body) updates[f] = body[f];
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .select()
    .single();

  if (error || !invoice) return NextResponse.json({ error: 'Failed to update invoice', details: error?.message }, { status: 500 });

  // Fire automation triggers on status change
  if ('status' in updates && invoice) {
    const statusEventMap: Record<string, string> = {
      paid: 'invoice_paid',
      sent: 'invoice_sent',
      overdue: 'invoice_overdue',
    };
    const eventType = statusEventMap[updates.status as string];
    if (eventType) {
      checkAutomationTriggers(eventType as 'invoice_paid' | 'invoice_sent' | 'invoice_overdue', {
        org_id: perm.organizationId,
        invoice_id: id,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        status: updates.status as string,
        entity_type: 'invoice',
        entity_id: id,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, invoice });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('invoices', 'delete');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const supabase = await createClient();

  // Only draft invoices can be hard-deleted; sent/paid must be voided
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (invoice.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft invoices can be deleted. Use the void endpoint for sent invoices.' },
      { status: 409 },
    );
  }

  const { error: deleteError } = await supabase
    .from('invoices')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', perm.organizationId);

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete invoice', details: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
