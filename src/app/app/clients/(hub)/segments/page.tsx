import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ClientsHubTabs from '../../ClientsHubTabs';

async function getSegments() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('clients')
      .select('id, name, industry, status, city, state')
      .eq('organization_id', ctx.organizationId)
      .order('name', { ascending: true });
    return (data ?? []) as Array<{ id: string; name: string; industry: string | null; status: string; city: string | null; state: string | null }>;
  } catch { return []; }
}

export default async function ClientSegmentsPage() {
  const clients = await getSegments();
  const industries = clients.reduce((acc, c) => { const k = c.industry ?? 'Unclassified'; acc[k] = (acc[k] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const statuses = clients.reduce((acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const sortedIndustries = Object.entries(industries).sort(([, a], [, b]) => b - a);

  return (
    <TierGate feature="clients">
      <PageHeader title="Client Segments" subtitle="Analyze your client base by industry, status, and location." />
      <ClientsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-text-muted">Total Clients</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{clients.length}</p>
        </div>
        {Object.entries(statuses).slice(0, 3).map(([status, count]) => (
          <div key={status} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs text-text-muted capitalize">{status}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{count}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-3">By Industry</h3>
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {sortedIndustries.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No clients with industry data. Update client profiles to enable segmentation.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedIndustries.map(([industry, count]) => (
              <div key={industry} className="px-5 py-3 flex items-center justify-between">
                <p className="text-sm text-foreground">{industry}</p>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.round((count / clients.length) * 100)}%` }} />
                  </div>
                  <p className="text-sm font-medium tabular-nums text-foreground w-8 text-right">{count}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TierGate>
  );
}
