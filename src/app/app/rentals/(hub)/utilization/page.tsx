import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import RentalsHubTabs from '../../RentalsHubTabs';

async function getUtilization() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { totalEquip: 0, rented: 0, revenue: 0, avgDays: 0 };
    const [equipRes, rentalRes] = await Promise.all([
      supabase.from('assets').select('id', { count: 'exact', head: true }).eq('organization_id', ctx.organizationId),
      supabase.from('rental_orders').select('id, total_cents, rental_start, rental_end').eq('organization_id', ctx.organizationId).in('status', ['checked_out', 'on_site', 'returned', 'invoiced']),
    ]);
    const rentals = (rentalRes.data ?? []) as Array<{ id: string; total_cents: number; rental_start: string; rental_end: string }>;
    const revenue = rentals.reduce((s, r) => s + (r.total_cents ?? 0), 0);
    const totalDays = rentals.reduce((s, r) => {
      const d = (new Date(r.rental_end).getTime() - new Date(r.rental_start).getTime()) / 86400000;
      return s + Math.max(d, 1);
    }, 0);
    const avgDays = rentals.length > 0 ? Math.round(totalDays / rentals.length) : 0;
    return { totalEquip: equipRes.count ?? 0, rented: rentals.length, revenue, avgDays };
  } catch { return { totalEquip: 0, rented: 0, revenue: 0, avgDays: 0 }; }
}

export default async function UtilizationPage() {
  const stats = await getUtilization();
  const utilizationRate = stats.totalEquip > 0 ? Math.round((stats.rented / stats.totalEquip) * 100) : 0;

  return (
    <TierGate feature="equipment">
      <PageHeader title="Utilization" subtitle="Equipment rental utilization rates and revenue analytics." />
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Equipment Pool', value: String(stats.totalEquip) },
          { label: 'Utilization Rate', value: `${utilizationRate}%`, color: utilizationRate > 70 ? 'text-green-600' : utilizationRate > 40 ? 'text-yellow-600' : 'text-red-600' },
          { label: 'Rental Revenue', value: formatCurrency(stats.revenue / 100), color: 'text-green-600' },
          { label: 'Avg Rental Duration', value: `${stats.avgDays}d` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background px-5 py-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Utilization Breakdown</h3>
        <div className="w-full h-6 rounded-full bg-bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all" style={{ width: `${utilizationRate}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-text-muted">0%</p>
          <p className="text-xs font-medium text-foreground">{utilizationRate}% utilized</p>
          <p className="text-xs text-text-muted">100%</p>
        </div>
      </div>
    </TierGate>
  );
}
