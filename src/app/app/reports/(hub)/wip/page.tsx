import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import Card from '@/components/ui/Card';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface WipRow {
  projectId: string;
  projectName: string;
  clientName: string | null;
  totalBilled: number;
  totalCost: number;
  unbilledTimeValue: number;
  unbilledExpenses: number;
  wipBalance: number;
}

async function getWipData(): Promise<WipRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const orgId = ctx.organizationId;

    // Get active proposals (in production or active)
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, client_id, total_value')
      .eq('organization_id', orgId)
      .in('status', ['in_production', 'active']);

    if (!proposals || proposals.length === 0) return [];

    // Get client names
    const clientIds = [...new Set(proposals.map((p) => p.client_id))];
    const { data: clients } = await supabase
      .from('clients')
      .select('id, company_name')
      .in('id', clientIds);
    const clientMap = new Map((clients ?? []).map((c) => [c.id, c.company_name]));

    // Get invoice totals per proposal
    const proposalIds = proposals.map((p) => p.id);
    const { data: invoices } = await supabase
      .from('invoices')
      .select('proposal_id, amount_paid')
      .in('proposal_id', proposalIds)
      .in('status', ['paid', 'partially_paid']);

    const billedMap = new Map<string, number>();
    for (const inv of invoices ?? []) {
      const pid = inv.proposal_id;
      billedMap.set(pid, (billedMap.get(pid) ?? 0) + inv.amount_paid);
    }

    // Get time entry costs per proposal (with user_id for rate cascade)
    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('proposal_id, duration_minutes, hourly_rate, is_billable, user_id')
      .in('proposal_id', proposalIds)
      .eq('is_approved', true);

    // Build crew rate map for entries missing hourly_rate
    const crewUserIds = [...new Set(
      (timeEntries ?? [])
        .filter((te) => !te.hourly_rate)
        .map((te) => (te as Record<string, unknown>).user_id as string)
        .filter(Boolean)
    )];
    const crewRateMap = new Map<string, number>();
    if (crewUserIds.length > 0) {
      const { data: crewProfiles } = await supabase
        .from('crew_profiles')
        .select('user_id, hourly_rate')
        .in('user_id', crewUserIds);
      for (const cp of crewProfiles ?? []) {
        if (cp.hourly_rate) crewRateMap.set(cp.user_id, cp.hourly_rate);
      }
    }

    const timeValueMap = new Map<string, { billed: number; unbilled: number }>();
    for (const te of timeEntries ?? []) {
      const pid = te.proposal_id as string;
      const hours = (te.duration_minutes ?? 0) / 60;
      const userId = (te as Record<string, unknown>).user_id as string | null;
      const rate = te.hourly_rate ?? (userId ? (crewRateMap.get(userId) ?? 0) : 0);
      const value = hours * rate;
      const current = timeValueMap.get(pid) ?? { billed: 0, unbilled: 0 };
      if (te.is_billable) {
        current.unbilled += value;
      } else {
        current.billed += value;
      }
      timeValueMap.set(pid, current);
    }

    // Get expenses per proposal
    const { data: expenses } = await supabase
      .from('expenses')
      .select('proposal_id, amount, status')
      .in('proposal_id', proposalIds)
      .eq('status', 'approved');

    const expenseMap = new Map<string, number>();
    for (const exp of expenses ?? []) {
      const pid = exp.proposal_id as string;
      expenseMap.set(pid, (expenseMap.get(pid) ?? 0) + exp.amount);
    }

    // Get project costs
    const { data: costs } = await supabase
      .from('project_costs')
      .select('proposal_id, amount')
      .in('proposal_id', proposalIds);

    const costMap = new Map<string, number>();
    for (const c of costs ?? []) {
      costMap.set(c.proposal_id, (costMap.get(c.proposal_id) ?? 0) + c.amount);
    }

    return proposals.map((p) => {
      const totalBilled = billedMap.get(p.id) ?? 0;
      const totalCost = costMap.get(p.id) ?? 0;
      const timeData = timeValueMap.get(p.id) ?? { billed: 0, unbilled: 0 };
      const unbilledExpenses = expenseMap.get(p.id) ?? 0;
      const wipBalance = timeData.unbilled + unbilledExpenses;

      return {
        projectId: p.id,
        projectName: p.name,
        clientName: clientMap.get(p.client_id) ?? null,
        totalBilled,
        totalCost,
        unbilledTimeValue: timeData.unbilled,
        unbilledExpenses,
        wipBalance,
      };
    });
  } catch {
    return [];
  }
}

export default async function WipReportPage() {
  const rows = await getWipData();
  const totalWip = rows.reduce((s, r) => s + r.wipBalance, 0);
  const totalBilled = rows.reduce((s, r) => s + r.totalBilled, 0);
  const totalCost = rows.reduce((s, r) => s + r.totalCost, 0);

  return (
    <TierGate feature="profitability">
      <PageHeader title="Work in Progress (WIP)" subtitle="Unbilled time and expenses by active project." />

      <ReportsHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total WIP</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-orange-600">{formatCurrency(totalWip)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Billed</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-green-600">{formatCurrency(totalBilled)}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Cost</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(totalCost)}</p>
        </Card>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No active projects with WIP data.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table >
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Project</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Client</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Billed</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Cost</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Unbilled Time</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Unbilled Exp.</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">WIP Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {rows.map((r) => (
                  <TableRow key={r.projectId} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{r.projectName}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{r.clientName ?? '—'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-green-600">{formatCurrency(r.totalBilled)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(r.totalCost)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-text-secondary">{formatCurrency(r.unbilledTimeValue)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-text-secondary">{formatCurrency(r.unbilledExpenses)}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-orange-600">{formatCurrency(r.wipBalance)}</TableCell>
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
