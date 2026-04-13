import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency , formatDate } from '@/lib/utils';
import Link from 'next/link';
import StatusBadge, { ADVANCE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import AdvancingHubTabs from '../../AdvancingHubTabs';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

async function getFulfillment() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('production_advances')
      .select('id, advance_number, event_name, status, total_cents, service_start_date, service_end_date')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['approved', 'partially_fulfilled', 'fulfilled', 'completed'])
      .order('service_end_date', { ascending: true })
      .range(0, 99);

    return (data ?? []) as Array<{
      id: string; advance_number: string; event_name: string | null;
      status: string; total_cents: number; service_start_date: string | null; service_end_date: string | null;
    }>;
  } catch { return []; }
}

export default async function AdvancingFulfillmentPage() {
  const items = await getFulfillment();

  const inProgress = items.filter((i) => i.status === 'approved' || i.status === 'partially_fulfilled');
  const fulfilled = items.filter((i) => i.status === 'fulfilled' || i.status === 'completed');

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Fulfillment" subtitle="Track delivery and completion of advance orders." />
      <AdvancingHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total', value: items.length },
          { label: 'In Progress', value: inProgress.length, color: 'text-blue-600' },
          { label: 'Fulfilled', value: fulfilled.length, color: 'text-green-600' },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {items.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No advances in the fulfillment pipeline.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Advance</TableHead>
                  <TableHead className="px-4 py-3">Event</TableHead>
                  <TableHead className="px-4 py-3">Amount</TableHead>
                  <TableHead className="px-4 py-3">Start</TableHead>
                  <TableHead className="px-4 py-3">End</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <Link href={`/app/advancing/${item.id}`} className="font-medium text-foreground hover:underline">{item.advance_number}</Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">{formatCurrency(item.total_cents / 100)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.service_start_date ? formatDate(item.service_start_date) : '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.service_end_date ? formatDate(item.service_end_date) : '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={item.status} colorMap={ADVANCE_STATUS_COLORS} />
                    </TableCell>
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
