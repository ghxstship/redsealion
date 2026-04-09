import { formatCurrency } from '@/lib/utils';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import InvoiceTabs from '@/components/admin/invoices/InvoiceTabs';
import Button from '@/components/ui/Button';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Plus } from 'lucide-react';
import FinanceHubTabs from '../../FinanceHubTabs';
import InvoiceSubNav from '@/components/admin/invoices/InvoiceSubNav';
import PageHeader from '@/components/shared/PageHeader';

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
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
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

export default async function FinanceInvoicesPage() {
  const invoices = await getInvoices();

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoices · ${formatCurrency(invoices.reduce((s, i) => s + i.total, 0))} total`}
      >
        <Button href="/app/invoices/new">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </PageHeader>

      <FinanceHubTabs />

      <InvoiceSubNav basePath="/app/finance/invoices" className="mb-6" />

      <TierGate feature="invoices">
        <InvoiceTabs invoices={invoices} />
      </TierGate>
    </>
  );
}
