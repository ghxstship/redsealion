import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import StatusBadge, { ADVANCE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import AdvancingHubTabs from '../../AdvancingHubTabs';
import MetricCard from '@/components/ui/MetricCard';

async function getAllocations() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { advances: [], totalAllocated: 0 };

    const { data } = await supabase
      .from('production_advances')
      .select('id, advance_number, event_name, status, total_cents, line_item_count')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['approved', 'partially_fulfilled', 'fulfilled', 'completed'])
      .order('created_at', { ascending: false })
      .range(0, 99);

    const advances = (data ?? []) as Array<{
      id: string; advance_number: string; event_name: string | null;
      status: string; total_cents: number; line_item_count: number;
    }>;

    const totalAllocated = advances.reduce((sum, a) => sum + a.total_cents, 0);
    return { advances, totalAllocated };
  } catch { return { advances: [], totalAllocated: 0 }; }
}

export default async function AdvancingAllocationsPage() {
  const { advances, totalAllocated } = await getAllocations();

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Allocations" subtitle="Budget and resource allocations across active advances." />
      <AdvancingHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Active Advances"} value={advances.length} />
        <MetricCard label={"Total Allocated"} value={formatCurrency(totalAllocated / 100)} />
        <MetricCard label={"Total Line Items"} value={advances.reduce((sum, a) => sum + a.line_item_count, 0)} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {advances.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No advances with budget allocations yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Advance</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Allocated</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {advances.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/advancing/${item.id}`} className="font-medium text-foreground hover:underline">{item.advance_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{item.line_item_count}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(item.total_cents / 100)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} colorMap={ADVANCE_STATUS_COLORS} />
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
