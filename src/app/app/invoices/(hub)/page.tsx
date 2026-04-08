import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import InvoiceHubTabs from '../InvoiceHubTabs';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  type: string;
  status: string;
  issue_date: string;
  due_date: string;
  total: number;
  amount_paid: number;
  client_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-50 text-gray-700',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-indigo-50 text-indigo-700',
  paid: 'bg-green-50 text-green-700',
  partial: 'bg-yellow-50 text-yellow-700',
  overdue: 'bg-red-50 text-red-700',
  void: 'bg-zinc-50 text-zinc-500',
};

async function getInvoices(): Promise<InvoiceRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, type, status, issue_date, due_date, total, amount_paid, client_id')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return [];

    const clientIds = [...new Set(data.map((i) => i.client_id).filter(Boolean))];
    const { data: clients } = clientIds.length
      ? await supabase.from('clients').select('id, company_name').in('id', clientIds)
      : { data: [] };

    const nameMap = new Map((clients ?? []).map((c) => [c.id, c.company_name]));

    return data.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      type: inv.type ?? 'standard',
      status: inv.status,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      total: inv.total,
      amount_paid: inv.amount_paid ?? 0,
      client_name: nameMap.get(inv.client_id) ?? '—',
    }));
  } catch {
    return [];
  }
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const totalOutstanding = invoices.reduce((s, i) => s + (i.total - i.amount_paid), 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoices · ${formatCurrency(totalOutstanding)} outstanding`}
      >
        <Link
          href="/app/invoices/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          New Invoice
        </Link>
      </PageHeader>

      <InvoiceHubTabs />

      {invoices.length === 0 ? (
        <EmptyState
          message="No invoices yet"
          description="Create your first invoice to start tracking payments."
          action={
            <Link
              href="/app/invoices/new"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              New Invoice
            </Link>
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/invoices/${inv.id}`} className="font-medium text-foreground hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{inv.client_name}</td>
                    <td className="px-4 py-3 capitalize">{inv.type}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(inv.issue_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.amount_paid)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-gray-50 text-gray-700'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
