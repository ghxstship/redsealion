import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import AdvancingHubTabs from '../../AdvancingHubTabs';

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
          <div key={stat.label} className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color ?? 'text-foreground'}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {items.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No advances in the fulfillment pipeline.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Advance</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/advancing/${item.id}`} className="font-medium text-foreground hover:underline">{item.advance_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(item.total_cents / 100)}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.service_start_date ? new Date(item.service_start_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.service_end_date ? new Date(item.service_end_date).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${item.status === 'fulfilled' || item.status === 'completed' ? 'bg-green-50 text-green-700' : item.status === 'partially_fulfilled' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
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
