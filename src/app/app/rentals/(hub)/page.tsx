import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import RentalsHubTabs from '../RentalsHubTabs';
import StatusBadge, { RENTAL_ORDER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';

async function getRentalCatalog() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { orders: [], totalRevenue: 0, activeOrders: 0 };
    const { data } = await supabase
      .from('rental_orders')
      .select('id, order_number, status, rental_start, rental_end, total_cents, clients(company_name)')
      .eq('organization_id', ctx.organizationId)
      .order('rental_start', { ascending: false });
    const orders = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, order_number: r.order_number as string, status: r.status as string,
      rental_start: r.rental_start as string, rental_end: r.rental_end as string,
      total_cents: r.total_cents as number,
      client_name: Array.isArray(r.clients) ? (r.clients as Record<string, unknown>[])[0]?.company_name as string : (r.clients as Record<string, unknown> | null)?.company_name as string ?? null,
    }));
    const totalRevenue = orders.reduce((s: number, o: { total_cents: number }) => s + o.total_cents, 0);
    const activeOrders = orders.filter((o: { status: string }) => ['reserved', 'checked_out', 'on_site'].includes(o.status)).length;
    return { orders, totalRevenue, activeOrders };
  } catch { return { orders: [], totalRevenue: 0, activeOrders: 0 }; }
}



export default async function RentalsCatalogPage() {
  const { orders, totalRevenue, activeOrders } = await getRentalCatalog();

  return (
    <TierGate feature="equipment">
      <PageHeader title="Rentals" subtitle="Equipment rental orders, reservations, and sub-rentals.">
        <Link
          href="/app/rentals/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          New Rental Order
        </Link>
      </PageHeader>
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total Orders', value: String(orders.length) },
          { label: 'Active Rentals', value: String(activeOrders), color: 'text-blue-600' },
          { label: 'Revenue', value: formatCurrency(totalRevenue / 100), color: 'text-green-600' },
          { label: 'Returned', value: String(orders.filter((o) => o.status === 'returned').length) },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No rental orders yet. Create a rental order to start tracking equipment rentals.</p></div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="px-4 py-3"><StatusBadge status={o.status} colorMap={RENTAL_ORDER_STATUS_COLORS} /></td>
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
