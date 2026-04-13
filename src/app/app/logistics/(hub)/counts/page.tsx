import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import LogisticsHubTabs from "../../LogisticsHubTabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

const COUNT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-bg-secondary text-text-secondary',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-500/10 text-red-700',
};

const COUNT_TYPE_COLORS: Record<string, string> = {
  full: 'bg-purple-50 text-purple-700',
  cycle: 'bg-blue-50 text-blue-700',
  spot: 'bg-amber-50 text-amber-700',
};

interface CountRow {
  id: string;
  count_type: string;
  status: string;
  location: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  line_count: number;
}

async function getCounts(): Promise<CountRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: counts } = await supabase
      .from('inventory_counts')
      .select('id, count_type, status, location, started_at, completed_at, created_at')
      .eq('organization_id', ctx.organizationId)
      .order('created_at', { ascending: false });

    if (!counts) return [];

    // Get line counts
    const ids = counts.map((c) => c.id);
    const { data: lineData } = ids.length > 0
      ? await supabase
          .from('inventory_count_lines')
          .select('count_id')
          .in('count_id', ids)
      : { data: [] };

    const lineCounts = new Map<string, number>();
    for (const l of lineData ?? []) {
      lineCounts.set(l.count_id, (lineCounts.get(l.count_id) ?? 0) + 1);
    }

    return counts.map((c) => ({
      ...c,
      line_count: lineCounts.get(c.id) ?? 0,
    }));
  } catch {
    return [];
  }
}

export default async function InventoryCountsPage() {
  const counts = await getCounts();
  const active = counts.filter((c) => c.status !== 'completed' && c.status !== 'cancelled');
  const completed = counts.filter((c) => c.status === 'completed');

  return (
    <>
      <PageHeader
        title="Inventory Counts"
        subtitle={`${active.length} active · ${completed.length} completed`}
      />

      <LogisticsHubTabs />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Counts</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">{counts.length}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">In Progress</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {counts.filter((c) => c.status === 'in_progress').length}
          </p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Items Counted</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {counts.reduce((sum, c) => sum + c.line_count, 0)}
          </p>
        </Card>
      </div>

      {counts.length === 0 ? (
        <EmptyState
          message="No inventory counts yet"
          description="Start a physical inventory count to verify asset quantities and conditions."
        />
      ) : (
        <div className="space-y-8">
          {/* Active counts */}
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4">Active Counts</h2>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                  <Table >
                    <TableHeader>
                      <TableRow className="border-b border-border bg-bg-secondary">
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Items</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Started</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
                        <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted" />
                      </TableRow>
                    </TableHeader>
                    <TableBody >
                      {active.map((count) => (
                        <TableRow key={count.id} className="transition-colors hover:bg-bg-secondary/50">
                          <TableCell className="px-6 py-3.5">
                            <StatusBadge status={count.count_type} colorMap={COUNT_TYPE_COLORS} />
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-foreground">{count.location ?? 'All locations'}</TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-foreground tabular-nums">{count.line_count}</TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                            {count.started_at ? formatDate(count.started_at) : '—'}
                          </TableCell>
                          <TableCell className="px-6 py-3.5">
                            <StatusBadge status={count.status} colorMap={COUNT_STATUS_COLORS} />
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-right">
                            <Link
                              href={`/app/logistics/counts/${count.id}`}
                              className="text-sm font-medium text-foreground hover:underline"
                            >
                              Open →
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Completed counts */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-4">Completed</h2>
              <div className="rounded-xl border border-border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                  <Table >
                    <TableHeader>
                      <TableRow className="border-b border-border bg-bg-secondary">
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Type</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Location</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Items</TableHead>
                        <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody >
                      {completed.map((count) => (
                        <TableRow key={count.id} className="transition-colors hover:bg-bg-secondary/50">
                          <TableCell className="px-6 py-3.5">
                            <StatusBadge status={count.count_type} colorMap={COUNT_TYPE_COLORS} />
                          </TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-foreground">{count.location ?? 'All'}</TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-foreground tabular-nums">{count.line_count}</TableCell>
                          <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                            {count.completed_at ? formatDate(count.completed_at) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
