import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ClientsHubTabs from '../../ClientsHubTabs';

async function getClientLocations() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('clients')
      .select('id, name, city, state, country, status')
      .eq('organization_id', ctx.organizationId)
      .not('city', 'is', null)
      .order('state', { ascending: true });
    return (data ?? []) as Array<{ id: string; name: string; city: string | null; state: string | null; country: string | null; status: string }>;
  } catch { return []; }
}

export default async function ClientMapPage() {
  const clients = await getClientLocations();
  const byState = clients.reduce((acc, c) => { const k = c.state ?? 'Unknown'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const sortedStates = Object.entries(byState).sort(([, a], [, b]) => b - a);

  return (
    <TierGate feature="clients">
      <PageHeader title="Client Map" subtitle="Geographic distribution of your client base." />
      <ClientsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Clients with Location</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{clients.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">States/Provinces</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{sortedStates.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Top Region</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{sortedStates[0]?.[0] ?? '—'}</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-3">By Region</h3>
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {sortedStates.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No location data available. Add addresses to client records to see geographic distribution.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">State / Province</th>
                  <th className="px-4 py-3">Clients</th>
                  <th className="px-4 py-3">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedStates.map(([state, count]) => (
                  <tr key={state} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{state}</td>
                    <td className="px-4 py-3 tabular-nums">{count}</td>
                    <td className="px-4 py-3">
                      <div className="w-32 h-2 rounded-full bg-bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round((count / clients.length) * 100)}%` }} />
                      </div>
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
