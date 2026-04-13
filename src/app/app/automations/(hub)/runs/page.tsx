import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import StatusBadge, { AUTOMATION_RUN_STATUS_COLORS } from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface RunRow {
  id: string;
  automation_name: string | null;
  status: string;
  trigger_data: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
  error: string | null;
}

async function getRuns(): Promise<RunRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('automation_runs')
      .select('id, status, trigger_data, started_at, completed_at, error, automations(name)')
      .eq('organization_id', ctx.organizationId)
      .order('started_at', { ascending: false })
      .limit(100);

    if (!data) return [];

    return data.map((row: Record<string, unknown>) => {
      const automation = row.automations as { name: string } | null;
      return {
        id: row.id as string,
        automation_name: automation?.name ?? null,
        status: (row.status as string) ?? 'unknown',
        trigger_data: (row.trigger_data as Record<string, unknown>) ?? null,
        started_at: row.started_at as string,
        completed_at: (row.completed_at as string) ?? null,
        error: (row.error as string) ?? null,
      };
    });
  } catch {
    return [];
  }
}



export default async function AutomationRunsPage() {
  const runs = await getRuns();
  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.status === 'completed').length;
  const failedRuns = runs.filter((r) => r.status === 'failed').length;

  return (
    <TierGate feature="automations">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <MetricCard label={"Total Runs"} value={totalRuns} />
        <MetricCard label={"Completed"} value={completedRuns} className="[&_.text-foreground]:text-green-600" />
        <MetricCard label={"Failed"} value={failedRuns} className="[&_.text-foreground]:text-red-600" />
        <MetricCard label={"Success Rate"} value={`${totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0}%`} />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        {runs.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="text-sm text-text-secondary">
              No automation runs recorded yet. Create and activate an automation to see execution history.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  <TableHead className="px-4 py-3">Automation</TableHead>
                  <TableHead className="px-4 py-3">Status</TableHead>
                  <TableHead className="px-4 py-3">Started</TableHead>
                  <TableHead className="px-4 py-3">Completed</TableHead>
                  <TableHead className="px-4 py-3">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {runs.map((run) => (
                  <TableRow key={run.id} className="hover:bg-bg-secondary/50 transition-colors">
                    <TableCell className="px-4 py-3 font-medium text-foreground">{run.automation_name ?? '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={run.status} colorMap={AUTOMATION_RUN_STATUS_COLORS} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{new Date(run.started_at).toLocaleString()}</TableCell>
                    <TableCell className="px-4 py-3 text-text-secondary">{run.completed_at ? new Date(run.completed_at).toLocaleString() : '—'}</TableCell>
                    <TableCell className="px-4 py-3 text-red-600 text-xs max-w-48 truncate">{run.error || '—'}</TableCell>
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
