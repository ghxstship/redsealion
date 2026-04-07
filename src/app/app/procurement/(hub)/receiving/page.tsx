import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ProcurementHubTabs from '../../ProcurementHubTabs';

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
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      id: r.id as string, status: r.status as string, received_date: r.received_date as string,
      notes: r.notes as string | null,
      po_number: Array.isArray(r.purchase_orders) ? r.purchase_orders[0]?.po_number : r.purchase_orders?.po_number ?? null,
      vendor_name: Array.isArray(r.purchase_orders) ? r.purchase_orders[0]?.vendor_name : r.purchase_orders?.vendor_name ?? null,
    }));
  } catch { return []; }
}

const STATUS_COLORS: Record<string, string> = { partial: 'bg-yellow-50 text-yellow-700', complete: 'bg-green-50 text-green-700', rejected: 'bg-red-50 text-red-700' };

export default async function ReceivingPage() {
  const receipts = await getReceipts();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Receiving" subtitle="Log and inspect incoming goods against purchase orders." />
      <ProcurementHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total Receipts', value: receipts.length },
          { label: 'Complete', value: receipts.filter((r) => r.status === 'complete').length, color: 'text-green-600' },
          { label: 'Partial', value: receipts.filter((r) => r.status === 'partial').length, color: 'text-yellow-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {receipts.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No goods receipts yet. Receipts are logged when PO deliveries arrive.</p></div>
        ) : (
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
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
