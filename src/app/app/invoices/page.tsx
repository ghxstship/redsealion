import Link from 'next/link';
import { formatCurrency, statusColor } from '@/lib/utils';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import InvoiceTabs from '@/components/admin/invoices/InvoiceTabs';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  type: string;
  status: string;
  total: number;
  amount_paid: number;
  issue_date: string;
  due_date: string;
}

async function getInvoices(): Promise<InvoiceRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) return [];

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(company_name)')
      .eq('organization_id', userData.organization_id)
      .order('issue_date', { ascending: false });

    if (!invoices) return [];

    return invoices.map((inv: Record<string, unknown>) => ({
      id: inv.id as string,
      invoice_number: inv.invoice_number as string,
      client_name: (inv.clients as Record<string, string>)?.company_name ?? 'Unknown',
      type: inv.type as string,
      status: inv.status as string,
      total: inv.total as number,
      amount_paid: inv.amount_paid as number,
      issue_date: inv.issue_date as string,
      due_date: inv.due_date as string,
    }));
  } catch {
    return [];
  }
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {invoices.length} invoices &middot;{' '}
            {formatCurrency(invoices.reduce((s, i) => s + i.total, 0))} total
          </p>
        </div>
        <Link
          href="/app/invoices/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          New Invoice
        </Link>
      </div>

      <TierGate feature="invoices">
        <InvoiceTabs invoices={invoices} />
      </TierGate>
    </>
  );
}
