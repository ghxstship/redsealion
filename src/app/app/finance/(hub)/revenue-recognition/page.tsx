import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import FinanceHubTabs from '../../FinanceHubTabs';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import RecordRecognitionButton from './RecordRecognitionButton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface RevRecRow {
  id: string;
  projectName: string;
  periodStart: string;
  periodEnd: string;
  recognized: number;
  deferred: number;
  method: string;
}

async function getRevRecData(): Promise<RevRecRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const { data } = await supabase
      .from('revenue_recognition')
      .select('id, proposal_id, period_start, period_end, recognized_amount, deferred_amount, method')
      .eq('organization_id', ctx.organizationId)
      .order('period_start', { ascending: false })
      .limit(20);

    if (!data || data.length === 0) return [];

    const proposalIds = [...new Set(data.map((r) => r.proposal_id))];
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name')
      .in('id', proposalIds);

    const nameMap = new Map((proposals ?? []).map((p) => [p.id, p.name]));

    return data.map((r) => ({
      id: r.id,
      projectName: nameMap.get(r.proposal_id) ?? 'Unknown',
      periodStart: r.period_start,
      periodEnd: r.period_end,
      recognized: r.recognized_amount,
      deferred: r.deferred_amount,
      method: r.method,
    }));
  } catch {
    return [];
  }
}

export default async function RevenueRecognitionPage() {
  const rows = await getRevRecData();
  const totalRecognized = rows.reduce((s, r) => s + r.recognized, 0);
  const totalDeferred = rows.reduce((s, r) => s + r.deferred, 0);

  return (
    <TierGate feature="profitability">
      <PageHeader title="Revenue Recognition" subtitle="Track recognized vs. deferred revenue across projects.">
        <RecordRecognitionButton />
      </PageHeader>

      <FinanceHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Recognized</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-green-600">{formatCurrency(totalRecognized)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Deferred</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalDeferred)}</p>
        </Card>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          message="No revenue recognition entries yet"
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table >
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Period</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Method</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Recognized</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Deferred</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {rows.map((r) => (
                  <TableRow key={r.id} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{r.projectName}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                      {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary capitalize">{r.method.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-green-600">{formatCurrency(r.recognized)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(r.deferred)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
