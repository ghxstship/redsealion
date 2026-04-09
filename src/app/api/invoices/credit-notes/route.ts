import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function GET() {
  const perm = await checkPermission('invoices', 'view');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('credit_notes')
    .select('*, invoices(invoice_number, clients(company_name))')
    .eq('organization_id', perm.organizationId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const perm = await checkPermission('invoices', 'create');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { invoice_id, amount, reason } = body as { invoice_id?: string; amount?: number; reason?: string };

  if (!invoice_id || !amount) {
    return NextResponse.json({ error: 'invoice_id and amount are required' }, { status: 400 });
  }

  if (amount <= 0) {
    return NextResponse.json({ error: 'amount must be greater than 0' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the invoice to validate the credit doesn't exceed remaining balance
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, total, amount_paid, status')
    .eq('id', invoice_id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (invErr || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const balanceDue = (invoice.total as number) - (invoice.amount_paid as number);
  if (amount > balanceDue) {
    return NextResponse.json({ error: `Credit amount ($${amount}) exceeds remaining balance due ($${balanceDue})` }, { status: 400 });
  }

  // Generate credit note number
  const { count } = await supabase
    .from('credit_notes')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', perm.organizationId);
  const creditNumber = `CN-${String((count ?? 0) + 1).padStart(4, '0')}`;

  // Insert the credit note
  const { data, error } = await supabase
    .from('credit_notes')
    .insert({
      organization_id: perm.organizationId,
      invoice_id,
      credit_number: creditNumber,
      amount,
      reason: reason || null,
      issued_date: new Date().toISOString().slice(0, 10),
      status: 'applied',
      created_by: perm.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Apply the credit to the invoice by increasing amount_paid
  const newAmountPaid = (invoice.amount_paid as number) + amount;
  const invoiceTotal = invoice.total as number;
  const newStatus = newAmountPaid >= invoiceTotal ? 'paid' : 'partially_paid';

  const updatePayload: Record<string, unknown> = {
    amount_paid: newAmountPaid,
    status: newStatus,
  };
  if (newStatus === 'paid') {
    updatePayload.paid_date = new Date().toISOString().split('T')[0];
  }

  await supabase
    .from('invoices')
    .update(updatePayload)
    .eq('id', invoice_id);

  logAuditAction({
    orgId: perm.organizationId,
    action: 'credit_note.created',
    entity: 'credit_note',
    entityId: data.id,
    metadata: { invoice_id, amount, credit_number: data.credit_number },
  }).catch(() => {});

  return NextResponse.json({ data }, { status: 201 });
}
