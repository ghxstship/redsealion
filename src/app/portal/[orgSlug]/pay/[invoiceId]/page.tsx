import { createClient } from '@/lib/supabase/server';
import { XCircle } from 'lucide-react';
import { IconCheck } from '@/components/ui/Icons';

interface InvoiceSummary {
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  status: string;
  currency: string;
  org_name: string;
  payment_link: string | null;
}

async function getInvoice(
  orgSlug: string,
  invoiceId: string
): Promise<{ data: InvoiceSummary | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Verify org
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('slug', orgSlug)
      .single();

    if (!org) {
      return { data: null, error: 'Organization not found.' };
    }

    // Fetch invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, clients(company_name)')
      .eq('id', invoiceId)
      .eq('organization_id', org.id)
      .single();

    if (!invoice) {
      return { data: null, error: 'Invoice not found.' };
    }

    return {
      data: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_name: (invoice.clients as Record<string, string>)?.company_name ?? 'Unknown',
        total: invoice.total,
        amount_paid: invoice.amount_paid ?? 0,
        amount_due: invoice.total - (invoice.amount_paid ?? 0),
        due_date: invoice.due_date,
        status: invoice.status,
        currency: invoice.currency ?? 'USD',
        org_name: org.name,
        payment_link: invoice.payment_link ?? null,
      },
      error: null,
    };
  } catch {
    // Fallback for demo
    return {
      data: {
        id: invoiceId,
        invoice_number: 'INV-2026-0042',
        client_name: 'Nike',
        total: 212500,
        amount_paid: 0,
        amount_due: 212500,
        due_date: '2026-04-30',
        status: 'sent',
        currency: 'USD',
        org_name: orgSlug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        payment_link: 'https://checkout.stripe.com/pay/demo',
      },
      error: null,
    };
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-50 text-blue-700',
  overdue: 'bg-red-50 text-red-700',
  paid: 'bg-green-50 text-green-700',
  partially_paid: 'bg-yellow-50 text-yellow-700',
  draft: 'bg-gray-100 text-gray-600',
};

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ orgSlug: string; invoiceId: string }>;
}) {
  const { orgSlug, invoiceId } = await params;
  const { data: invoice, error } = await getInvoice(orgSlug, invoiceId);

  // Error state
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <XCircle className="text-red-500" size={24} strokeWidth={2} />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Invoice Not Found</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {error ?? 'This payment link is invalid.'}
          </p>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === 'paid';

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full max-w-lg mb-8">
        <p className="text-sm text-text-muted text-center">{invoice.org_name}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-center">
          Invoice {invoice.invoice_number}
        </h1>
      </div>

      {/* Invoice summary */}
      <div className="w-full max-w-lg rounded-xl border border-border bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-foreground">Invoice Summary</h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_COLORS[invoice.status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {formatLabel(invoice.status)}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-sm text-text-secondary">Client</p>
            <p className="text-sm font-medium text-foreground">{invoice.client_name}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-text-secondary">Invoice Total</p>
            <p className="text-sm font-medium text-foreground">
              {formatCurrency(invoice.total, invoice.currency)}
            </p>
          </div>
          {invoice.amount_paid > 0 && (
            <div className="flex justify-between">
              <p className="text-sm text-text-secondary">Amount Paid</p>
              <p className="text-sm text-green-700">
                {formatCurrency(invoice.amount_paid, invoice.currency)}
              </p>
            </div>
          )}
          <div className="border-t border-border pt-4 flex justify-between">
            <p className="text-sm font-semibold text-foreground">Amount Due</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {formatCurrency(invoice.amount_due, invoice.currency)}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-text-secondary">Due Date</p>
            <p className="text-sm text-foreground">{formatDate(invoice.due_date)}</p>
          </div>
        </div>
      </div>

      {/* Payment action */}
      <div className="w-full max-w-lg">
        {isPaid ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <IconCheck className="text-green-600" size={20} strokeWidth={2} />
            </div>
            <p className="text-sm font-medium text-green-800">This invoice has been paid.</p>
            <p className="mt-1 text-xs text-green-700">Thank you for your payment.</p>
          </div>
        ) : invoice.payment_link ? (
          <a
            href={invoice.payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-foreground px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-foreground/90"
          >
            Pay Now &mdash; {formatCurrency(invoice.amount_due, invoice.currency)}
          </a>
        ) : (
          <div className="rounded-xl border border-border bg-white p-6 text-center">
            <p className="text-sm text-text-secondary">
              Online payment is not yet configured for this invoice.
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Please contact {invoice.org_name} for payment instructions.
            </p>
          </div>
        )}
        <p className="mt-4 text-center text-xs text-text-muted">
          Powered by FlyteDeck &middot; Secure payments via Stripe
        </p>
      </div>
    </div>
  );
}
