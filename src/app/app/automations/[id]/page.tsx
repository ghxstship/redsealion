import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TierGate } from '@/components/shared/TierGate';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import { formatLabel } from '@/lib/utils';
import StatusBadge, { AUTOMATION_RUN_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';





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
              <StatusBadge status={automation.is_active ? 'active' : 'inactive'} colorMap={{active: 'bg-green-100 text-green-800', inactive: 'bg-bg-secondary text-text-muted'}} />
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
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3">Started</TableHead>
                  <TableHead className="px-4 py-3">Completed</TableHead>
                  <TableHead className="px-4 py-3">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {runs.map((run) => (
                  <TableRow key={run.id as string} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={run.status as string} colorMap={AUTOMATION_RUN_STATUS_COLORS} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{new Date(run.started_at as string).toLocaleString()}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{run.completed_at ? new Date(run.completed_at as string).toLocaleString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-red-600 text-xs max-w-48 truncate">{(run.error as string) || '—'}</TableCell>
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
