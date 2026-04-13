import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import DispatchHubTabs from '../../DispatchHubTabs';
import Alert from '@/components/ui/Alert';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface RouteItem {
  id: string;
  title: string;
  status: string;
  location_name: string | null;
  location_address: string | null;
  scheduled_start: string | null;
  work_order_assignments: Array<{
    crew_profiles: { full_name: string } | null;
  }>;
}

async function getRoutes() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return { data: [] as RouteItem[], error: null };
    const { data, error } = await supabase
      .from('work_orders')
      .select('id, title, location_name, location_address, scheduled_start, status, work_order_assignments(crew_profiles(full_name))')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .in('status', ['dispatched', 'in_progress'])
      .not('location_name', 'is', null)
      .order('scheduled_start', { ascending: true });

    if (error) return { data: [] as RouteItem[], error: error.message };
    return { data: (data ?? []) as unknown as RouteItem[], error: null };
  } catch {
    return { data: [] as RouteItem[], error: 'Failed to load routes.' };
  }
}

function crewNames(item: RouteItem): string {
  return item.work_order_assignments
    ?.map((a) => a.crew_profiles?.full_name)
    .filter(Boolean)
    .join(', ') || '—';
}

export default async function DispatchRoutesPage() {
  const { data: routes, error } = await getRoutes();
  const uniqueLocations = new Set(routes.map((r) => r.location_name)).size;

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Routes" subtitle="Active dispatch routes and location logistics." />
      <DispatchHubTabs />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <MetricCard label={"Active Dispatches"} value={routes.length} />
        <MetricCard label={"Unique Locations"} value={uniqueLocations} />
        <MetricCard label={"In Progress"} value={routes.filter((r) => r.status === 'in_progress').length} className="[&_.text-foreground]:text-green-600" />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {routes.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No active routes. Dispatched work orders with locations will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Job</TableHead>
                  <TableHead className="px-4 py-3">Location</TableHead>
                  <TableHead className="px-4 py-3">Crew</TableHead>
                  <TableHead className="px-4 py-3">Date</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {routes.map((r) => (
                  <TableRow key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/app/dispatch/${r.id}`} className="hover:underline">{r.title}</Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{r.location_name}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{crewNames(r)}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{r.scheduled_start ? new Date(r.scheduled_start).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={r.status} colorMap={{in_progress: 'bg-purple-50 text-purple-700', dispatched: 'bg-blue-50 text-blue-700', draft: 'bg-blue-50 text-blue-700'}} />
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
