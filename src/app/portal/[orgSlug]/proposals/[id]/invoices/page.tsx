import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { InvoiceType, InvoiceStatus } from '@/types/database';
import { formatCurrencyDetailed, statusColor } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InvoiceTypeBadge({ type }: { type: InvoiceType }) {
  const styles: Record<string, string> = {
    deposit: 'bg-blue-50 text-blue-700',
    balance: 'bg-indigo-50 text-indigo-700',
    change_order: 'bg-amber-50 text-amber-700',
    addon: 'bg-purple-50 text-purple-700',
    final: 'bg-green-50 text-green-700',
    recurring: 'bg-teal-50 text-teal-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[type] ?? 'bg-bg-secondary text-gray-600'}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface InvoiceRow {
  id: string;
  invoice_number: string;
  type: InvoiceType;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  total: number;
  amount_paid: number;
  memo: string | null;
  payment_link: string | null;
}

export default async function InvoicesPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const supabase = await createClient();

  // Verify proposal belongs to this org
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!proposal) notFound();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org || proposal.organization_id !== org.id) notFound();

  // Fetch invoices for this proposal
  const { data: invoicesRaw } = await supabase
    .from('invoices')
    .select('id, invoice_number, type, status, issue_date, due_date, paid_date, total, amount_paid, memo, payment_link')
    .eq('proposal_id', id)
    .order('issue_date', { ascending: true });

  const invoices = (invoicesRaw ?? []) as InvoiceRow[];

  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.total - inv.amount_paid), 0);
  const totalValue = invoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Payment schedule and invoice status for this project.
        </p>
      </div>

      {invoices.length === 0 && (
        <EmptyState
          message="No invoices issued yet"
          description="Invoices will appear here as milestone gates are completed."
        />
      )}

      {invoices.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Paid</p>
              <p className="mt-1 text-xl font-semibold text-green-700">
                {formatCurrencyDetailed(totalPaid)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Outstanding</p>
              <p className="mt-1 text-xl font-semibold text-amber-700">
                {formatCurrencyDetailed(totalOutstanding)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Value</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {formatCurrencyDetailed(totalValue)}
              </p>
            </div>
          </div>

          {/* Invoice list */}
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-lg border border-border bg-background p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Left: invoice info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {invoice.invoice_number}
                    </span>
                    <InvoiceTypeBadge type={invoice.type} />
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  {invoice.memo && (
                    <p className="text-xs text-text-muted">{invoice.memo}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                    <span>
                      Issued: {new Date(invoice.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>
                      Due: {new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {invoice.paid_date && (
                      <span className="text-green-600">
                        Paid: {new Date(invoice.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: amount + action */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrencyDetailed(invoice.total)}
                  </span>
                  {invoice.payment_link && invoice.status !== 'paid' && (
                    <a
                      href={invoice.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors"
                      style={{ backgroundColor: 'var(--org-primary)' }}
                    >
                      Pay Now
                    </a>
                  )}
                  {invoice.status === 'paid' && (
                    <span className="text-xs font-medium text-green-600">Paid in full</span>
                  )}
                  {invoice.status === 'draft' && (
                    <span className="text-xs text-text-muted">Pending issuance</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
