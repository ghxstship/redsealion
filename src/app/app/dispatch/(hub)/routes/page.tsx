import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import DispatchHubTabs from '../../DispatchHubTabs';

async function getRoutes() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('work_orders')
      .select('id, title, location, assigned_to, scheduled_date, status')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['dispatched', 'on_site'])
      .not('location', 'is', null)
      .order('scheduled_date', { ascending: true });
    return (data ?? []) as Array<{ id: string; title: string; location: string | null; assigned_to: string | null; scheduled_date: string | null; status: string }>;
  } catch { return []; }
}

export default async function DispatchRoutesPage() {
  const routes = await getRoutes();
  const uniqueLocations = new Set(routes.map((r) => r.location)).size;

  return (
    <TierGate feature="work_orders">
      <PageHeader title="Routes" subtitle="Active dispatch routes and location logistics." />
      <DispatchHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Active Dispatches</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{routes.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Unique Locations</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{uniqueLocations}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">On Site Now</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{routes.filter((r) => r.status === 'on_site').length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {routes.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No active routes. Dispatched work orders with locations will appear here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Assigned To</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {routes.map((r) => (
                <tr key={r.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{r.title}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.location}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.assigned_to ?? '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'on_site' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>{r.status.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </TierGate>
  );
}
