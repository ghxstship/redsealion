import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import ProcurementHubTabs from '../../ProcurementHubTabs';

async function getPOs() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('purchase_orders')
      .select('id, po_number, vendor_name, status, total_amount, order_date, expected_delivery')
      .eq('organization_id', ctx.organizationId)
      .order('order_date', { ascending: false });
    return (data ?? []) as Array<{
      id: string; po_number: string; vendor_name: string | null; status: string;
      total_amount: number; order_date: string | null; expected_delivery: string | null;
    }>;
  } catch { return []; }
}

const STATUS_COLORS: Record<string, string> = { draft: 'bg-bg-secondary text-text-secondary', sent: 'bg-blue-50 text-blue-700', acknowledged: 'bg-purple-50 text-purple-700', partially_received: 'bg-yellow-50 text-yellow-700', received: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };

export default async function ProcurementPOPage() {
  const pos = await getPOs();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Purchase Orders" subtitle="Track POs from issuance through delivery." />
      <ProcurementHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total POs</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{pos.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Pending Delivery</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-yellow-600">{pos.filter((p) => p.status === 'sent' || p.status === 'acknowledged').length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Spend</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(pos.reduce((s, p) => s + (p.total_amount ?? 0), 0))}</p>
        </div>
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
                    <td className="px-4 py-3"><Link href={`/app/finance/purchase-orders/${po.id}`} className="font-medium text-foreground hover:underline">{po.po_number}</Link></td>
                    <td className="px-4 py-3 text-text-secondary">{po.vendor_name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(po.total_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-text-secondary">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[po.status] ?? 'bg-bg-secondary text-text-secondary'}`}>{po.status?.replace('_', ' ')}</span></td>
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
