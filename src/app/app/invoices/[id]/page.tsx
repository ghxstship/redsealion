import Link from 'next/link';
import { formatCurrency, formatCurrencyDetailed, statusColor } from '@/lib/utils';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import PaymentRecorder from '@/components/admin/invoices/PaymentRecorder';
import InvoiceActions from '@/components/admin/invoices/InvoiceActions';
import PageHeader from '@/components/shared/PageHeader';

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  client_name: string;
  type: string;
  status: string;
  total: number;
  subtotal: number;
  tax_amount: number;
  amount_paid: number;
  currency: string;
  memo: string | null;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  sent_at: string | null;
  line_items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    tax_rate: number;
    tax_amount: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference: string | null;
  }>;
}

async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('No auth');

    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, clients(company_name)')
      .eq('id', id)
      .single();

    if (!invoice) return null;

    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select()
      .eq('invoice_id', id);

    const { data: payments } = await supabase
      .from('invoice_payments')
      .select()
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false });

    return {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_name: (invoice.clients as Record<string, string>)?.company_name ?? 'Unknown',
      type: invoice.type,
      status: invoice.status,
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax_amount,
      amount_paid: invoice.amount_paid,
      currency: invoice.currency,
      memo: invoice.memo,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      paid_date: invoice.paid_date,
      sent_at: invoice.sent_at,
      line_items: (lineItems ?? []).map((li: Record<string, unknown>) => ({
        id: li.id as string,
        description: li.description as string,
        quantity: li.quantity as number,
        rate: li.rate as number,
        amount: li.amount as number,
        tax_rate: (li.tax_rate as number) ?? 0,
        tax_amount: (li.tax_amount as number) ?? 0,
      })),
      payments: (payments ?? []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        amount: p.amount as number,
        payment_method: (p.payment_method as string) ?? 'other',
        payment_date: (p.payment_date as string) ?? '',
        reference: (p.reference as string) ?? null,
      })),
    };
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-sm text-text-muted">Invoice not found.</p>
        <Link
          href="/app/invoices"
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Invoices
        </Link>
      </div>
    );
  }

  const balanceDue = invoice.total - invoice.amount_paid;

  return (
    <TierGate feature="invoices">
      <nav className="mb-6 flex items-center gap-2 text-sm text-text-muted">
        <Link href="/app/invoices" className="hover:text-foreground transition-colors">
          Invoices
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{invoice.invoice_number}</span>
      </nav>

      <PageHeader


        title="{invoice.invoice_number}"


        subtitle={`${invoice.client_name} · ${formatStatus(invoice.type)}`}


      >


        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColor(invoice.status)}`}
          >
            {formatStatus(invoice.status)}
          </span>
          <InvoiceActions
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoice_number}
            status={invoice.status}
          />


      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice preview */}
          <div className="rounded-xl border border-border bg-white p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-text-muted">Bill To</p>
                <p className="text-sm font-medium text-foreground">{invoice.client_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted">Invoice Date</p>
                <p className="text-sm font-medium text-foreground">{formatDate(invoice.issue_date)}</p>
                <p className="mt-1 text-xs text-text-muted">Due Date</p>
                <p className="text-sm font-medium text-foreground">{formatDate(invoice.due_date)}</p>
              </div>
            </div>

            {/* Line items */}
            {(() => {
              const hasTax = invoice.line_items.some((li) => li.tax_rate > 0);
              return (
                <table className="w-full mb-4">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 text-left text-xs font-medium text-text-muted">Description</th>
                      <th className="py-2 text-right text-xs font-medium text-text-muted">Qty</th>
                      <th className="py-2 text-right text-xs font-medium text-text-muted">Rate</th>
                      {hasTax && <th className="py-2 text-right text-xs font-medium text-text-muted">Tax</th>}
                      <th className="py-2 text-right text-xs font-medium text-text-muted">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoice.line_items.map((li) => (
                      <tr key={li.id}>
                        <td className="py-3 text-sm text-foreground">{li.description}</td>
                        <td className="py-3 text-right text-sm tabular-nums text-text-secondary">{li.quantity}</td>
                        <td className="py-3 text-right text-sm tabular-nums text-text-secondary">{formatCurrencyDetailed(li.rate)}</td>
                        {hasTax && (
                          <td className="py-3 text-right text-sm tabular-nums text-text-secondary">
                            {li.tax_rate > 0 ? `${li.tax_rate}%` : '—'}
                          </td>
                        )}
                        <td className="py-3 text-right text-sm font-medium tabular-nums text-foreground">
                          {formatCurrencyDetailed(li.amount + li.tax_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}

            {/* Totals */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Subtotal</span>
                <span className="tabular-nums text-foreground">{formatCurrencyDetailed(invoice.subtotal)}</span>
              </div>
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tax</span>
                  <span className="tabular-nums text-foreground">{formatCurrencyDetailed(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                <span className="text-foreground">Total</span>
                <span className="tabular-nums text-foreground">{formatCurrencyDetailed(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Paid</span>
                <span className="tabular-nums text-green-700">{formatCurrencyDetailed(invoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-foreground">Balance Due</span>
                <span className={`tabular-nums ${balanceDue > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {formatCurrencyDetailed(balanceDue)}
                </span>
              </div>
            </div>

            {invoice.memo && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-text-muted mb-1">Memo</p>
                <p className="text-sm text-text-secondary">{invoice.memo}</p>
              </div>
            )}
          </div>

          {/* Payment history */}
          {invoice.payments.length > 0 && (
            <div className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Payment History</h2>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{payment.payment_method.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-text-muted">{formatDate(payment.payment_date)}</p>
                      {payment.reference && (
                        <p className="text-xs text-text-muted">Ref: {payment.reference}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium tabular-nums text-green-700">
                      {formatCurrencyDetailed(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Status</dt>
                <dd className="font-medium text-foreground">{formatStatus(invoice.status)}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Type</dt>
                <dd className="font-medium text-foreground capitalize">{invoice.type}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Issue Date</dt>
                <dd className="font-medium text-foreground">{formatDate(invoice.issue_date)}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Due Date</dt>
                <dd className="font-medium text-foreground">{formatDate(invoice.due_date)}</dd>
              </div>
              {invoice.paid_date && (
                <div>
                  <dt className="text-text-muted">Paid Date</dt>
                  <dd className="font-medium text-green-700">{formatDate(invoice.paid_date)}</dd>
                </div>
              )}
              {invoice.sent_at && (
                <div>
                  <dt className="text-text-muted">Sent</dt>
                  <dd className="font-medium text-foreground">{formatDate(invoice.sent_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Record payment */}
          {balanceDue > 0 && (
            <PaymentRecorder invoiceId={invoice.id} balanceDue={balanceDue} />
          )}
        </div>
      </div>
    </TierGate>
  );
}
