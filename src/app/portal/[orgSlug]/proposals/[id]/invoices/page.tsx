import type { Invoice, InvoiceType, InvoiceStatus } from '@/types/database';
import { formatCurrencyDetailed, statusColor } from '@/lib/utils';

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    proposal_id: 'proposal-1',
    client_id: 'client-1',
    organization_id: 'org-1',
    invoice_number: 'INV-2026-001',
    type: 'deposit' as InvoiceType,
    status: 'paid' as InvoiceStatus,
    triggered_by_milestone_id: 'ms-1',
    issue_date: '2026-02-12T00:00:00Z',
    due_date: '2026-02-26T00:00:00Z',
    paid_date: '2026-02-20T00:00:00Z',
    subtotal: 127500,
    tax_amount: 0,
    total: 127500,
    amount_paid: 127500,
    currency: 'USD',
    memo: 'Deposit invoice — 25% upon Discovery approval',
    payment_link: 'https://pay.example.com/inv-1',
    created_at: '2026-02-12T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z',
  },
  {
    id: 'inv-2',
    proposal_id: 'proposal-1',
    client_id: 'client-1',
    organization_id: 'org-1',
    invoice_number: 'INV-2026-002',
    type: 'deposit' as InvoiceType,
    status: 'sent' as InvoiceStatus,
    triggered_by_milestone_id: 'ms-3',
    issue_date: '2026-03-22T00:00:00Z',
    due_date: '2026-04-05T00:00:00Z',
    paid_date: null,
    subtotal: 127500,
    tax_amount: 0,
    total: 127500,
    amount_paid: 0,
    currency: 'USD',
    memo: 'Second deposit — 25% upon Engineering sign-off',
    payment_link: 'https://pay.example.com/inv-2',
    created_at: '2026-03-22T00:00:00Z',
    updated_at: '2026-03-22T00:00:00Z',
  },
  {
    id: 'inv-3',
    proposal_id: 'proposal-1',
    client_id: 'client-1',
    organization_id: 'org-1',
    invoice_number: 'INV-2026-003',
    type: 'balance' as InvoiceType,
    status: 'draft' as InvoiceStatus,
    triggered_by_milestone_id: 'ms-7',
    issue_date: '2026-05-01T00:00:00Z',
    due_date: '2026-05-15T00:00:00Z',
    paid_date: null,
    subtotal: 255000,
    tax_amount: 0,
    total: 255000,
    amount_paid: 0,
    currency: 'USD',
    memo: 'Final balance — 50% upon Activation go-live',
    payment_link: null,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
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
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type.replace('_', ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default async function InvoicesPage({ params }: PageProps) {
  const { orgSlug, id } = await params;

  const totalPaid = mockInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
  const totalOutstanding = mockInvoices.reduce((sum, inv) => sum + (inv.total - inv.amount_paid), 0);
  const totalValue = mockInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Payment schedule and invoice status for this project.
        </p>
      </div>

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
        {mockInvoices.map((invoice) => (
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
    </div>
  );
}
