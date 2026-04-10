import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import Link from 'next/link';
import DispatchHubTabs from '../../DispatchHubTabs';

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
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Active Dispatches</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{routes.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Unique Locations</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{uniqueLocations}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">In Progress</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{routes.filter((r) => r.status === 'in_progress').length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {routes.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No active routes. Dispatched work orders with locations will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Crew</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {routes.map((r) => (
                  <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/app/dispatch/${r.id}`} className="hover:underline">{r.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{r.location_name}</td>
                    <td className="px-4 py-3 text-text-secondary">{crewNames(r)}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.scheduled_start ? new Date(r.scheduled_start).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'in_progress' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {r.status === 'in_progress' ? 'In Progress' : 'Dispatched'}
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
