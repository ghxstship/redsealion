import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import { formatCurrency } from '@/lib/utils';
import { TierGate } from '@/components/shared/TierGate';
import InvoiceTabs from '@/components/admin/invoices/InvoiceTabs';

interface PortalInvoicesPageProps {
  params: Promise<{ orgSlug: string }>;
}

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

async function getInvoices(orgId: string): Promise<InvoiceRow[]> {
  try {
    const supabase = await createClient();

    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, clients(company_name)')
      .eq('organization_id', orgId)
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

export default async function PortalInvoicesPage({ params }: PortalInvoicesPageProps) {
  const { orgSlug } = await params;
  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) redirect('/');

  const invoices = await getInvoices(org.organizationId);

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
      </div>

      <TierGate feature="invoices">
        <InvoiceTabs invoices={invoices} />
      </TierGate>
    </>
  );
}
