import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { amount, method, reference, notes, received_date, payment_date } = body as {
    amount?: number;
    method?: string;
    reference?: string;
    notes?: string;
    received_date?: string;
    payment_date?: string;
  };

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'amount must be greater than 0.' },
      { status: 400 },
    );
  }

  if (!method) {
    return NextResponse.json(
      { error: 'method is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Fetch the invoice to validate balance
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select()
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json(
      { error: 'Invoice not found.' },
      { status: 404 },
    );
  }

  const balanceDue = (invoice.total as number) - (invoice.amount_paid as number);

  if (amount > balanceDue) {
    return NextResponse.json(
      { error: `Amount exceeds balance due of ${balanceDue}.` },
      { status: 400 },
    );
  }

  // Insert the payment
  const { error: paymentError } = await supabase
    .from('invoice_payments')
    .insert({
      invoice_id: id,
      organization_id: perm.organizationId,
      amount,
      payment_method: method || 'other',
      reference: reference || null,
      notes: notes || null,
      payment_date: payment_date || received_date || new Date().toISOString().split('T')[0],
      recorded_by: perm.userId,
    });

  if (paymentError) {
    return NextResponse.json(
      { error: 'Failed to record payment.', details: paymentError.message },
      { status: 500 },
    );
  }

  // Update the invoice totals and status
  const newAmountPaid = (invoice.amount_paid as number) + amount;
  const invoiceTotal = invoice.total as number;

  let newStatus: string = invoice.status as string;
  if (newAmountPaid >= invoiceTotal) {
    newStatus = 'paid';
  } else if (newAmountPaid > 0) {
    newStatus = 'partially_paid';
  }

  const updatePayload: Record<string, unknown> = {
    amount_paid: newAmountPaid,
    status: newStatus,
  };

  if (newStatus === 'paid') {
    updatePayload.paid_date = new Date().toISOString().split('T')[0];
  }

  const { data: updatedInvoice, error: updateError } = await supabase
    .from('invoices')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: 'Payment recorded but invoice update failed.', details: updateError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, invoice: updatedInvoice });
}
