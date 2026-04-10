import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';

function formatLabel(type: string): string {
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  running: 'bg-blue-50 text-blue-700',
  failed: 'bg-red-50 text-red-700',
  pending: 'bg-yellow-50 text-yellow-700',
  cancelled: 'bg-bg-secondary text-text-secondary',
};

async function getAutomation(id: string) {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();
  if (!ctx) return null;

  const { data } = await supabase
    .from('automations')
    .select('*, automation_runs(id, status, started_at, completed_at, error, trigger_data)')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .is('deleted_at', null)
    .single();

  return data;
}

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const automation = await getAutomation(id);

  if (!automation) notFound();

  const runs = ((automation.automation_runs ?? []) as Array<Record<string, unknown>>)
    .sort((a, b) => new Date(b.started_at as string).getTime() - new Date(a.started_at as string).getTime())
    .slice(0, 20);

  return (
    <TierGate feature="automations">
      <div className="mb-6">
        <Link
          href="/app/automations"
          className="text-sm text-text-secondary hover:text-foreground transition-colors"
        >
          &larr; Back to Automations
        </Link>
      </div>

      <PageHeader
        title={automation.name as string}
        subtitle={automation.description as string || 'No description'}
      >
        <div className="flex gap-2">
          <Button href={`/app/automations/${id}/edit`} variant="secondary">Edit</Button>
        </div>
      </PageHeader>

      {/* Status & Config */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-background p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Configuration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Status</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${automation.is_active ? 'bg-green-100 text-green-800' : 'bg-bg-secondary text-text-muted'}`}>
                {automation.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Trigger</span>
              <span className="text-foreground">{formatLabel(automation.trigger_type as string)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Action</span>
              <span className="text-foreground">{formatLabel(automation.action_type as string)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Version</span>
              <span className="text-foreground">{(automation.version as number) ?? 1}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Statistics</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Total Runs</span>
              <span className="text-foreground tabular-nums">{automation.run_count ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Last Run</span>
              <span className="text-foreground">
                {automation.last_run_at
                  ? new Date(automation.last_run_at as string).toLocaleString()
                  : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Created</span>
              <span className="text-foreground">{new Date(automation.created_at as string).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Config */}
      {automation.trigger_config && Object.keys(automation.trigger_config as object).length > 0 && (
        <div className="rounded-xl border border-border bg-background p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Trigger Configuration</h2>
          <pre className="text-xs bg-bg-secondary rounded-lg p-3 overflow-auto text-text-secondary">
            {JSON.stringify(automation.trigger_config, null, 2)}
          </pre>
        </div>
      )}

      {/* Action Config */}
      {automation.action_config && Object.keys(automation.action_config as object).length > 0 && (
        <div className="rounded-xl border border-border bg-background p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Action Configuration</h2>
          <pre className="text-xs bg-bg-secondary rounded-lg p-3 overflow-auto text-text-secondary">
            {JSON.stringify(automation.action_config, null, 2)}
          </pre>
        </div>
      )}

      {/* Recent Runs */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Runs</h2>
        </div>
        {runs.length === 0 ? (
          <div className="px-8 py-12 text-center">
            <p className="text-sm text-text-secondary">No runs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bg-secondary text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Started</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run) => (
                  <tr key={run.id as string} className="hover:bg-bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[run.status as string] ?? 'bg-bg-secondary text-text-secondary'}`}>
                        {run.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{new Date(run.started_at as string).toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-secondary">{run.completed_at ? new Date(run.completed_at as string).toLocaleString() : '—'}</td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-48 truncate">{(run.error as string) || '—'}</td>
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
