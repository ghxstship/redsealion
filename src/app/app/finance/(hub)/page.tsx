import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import FinanceHubTabs from '../FinanceHubTabs';

interface FinanceOverviewStats {
  totalPOs: number;
  openPOValue: number;
  vendorCount: number;
  recognizedRevenue: number;
}

async function getStats(): Promise<FinanceOverviewStats> {
  const fallback: FinanceOverviewStats = { totalPOs: 0, openPOValue: 0, vendorCount: 0, recognizedRevenue: 0 };
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return fallback;

    const [poRes, vendorRes] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('id, total_amount, status')
        .eq('organization_id', ctx.organizationId),
      supabase
        .from('vendors')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId),
    ]);

    const pos = poRes.data ?? [];
    const openPOs = pos.filter((po) => po.status !== 'closed' && po.status !== 'cancelled');

    return {
      totalPOs: pos.length,
      openPOValue: openPOs.reduce((sum, po) => sum + ((po.total_amount as number) ?? 0), 0),
      vendorCount: vendorRes.count ?? 0,
      recognizedRevenue: 0,
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
      </div>

      <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">
          Select a tab above to manage purchase orders, track revenue recognition, or view vendors.
        </p>
      </div>
    </TierGate>
  );
}
