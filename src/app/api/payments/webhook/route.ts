import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleWebhookEvent } from '@/lib/payments/stripe';

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';

  const event = await handleWebhookEvent(payload, signature);

  if (!event) {
    return NextResponse.json(
      { error: 'Invalid signature or webhook secret not configured.' },
      { status: 400 },
    );
  }

  if (event.event === 'payment_intent.succeeded') {
    const data = event.data as Record<string, unknown>;
    const metadata = (data.metadata ?? {}) as Record<string, string>;
    const invoiceId = metadata.invoice_id;
    const amountReceived = typeof data.amount_received === 'number'
      ? data.amount_received / 100
      : 0;

    if (invoiceId) {
      const supabase = await createClient();

      // Find the invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, total, amount_paid')
        .eq('id', invoiceId)
        .single();

      if (invoice) {
        const newAmountPaid = (invoice.amount_paid as number) + amountReceived;
        const total = invoice.total as number;
        const newStatus = newAmountPaid >= total ? 'paid' : 'partially_paid';

        await supabase
          .from('invoices')
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
          })
          .eq('id', invoiceId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
