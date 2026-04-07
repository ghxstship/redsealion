import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import ProcurementHubTabs from '../ProcurementHubTabs';

async function getProcurementStats() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { reqCount: 0, poCount: 0, vendorCount: 0, totalSpend: 0 };
    const [reqRes, poRes, vendorRes] = await Promise.all([
      supabase.from('purchase_requisitions').select('id, total_cents', { count: 'exact' }).eq('organization_id', ctx.organizationId),
      supabase.from('purchase_orders').select('id, total_amount', { count: 'exact' }).eq('organization_id', ctx.organizationId),
      supabase.from('vendors').select('id', { count: 'exact' }).eq('organization_id', ctx.organizationId),
    ]);
    const totalSpend = (poRes.data ?? []).reduce((s: number, po: { total_amount?: number }) => s + (po.total_amount ?? 0), 0);
    return { reqCount: reqRes.count ?? 0, poCount: poRes.count ?? 0, vendorCount: vendorRes.count ?? 0, totalSpend };
  } catch { return { reqCount: 0, poCount: 0, vendorCount: 0, totalSpend: 0 }; }
}

export default async function ProcurementOverviewPage() {
  const stats = await getProcurementStats();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Procurement" subtitle="End-to-end purchasing from requisition to receiving." />
      <ProcurementHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Requisitions', value: String(stats.reqCount) },
          { label: 'Purchase Orders', value: String(stats.poCount) },
          { label: 'Suppliers', value: String(stats.vendorCount) },
          { label: 'Total Spend', value: formatCurrency(stats.totalSpend) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { title: 'Create Requisition', desc: 'Submit a purchase request for approval.', href: '/app/procurement/requisitions' },
          { title: 'View Purchase Orders', desc: 'Track approved orders and delivery status.', href: '/app/procurement/purchase-orders' },
          { title: 'Receive Goods', desc: 'Log incoming deliveries and inspect items.', href: '/app/procurement/receiving' },
          { title: 'Manage Suppliers', desc: 'Add and rate vendors for procurement.', href: '/app/procurement/suppliers' },
        ].map((card) => (
          <a key={card.title} href={card.href} className="rounded-xl border border-border bg-white px-5 py-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
            <p className="text-xs text-text-secondary mt-1">{card.desc}</p>
          </a>
        ))}
      </div>
    </TierGate>
  );
}
