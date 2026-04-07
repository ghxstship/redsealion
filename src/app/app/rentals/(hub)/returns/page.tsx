import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import RentalsHubTabs from '../../RentalsHubTabs';

async function getReturns() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('rental_line_items')
      .select('id, name, quantity, status, rental_orders(order_number, rental_end)')
      .in('status', ['returned', 'damaged', 'lost'])
      .order('created_at', { ascending: false })
      .limit(50);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      id: r.id as string, name: r.name as string, quantity: r.quantity as number, status: r.status as string,
      order_number: Array.isArray(r.rental_orders) ? r.rental_orders[0]?.order_number : r.rental_orders?.order_number ?? null,
      rental_end: Array.isArray(r.rental_orders) ? r.rental_orders[0]?.rental_end : r.rental_orders?.rental_end ?? null,
    }));
  } catch { return []; }
}

export default async function ReturnsPage() {
  const returns = await getReturns();
  const damaged = returns.filter((r) => r.status === 'damaged').length;
  const lost = returns.filter((r) => r.status === 'lost').length;

  return (
    <TierGate feature="equipment">
      <PageHeader title="Returns" subtitle="Process equipment returns, damage reports, and loss claims." />
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Returns', value: returns.length },
          { label: 'Returned OK', value: returns.filter((r) => r.status === 'returned').length, color: 'text-green-600' },
          { label: 'Damaged', value: damaged, color: 'text-orange-600' },
          { label: 'Lost', value: lost, color: 'text-red-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {returns.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No returns processed. Returned rental items will appear here for inspection.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Item</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Return Date</th><th className="px-4 py-3">Condition</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {returns.map((r) => (
                <tr key={r.id} className={`hover:bg-bg-secondary/50 transition-colors ${r.status === 'damaged' || r.status === 'lost' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.order_number ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{r.quantity}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.rental_end ? new Date(r.rental_end).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'returned' ? 'bg-green-50 text-green-700' : r.status === 'damaged' ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
