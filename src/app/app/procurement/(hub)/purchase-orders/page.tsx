import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import ProcurementHubTabs from '../../ProcurementHubTabs';
import StatusBadge, { PO_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';

async function getPOs() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, status, total_amount, issued_date, due_date')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });
    return (data ?? []) as Array<{
      id: string; po_number: string; vendor_name: string | null; status: string;
      total_amount: number; issued_date: string | null; due_date: string | null;
    }>;
  } catch { return []; }
}



export default async function ProcurementPOPage() {
  const pos = await getPOs();

  return (
    <TierGate feature="procurement">
      <PageHeader title="Purchase Orders" subtitle="Track POs from issuance through delivery." />
      <ProcurementHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Total POs"} value={pos.length} />
        <MetricCard label={"Pending Delivery"} value={pos.filter((p) => p.status === 'sent' || p.status === 'acknowledged').length} className="[&_.text-foreground]:text-yellow-600" />
        <MetricCard label={"Total Spend"} value={formatCurrency(pos.reduce((s, p) => s + (p.total_amount ?? 0), 0))} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {pos.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No purchase orders. POs are created from approved requisitions or directly from Finance.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">PO #</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Ordered</th><th className="px-4 py-3">Expected</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pos.map((po) => (
                  <tr key={po.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3"><Link href={`/app/procurement/purchase-orders/${po.id}`} className="font-medium text-foreground hover:underline">{po.po_number}</Link></td>
                    <td className="px-4 py-3 text-text-secondary">{po.vendor_name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(po.total_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-text-secondary">{po.issued_date ? new Date(po.issued_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{po.due_date ? new Date(po.due_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={po.status} colorMap={PO_STATUS_COLORS} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
