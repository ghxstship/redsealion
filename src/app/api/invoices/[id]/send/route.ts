import { NextResponse } from 'next/server';
import { checkPermission } from '@/lib/api/permission-guard';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { notifyInvoiceSent } from '@/lib/notifications/triggers';
import { createPaymentLink } from '@/lib/payments/stripe';
import { logAuditAction } from '@/lib/api/audit-logger';

export async function POST(
  _request: Request,
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
  const supabase = await createClient();

  // Fetch the invoice with client info
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*, clients(company_name, billing_address)')
    .eq('id', id)
    .eq('organization_id', perm.organizationId)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json(
      { error: 'Invoice not found.' },
      { status: 404 },
    );
  }

  if (invoice.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft invoices can be sent.' },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  // Update status to sent
  const { data: updatedInvoice, error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'sent', sent_at: now })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update invoice status.', details: updateError.message },
      { status: 500 },
    );
  }

  // Auto-create payment link if org has Stripe configured
  let paymentUrl: string | null = null;
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_connect_account_id')
      .eq('id', perm.organizationId)
      .single();

    const stripeAccountId = org?.stripe_connect_account_id as string | null;
    const balanceDue = (invoice.total as number) - (invoice.amount_paid as number);

    if (balanceDue > 0) {
      const link = await createPaymentLink({
        invoiceId: id,
        amount: balanceDue,
        currency: (invoice.currency as string) || 'USD',
        description: `Invoice ${invoice.invoice_number}`,
        stripeAccountId: stripeAccountId ?? undefined,
      });

      if (link) {
        paymentUrl = link.url;
        // Store payment link on the invoice
        await supabase
          .from('invoices')
          .update({ payment_url: link.url, stripe_payment_link_id: link.externalId })
          .eq('id', id);
      }
    }
  } catch {
    // Payment link creation is non-blocking; invoice still gets sent
  }

  // Look up a billing contact email for the client
  const { data: contacts } = await supabase
    .from('client_contacts')
    .select('email, first_name, last_name, role')
    .eq('client_id', invoice.client_id as string)
    .order('role')
    .limit(5);

  const billingContact =
    contacts?.find((c: Record<string, unknown>) => c.role === 'billing') ??
    contacts?.[0];

  if (billingContact) {
    const clientName = (invoice.clients as Record<string, string>)?.company_name ?? 'Client';
    const emailBody = [
      `Dear ${billingContact.first_name},`,
      '',
      `Please find attached invoice ${invoice.invoice_number} for ${clientName}.`,
      '',
      `Amount due: $${(invoice.total as number).toLocaleString()}`,
      `Due date: ${invoice.due_date}`,
    ];

    if (paymentUrl) {
      emailBody.push('', `Pay online: ${paymentUrl}`);
    }

    emailBody.push('', 'Thank you for your business.');

    await sendEmail({
      to: billingContact.email as string,
      toName: `${billingContact.first_name} ${billingContact.last_name}`,
      subject: `Invoice ${invoice.invoice_number} from your provider`,
      body: emailBody.join('\n'),
    });
  }

  // Audit log
  logAuditAction({
    orgId: perm.organizationId,
    action: 'invoice.sent',
    entity: 'invoice',
    entityId: id,
    metadata: { invoice_number: invoice.invoice_number, payment_url: paymentUrl },
  }).catch(() => {});

  // Fire notification asynchronously
  notifyInvoiceSent(id, perm.organizationId).catch(() => {});

  return NextResponse.json({ success: true, invoice: updatedInvoice });
}
