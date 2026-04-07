import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import RentalsHubTabs from '../RentalsHubTabs';

async function getRentalCatalog() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { orders: [], totalRevenue: 0, activeOrders: 0 };
    const { data } = await supabase
      .from('rental_orders')
      .select('id, order_number, status, rental_start, rental_end, total_cents, clients(name)')
      .eq('organization_id', ctx.organizationId)
      .order('rental_start', { ascending: false });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const orders = (data ?? []).map((r: any) => ({
      id: r.id as string, order_number: r.order_number as string, status: r.status as string,
      rental_start: r.rental_start as string, rental_end: r.rental_end as string,
      total_cents: r.total_cents as number,
      client_name: Array.isArray(r.clients) ? r.clients[0]?.name : r.clients?.name ?? null,
    }));
    const totalRevenue = orders.reduce((s: number, o: { total_cents: number }) => s + o.total_cents, 0);
    const activeOrders = orders.filter((o: { status: string }) => ['reserved', 'checked_out', 'on_site'].includes(o.status)).length;
    return { orders, totalRevenue, activeOrders };
  } catch { return { orders: [], totalRevenue: 0, activeOrders: 0 }; }
}

const STATUS_COLORS: Record<string, string> = { draft: 'bg-gray-50 text-gray-700', reserved: 'bg-blue-50 text-blue-700', checked_out: 'bg-purple-50 text-purple-700', on_site: 'bg-green-50 text-green-700', returned: 'bg-gray-50 text-gray-700', invoiced: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };

export default async function RentalsCatalogPage() {
  const { orders, totalRevenue, activeOrders } = await getRentalCatalog();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Rentals" subtitle="Equipment rental orders, reservations, and sub-rentals." />
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Orders', value: String(orders.length) },
          { label: 'Active Rentals', value: String(activeOrders), color: 'text-blue-600' },
          { label: 'Revenue', value: formatCurrency(totalRevenue / 100), color: 'text-green-600' },
          { label: 'Returned', value: String(orders.filter((o) => o.status === 'returned').length) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No rental orders yet. Create a rental order to start tracking equipment rentals.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr><th className="px-4 py-3">Order #</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3"><Link href={`/app/rentals/${o.id}`} className="font-medium text-foreground hover:underline">{o.order_number}</Link></td>
                  <td className="px-4 py-3 text-text-secondary">{o.client_name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{new Date(o.rental_start).toLocaleDateString()} – {new Date(o.rental_end).toLocaleDateString()}</td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(o.total_cents / 100)}</td>
                  <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status]}`}>{o.status.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
