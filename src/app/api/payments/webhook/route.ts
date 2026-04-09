import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleWebhookEvent } from '@/lib/payments/stripe';
import { notifyPaymentReceived } from '@/lib/notifications/triggers';
import { dispatchWebhookEvent } from '@/lib/webhooks/outbound';
import { createLogger } from '@/lib/logger';

const log = createLogger('payments');

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

  // Handle subscription checkout completion
  if (event.event === 'checkout.session.completed') {
    const data = event.data as Record<string, unknown>;
    const metadata = (data.metadata ?? {}) as Record<string, string>;
    const orgId = metadata.organization_id;
    const tier = metadata.tier;

    if (orgId && tier) {
      const supabase = await createClient();
      await supabase
        .from('organizations')
        .update({
          subscription_tier: tier,
          stripe_customer_id: data.customer as string,
        })
        .eq('id', orgId);
    }
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

        // Fire-and-forget: notify org admin of payment
        notifyPaymentReceived(invoiceId, amountReceived).catch((err) => {
          log.error('Failed to send payment notification', { invoiceId }, err);
        });

        // Dispatch webhook for paid invoices
        if (newStatus === 'paid') {
          const { data: inv } = await supabase.from('invoices').select('organization_id').eq('id', invoiceId).single();
          if (inv) {
            dispatchWebhookEvent(inv.organization_id, 'invoice.paid', { invoice_id: invoiceId, amount: newAmountPaid }).catch(() => {});
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
