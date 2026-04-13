import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency , formatDate } from '@/lib/utils';
import Link from 'next/link';
import RentalsHubTabs from '../../RentalsHubTabs';
import StatusBadge, { RENTAL_ORDER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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
    return (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string, order_number: r.order_number as string, status: r.status as string,
      rental_start: r.rental_start as string, rental_end: r.rental_end as string, total_cents: r.total_cents as number,
      client_name: Array.isArray(r.clients) ? (r.clients as Record<string, unknown>[])[0]?.name as string : (r.clients as Record<string, unknown> | null)?.name as string ?? null,
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
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {reservations.length === 0 ? (
          <div className="px-8 py-16 text-center"><p className="text-sm text-text-secondary">No active reservations. Reserved rental orders appear here.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow><TableHead className="px-4 py-3">Order #</TableHead><TableHead className="px-4 py-3">Client</TableHead><TableHead className="px-4 py-3">Start</TableHead><TableHead className="px-4 py-3">End</TableHead><TableHead className="px-4 py-3">Total</TableHead><TableHead className="px-4 py-3">Status</TableHead></TableRow>
              </TableHeader>
              <TableBody >
                {reservations.map((r) => (
                  <TableRow key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3"><Link href={`/app/rentals/${r.id}`} className="font-medium text-foreground hover:underline">{r.order_number}</Link></TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{r.client_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{formatDate(r.rental_start)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{formatDate(r.rental_end)}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(r.total_cents / 100)}</TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={r.status} colorMap={RENTAL_ORDER_STATUS_COLORS} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
