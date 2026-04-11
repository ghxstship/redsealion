import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import StatusBadge, { ADVANCE_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import AdvancingHubTabs from '../../AdvancingHubTabs';
import MetricCard from '@/components/ui/MetricCard';

async function getApprovals() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('production_advances')
      .select('id, advance_number, event_name, status, priority, total_cents, created_at')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['submitted', 'under_review', 'approved', 'rejected'])
      .order('created_at', { ascending: false })
      .range(0, 99);

    return (data ?? []) as Array<{
      id: string; advance_number: string; event_name: string | null;
      status: string; priority: string; total_cents: number; created_at: string;
    }>;
  } catch { return []; }
}

export default async function AdvancingApprovalsPage() {
  const approvals = await getApprovals();

  const pending = approvals.filter((a) => a.status === 'submitted' || a.status === 'under_review');
  const approved = approvals.filter((a) => a.status === 'approved');
  const rejected = approvals.filter((a) => a.status === 'rejected');

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Approvals" subtitle="Review, approve, or reject pending advance requests." />
      <AdvancingHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: 'Total', value: approvals.length },
          { label: 'Pending', value: pending.length, color: 'text-yellow-600' },
          { label: 'Approved', value: approved.length, color: 'text-green-600' },
          { label: 'Rejected', value: rejected.length, color: 'text-red-600' },
        ].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} className={stat.color ? `[&_.text-foreground]:${stat.color}` : ''} />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {approvals.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No advances requiring approval at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {approvals.map((item) => (
                  <tr key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/app/advancing/${item.id}`} className="font-medium text-foreground hover:underline">{item.advance_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{item.event_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.priority} colorMap={TASK_PRIORITY_COLORS} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} colorMap={ADVANCE_STATUS_COLORS} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(item.total_cents / 100)}</td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(item.created_at).toLocaleDateString()}</td>
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
