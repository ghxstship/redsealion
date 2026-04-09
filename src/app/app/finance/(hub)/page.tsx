import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import FinanceHubTabs from '../FinanceHubTabs';
import { getOrgCurrency } from '@/lib/finance/org-settings';

interface FinanceOverviewStats {
  totalPOs: number;
  openPOValue: number;
  vendorCount: number;
  recognizedRevenue: number;
  totalExpensesYTD: number;
  outstandingInvoices: number;
}

async function getStats(): Promise<FinanceOverviewStats> {
  const fallback: FinanceOverviewStats = {
    totalPOs: 0, openPOValue: 0, vendorCount: 0,
    recognizedRevenue: 0, totalExpensesYTD: 0, outstandingInvoices: 0,
  };
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return fallback;

    const yearStart = `${new Date().getFullYear()}-01-01`;

    const [poRes, vendorRes, revRecRes, expenseRes, invoiceRes] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('id, total_amount, status')
        .eq('organization_id', ctx.organizationId)
        .is('deleted_at', null),
      supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId)
        .is('deleted_at', null),
      supabase
        .from('revenue_recognition')
        .select('recognized_amount')
        .eq('organization_id', ctx.organizationId),
      supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', ctx.organizationId)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .gte('expense_date', yearStart),
      supabase
        .from('invoices')
        .select('total, amount_paid')
        .eq('organization_id', ctx.organizationId)
        .in('status', ['sent', 'partially_paid', 'overdue'])
        .is('deleted_at', null),
    ]);

    const pos = poRes.data ?? [];
    const openPOs = pos.filter((po) => po.status !== 'closed' && po.status !== 'cancelled');

    const recognizedRevenue = (revRecRes.data ?? []).reduce(
      (sum, r) => sum + ((r.recognized_amount as number) ?? 0), 0,
    );
    const totalExpensesYTD = (expenseRes.data ?? []).reduce(
      (sum, e) => sum + ((e.amount as number) ?? 0), 0,
    );
    const outstandingInvoices = (invoiceRes.data ?? []).reduce(
      (sum, inv) => sum + ((inv.total as number) - (inv.amount_paid as number)), 0,
    );

    return {
      totalPOs: pos.length,
      openPOValue: openPOs.reduce((sum, po) => sum + ((po.total_amount as number) ?? 0), 0),
      vendorCount: vendorRes.count ?? 0,
      recognizedRevenue,
      totalExpensesYTD,
      outstandingInvoices,
    };
  } catch {
    return fallback;
  }
}

export default async function FinancePage() {
  const stats = await getStats();

  return (
    <TierGate feature="profitability">
      <PageHeader
        title="Finance"
        subtitle="Purchase orders, vendor management, and revenue recognition."
      />

      <FinanceHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Purchase Orders</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.totalPOs}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Open PO Value</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(stats.openPOValue)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Vendors</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{stats.vendorCount}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Recognized Revenue</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(stats.recognizedRevenue)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Expenses YTD</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(stats.totalExpensesYTD)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Outstanding Invoices</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(stats.outstandingInvoices)}</p>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">
          Select a tab above to manage purchase orders, track revenue recognition, or view vendors.
        </p>
      </div>
    </TierGate>
  );
}
