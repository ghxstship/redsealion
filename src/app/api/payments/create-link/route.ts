import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { createPaymentLink } from '@/lib/payments/stripe';

export async function POST(request: Request) {
  const perm = await checkPermission('invoices', 'edit');
  if (!perm) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!perm.allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { invoice_id } = body as { invoice_id?: string };

  if (!invoice_id) {
    return NextResponse.json(
      { error: 'invoice_id is required.' },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const orgId = perm.organizationId;

  // Fetch the invoice
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoice_id)
    .eq('organization_id', orgId)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  const amountDue = (invoice.total as number) - (invoice.amount_paid as number);
  if (amountDue <= 0) {
    return NextResponse.json(
      { error: 'Invoice is already fully paid.' },
      { status: 400 },
    );
  }

  const result = await createPaymentLink({
    invoiceId: invoice_id,
    amount: amountDue,
    currency: (invoice.currency as string) || 'USD',
    description: `Invoice ${invoice.invoice_number}`,
  });

  if (!result) {
    return NextResponse.json(
      { error: 'Failed to create payment link. Stripe may not be configured.' },
      { status: 500 },
    );
  }

  // Store the payment link
  const { data: link, error: insertError } = await supabase
    .from('payment_links')
    .insert({
      organization_id: orgId,
      invoice_id,
      url: result.url,
      external_id: result.externalId,
      amount: amountDue,
      currency: (invoice.currency as string) || 'USD',
      created_by: perm.userId,
    })
    .select()
    .single();

  if (insertError || !link) {
    return NextResponse.json(
      { error: 'Payment link created but failed to store.', details: insertError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, payment_link: link });
}
