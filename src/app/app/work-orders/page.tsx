import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import StatusBadge, { WORK_ORDER_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface WorkOrderRow {
  id: string;
  wo_number: string;
  title: string;
  status: string;
  priority: string;
  location_name: string | null;
  scheduled_start: string | null;
  crew_count: number;
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
};

async function getWorkOrders(): Promise<WorkOrderRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('work_orders')
      .select('id, wo_number, title, status, priority, location_name, scheduled_start, created_at, work_order_assignments(id)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200);

    return (data ?? []).map((wo: Record<string, unknown>) => ({
      id: wo.id as string,
      wo_number: wo.wo_number as string,
      title: wo.title as string,
      status: wo.status as string,
      priority: wo.priority as string,
      location_name: wo.location_name as string | null,
      scheduled_start: wo.scheduled_start as string | null,
      crew_count: Array.isArray(wo.work_order_assignments) ? (wo.work_order_assignments as unknown[]).length : 0,
      created_at: wo.created_at as string,
    }));
  } catch {
    return [];
  }
}

export default async function WorkOrdersListPage() {
  const workOrders = await getWorkOrders();
  const active = workOrders.filter((wo) => ['dispatched', 'accepted', 'in_progress'].includes(wo.status)).length;
  const completed = workOrders.filter((wo) => wo.status === 'completed').length;

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Work Orders" subtitle={`${workOrders.length} work orders`}>
        <Link href="/app/work-orders/new" className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity whitespace-nowrap">
          New Work Order
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <MetricCard label="Total" value={workOrders.length} />
        <MetricCard label="Active" value={active} className="[&_.text-foreground]:text-blue-600" />
        <MetricCard label="Completed" value={completed} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label="Draft" value={workOrders.filter((wo) => wo.status === 'draft').length} />
      </div>

      {workOrders.length >= 200 && (
        <p className="text-xs text-text-muted mb-4">Showing first 200 of {workOrders.length}+ work orders.</p>
      )}

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {workOrders.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No work orders yet. Create one to start tracking field operations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">WO #</TableHead>
                  <TableHead className="px-4 py-3">Title</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3">Priority</TableHead>
                  <TableHead className="px-4 py-3">Location</TableHead>
                  <TableHead className="px-4 py-3">Crew</TableHead>
                  <TableHead className="px-4 py-3">Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {workOrders.map((wo) => (
                  <TableRow key={wo.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <Link href={`/app/work-orders/${wo.id}`} className="font-medium text-foreground hover:underline">
                        {wo.wo_number}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-foreground max-w-[200px] truncate">{wo.title}</TableCell>
                    <TableCell className="px-4 py-3"><StatusBadge status={wo.status} colorMap={WORK_ORDER_STATUS_COLORS} /></TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={`font-medium capitalize ${PRIORITY_COLORS[wo.priority] ?? ''}`}>{wo.priority}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{wo.location_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 tabular-nums text-text-secondary">{wo.crew_count}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary text-xs">
                      {wo.scheduled_start ? formatDate(wo.scheduled_start) : '—'}
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
