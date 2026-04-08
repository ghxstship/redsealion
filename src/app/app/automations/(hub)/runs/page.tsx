import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import AutomationsHubTabs from '../../AutomationsHubTabs';

async function getRuns() {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];
    const { data } = await supabase
      .from('automations')
      .select('id, name, trigger_type, status, last_run_at, run_count')
      .eq('organization_id', ctx.organizationId)
      .not('last_run_at', 'is', null)
      .order('last_run_at', { ascending: false });
    return (data ?? []) as Array<{ id: string; name: string; trigger_type: string; status: string; last_run_at: string | null; run_count: number }>;
  } catch { return []; }
}

export default async function AutomationRunsPage() {
  const runs = await getRuns();
  const totalRuns = runs.reduce((s, r) => s + (r.run_count ?? 0), 0);

  return (
    <TierGate feature="automations">
      <PageHeader title="Automation Runs" subtitle="Execution history and logs for all workflows." />
      <AutomationsHubTabs />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Automations with Runs</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{runs.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Total Executions</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{totalRuns}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Active</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-600">{runs.filter((r) => r.status === 'active').length}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {runs.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">No automation runs recorded yet. Create and activate an automation to see execution history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Automation</th>
                  <th className="px-4 py-3">Trigger</th>
                  <th className="px-4 py-3">Runs</th>
                  <th className="px-4 py-3">Last Run</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{run.name}</td>
                    <td className="px-4 py-3 text-text-secondary capitalize">{run.trigger_type?.replace('_', ' ') ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{run.run_count ?? 0}</td>
                    <td className="px-4 py-3 text-text-secondary">{run.last_run_at ? new Date(run.last_run_at).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${run.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-bg-secondary text-gray-700'}`}>{run.status}</span>
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
