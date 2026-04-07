import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';

import EmptyState from '@/components/ui/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  dispatched: 'bg-blue-50 text-blue-700',
  accepted: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-50 text-blue-700',
  high: 'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
};

function formatLabel(s: string): string {
  return s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function getWorkOrders() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('work_orders')
      .select('*, work_order_assignments(crew_profiles(full_name))')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    return data ?? [];
  } catch {
    return [];
  }
}

export default async function DispatchPage() {
  const workOrders = await getWorkOrders();

  const statCounts = {
    draft: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'draft').length,
    dispatched: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'dispatched').length,
    in_progress: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'in_progress').length,
    completed: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'completed').length,
  };

  return (
    <TierGate feature="work_orders">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dispatch</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Create and dispatch work orders to your crew.
          </p>
        </div>
        <Link
          href="/app/dispatch/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          New Work Order
        </Link>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Object.entries(statCounts).map(([status, count]) => (
          <div key={status} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted">{formatLabel(status)}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{count}</p>
          </div>
        ))}
      </div>

      {/* Work order list */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {workOrders.length === 0 ? (
          <EmptyState
            message="No work orders yet"
            description="Create your first to start dispatching crew."
            action={
              <Link
                href="/app/dispatch/new"
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Create Work Order
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">WO #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Crew</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Scheduled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workOrders.map((wo: Record<string, unknown>) => {
                  const assignments = (wo.work_order_assignments ?? []) as Array<Record<string, unknown>>;
                  const crewNames = assignments
                    .map((a) => (a.crew_profiles as Record<string, string>)?.full_name)
                    .filter(Boolean);
                  return (
                    <tr key={wo.id as string} className="transition-colors hover:bg-bg-secondary/50">
                      <td className="px-6 py-3.5 text-sm font-mono text-text-muted">{wo.wo_number as string}</td>
                      <td className="px-6 py-3.5">
                        <Link href={`/app/dispatch/${wo.id}`} className="text-sm font-medium text-foreground hover:underline">
                          {wo.title as string}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[(wo.status as string)] ?? STATUS_COLORS.draft}`}>
                          {formatLabel(wo.status as string)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[(wo.priority as string)] ?? PRIORITY_COLORS.medium}`}>
                          {formatLabel(wo.priority as string)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-secondary">
                        {crewNames.length > 0 ? crewNames.join(', ') : '—'}
                      </td>
                      <td className="px-6 py-3.5 text-sm text-text-muted">
                        {wo.scheduled_start
                          ? new Date(wo.scheduled_start as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
