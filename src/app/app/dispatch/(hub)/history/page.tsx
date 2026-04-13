import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import DispatchHubTabs from '../../DispatchHubTabs';
import Alert from '@/components/ui/Alert';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface HistoryItem {
  id: string;
  title: string;
  status: string;
  location_name: string | null;
  scheduled_start: string | null;
  completed_at: string | null;
  work_order_assignments: Array<{
    crew_profiles: { full_name: string } | null;
  }>;
}

async function getHistory() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { data: [] as HistoryItem[], error: null };
    const { data, error } = await supabase
      .from('work_orders')
      .select('id, title, status, location_name, scheduled_start, completed_at, work_order_assignments(crew_profiles(full_name))')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50);

    if (error) return { data: [] as HistoryItem[], error: error.message };
    return { data: (data ?? []) as unknown as HistoryItem[], error: null };
  } catch {
    return { data: [] as HistoryItem[], error: 'Failed to load history.' };
  }
}

function crewNames(item: HistoryItem): string {
  return item.work_order_assignments
    ?.map((a) => a.crew_profiles?.full_name)
    .filter(Boolean)
    .join(', ') || '—';
}

export default async function DispatchHistoryPage() {
  const { data: history, error } = await getHistory();

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Dispatch History" subtitle="Completed dispatches and performance records." />
      <DispatchHubTabs />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 mb-8">
        <MetricCard label={"Completed Dispatches"} value={history.length} />
        <MetricCard label={"Unique Locations Served"} value={new Set(history.map((h) => h.location_name).filter(Boolean)).size} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {history.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No completed dispatches yet. History populates as work orders are completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Job</TableHead>
                  <TableHead className="px-4 py-3">Location</TableHead>
                  <TableHead className="px-4 py-3">Crew</TableHead>
                  <TableHead className="px-4 py-3">Scheduled</TableHead>
                  <TableHead className="px-4 py-3">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {history.map((item) => (
                  <TableRow key={item.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/app/dispatch/${item.id}`} className="hover:underline">{item.title}</Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.location_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{crewNames(item)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.scheduled_start ? formatDate(item.scheduled_start) : '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{item.completed_at ? formatDate(item.completed_at) : '—'}</TableCell>
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
