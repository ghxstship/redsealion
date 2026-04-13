import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!perm.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { amount, reason, payment_id } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than zero.' }, { status: 400 });
  }

  const supabase = await createClient();

  // Validate invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, amount_paid')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  const { data: refund, error } = await supabase
    .from('invoice_refunds')
    .insert({
      organization_id: perm.organizationId,
      invoice_id: id,
      payment_id: payment_id || null,
      amount,
      reason: reason || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to record refund', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, refund });
}
