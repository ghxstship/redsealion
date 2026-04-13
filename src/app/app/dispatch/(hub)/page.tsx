import Link from 'next/link';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { formatLabel } from '@/lib/utils';

import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import StatusBadge, { WORK_ORDER_STATUS_COLORS, PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import PageHeader from '@/components/shared/PageHeader';
import DispatchHubTabs from '../DispatchHubTabs';
import Alert from '@/components/ui/Alert';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';



async function getWorkOrders(): Promise<{ data: Array<Record<string, unknown>>; error: string | null }> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { data: [], error: null };

    const { data, error } = await supabase
      .from('work_orders')
      .select('*, work_order_assignments(crew_profiles(full_name))')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  } catch {
    return { data: [], error: 'Failed to load work orders.' };
  }
}

export default async function DispatchPage() {
  const { data: workOrders, error } = await getWorkOrders();

  const statCounts = {
    draft: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'draft').length,
    dispatched: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'dispatched').length,
    accepted: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'accepted').length,
    in_progress: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'in_progress').length,
    completed: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'completed').length,
    cancelled: workOrders.filter((wo: Record<string, unknown>) => wo.status === 'cancelled').length,
  };

  return (
    <TierGate feature="work_orders">
<PageHeader
        title="Dispatch"
        subtitle="Create and dispatch work orders to your crew."
      >
        <Button href="/app/dispatch/new">New Work Order</Button>
      </PageHeader>

      <DispatchHubTabs />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Object.entries(statCounts).map(([status, count]) => (
          <MetricCard key={status} label={formatLabel(status)} value={count} />
        ))}
      </div>

      {/* Work order list */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {workOrders.length === 0 ? (
          <EmptyState
            message="No work orders yet"
            description="Create your first to start dispatching crew."
            action={
              <Button href="/app/dispatch/new">Create Work Order</Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">WO #</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Title</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Priority</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Crew</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {workOrders.map((wo: Record<string, unknown>) => {
                  const assignments = (wo.work_order_assignments ?? []) as Array<Record<string, unknown>>;
                  const crewNames = assignments
                    .map((a) => (a.crew_profiles as Record<string, string>)?.full_name)
                    .filter(Boolean);
                  return (
                    <TableRow key={wo.id as string} className="transition-colors hover:bg-bg-secondary/50">
                      <TableCell className="px-6 py-3.5 text-sm font-mono text-text-muted">{(wo.wo_number as string) ?? '—'}</TableCell>
                      <TableCell className="px-6 py-3.5">
                        <Link href={`/app/dispatch/${wo.id}`} className="text-sm font-medium text-foreground hover:underline">
                          {wo.title as string}
                        </Link>
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <StatusBadge status={wo.status as string} colorMap={WORK_ORDER_STATUS_COLORS} />
                      </TableCell>
                      <TableCell className="px-6 py-3.5">
                        <StatusBadge status={wo.priority as string} colorMap={PRIORITY_COLORS} />
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                        {crewNames.length > 0 ? crewNames.join(', ') : '—'}
                      </TableCell>
                      <TableCell className="px-6 py-3.5 text-sm text-text-muted">
                        {wo.scheduled_start
                          ? new Date(wo.scheduled_start as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </TierGate>
  );
}
