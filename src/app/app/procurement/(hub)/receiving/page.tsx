import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import ProcurementHubTabs from '../../ProcurementHubTabs';
import StatusBadge, { RECEIPT_STATUS_COLORS } from '@/components/ui/StatusBadge';

async function getReceipts() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('goods_receipts')
      .select('id, status, received_date, notes, purchase_orders(po_number, vendor_name)')
      .eq('organization_id', ctx.organizationId)
      .order('received_date', { ascending: false });
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, status: r.status as string, received_date: r.received_date as string,
      notes: r.notes as string | null,
      po_number: Array.isArray(r.purchase_orders) ? (r.purchase_orders as Record<string, unknown>[])[0]?.po_number as string : (r.purchase_orders as Record<string, unknown> | null)?.po_number as string ?? null,
      vendor_name: Array.isArray(r.purchase_orders) ? (r.purchase_orders as Record<string, unknown>[])[0]?.vendor_name as string : (r.purchase_orders as Record<string, unknown> | null)?.vendor_name as string ?? null,
    }));
  } catch { return []; }
}



export default async function ReceivingPage() {
  const receipts = await getReceipts();

  return (
    <TierGate feature="profitability">
      <PageHeader title="Receiving" subtitle="Log and inspect incoming goods against purchase orders." />
      <ProcurementHubTabs />

      <div className="flex justify-end mb-6">
        <Link href="/app/procurement/receiving/new" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 transition-colors">
          + Log Receipt
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Receipts', value: receipts.length },
          { label: 'Complete', value: receipts.filter((r) => r.status === 'complete').length, color: 'text-green-600' },
          { label: 'Partial', value: receipts.filter((r) => r.status === 'partial').length, color: 'text-yellow-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {receipts.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No goods receipts yet. Receipts are logged when PO deliveries arrive.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">PO #</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Received</th><th className="px-4 py-3">Notes</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{r.po_number ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.vendor_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(r.received_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs line-clamp-1">{r.notes ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} colorMap={RECEIPT_STATUS_COLORS} /></td>
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
