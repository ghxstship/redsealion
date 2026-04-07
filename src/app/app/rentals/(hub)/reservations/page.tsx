import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import RentalsHubTabs from '../../RentalsHubTabs';

async function getReservations() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('rental_orders')
      .select('id, order_number, status, rental_start, rental_end, total_cents, clients(name)')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['reserved', 'checked_out', 'on_site'])
      .order('rental_start', { ascending: true });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (data ?? []).map((r: any) => ({
      id: r.id as string, order_number: r.order_number as string, status: r.status as string,
      rental_start: r.rental_start as string, rental_end: r.rental_end as string, total_cents: r.total_cents as number,
      client_name: Array.isArray(r.clients) ? r.clients[0]?.name : r.clients?.name ?? null,
    }));
  } catch { return []; }
}

export default async function ReservationsPage() {
  const reservations = await getReservations();
  const today = new Date().toISOString().split('T')[0];
  const upcoming = reservations.filter((r) => r.rental_start > today);
  const current = reservations.filter((r) => r.rental_start <= today && r.rental_end >= today);

  return (
    <TierGate feature="equipment">
      <PageHeader title="Reservations" subtitle="Active and upcoming equipment reservations." />
      <RentalsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Active', value: reservations.length },
          { label: 'Current', value: current.length, color: 'text-green-600' },
          { label: 'Upcoming', value: upcoming.length, color: 'text-blue-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {reservations.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No active reservations. Reserved rental orders appear here.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr><th className="px-4 py-3">Order #</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3"><Link href={`/app/rentals/${r.id}`} className="font-medium text-foreground hover:underline">{r.order_number}</Link></td>
                    <td className="px-4 py-3 text-text-secondary">{r.client_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(r.rental_start).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(r.rental_end).toLocaleDateString()}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(r.total_cents / 100)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'on_site' ? 'bg-green-50 text-green-700' : r.status === 'checked_out' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{r.status.replace('_', ' ')}</span></td>
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
