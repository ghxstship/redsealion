import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import StatusBadge, { ADVANCE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import AdvancingHubTabs from '../../AdvancingHubTabs';
import MetricCard from '@/components/ui/MetricCard';

async function getAssignments() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('production_advances')
      .select('id, advance_number, event_name, status, advance_type, line_item_count, service_start_date')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['approved', 'partially_fulfilled'])
      .order('service_start_date', { ascending: true })
      .range(0, 99);

    return (data ?? []) as Array<{
      id: string; advance_number: string; event_name: string | null;
      status: string; advance_type: string; line_item_count: number; service_start_date: string | null;
    }>;
  } catch { return []; }
}

export default async function AdvancingAssignmentsPage() {
  const assignments = await getAssignments();

  const unassigned = assignments.filter((a) => a.status === 'approved');
  const inProgress = assignments.filter((a) => a.status === 'partially_fulfilled');

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Assignments" subtitle="Assign approved advances to crew members and vendors." />
      <AdvancingHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        {[
          { label: 'Total', value: assignments.length },
          { label: 'Awaiting Assignment', value: unassigned.length, color: 'text-yellow-600' },
          { label: 'In Progress', value: inProgress.length, color: 'text-blue-600' },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {assignments.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No approved advances ready for assignment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/advancing/${item.id}`} className="font-medium text-foreground hover:underline">{item.advance_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize">{item.advance_type?.replace('_', ' ') ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{item.line_item_count}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.service_start_date ? new Date(item.service_start_date).toLocaleDateString() : '—'}</td>
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
