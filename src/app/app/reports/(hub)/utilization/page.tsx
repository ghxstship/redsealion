import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import ReportsHubTabs from '../../ReportsHubTabs';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface UtilizationRow {
  userId: string;
  userName: string;
  role: string | null;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  utilizationPercent: number;
  capacity: number;
}

async function getUtilizationData(): Promise<UtilizationRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const orgId = ctx.organizationId;

    // Get all team members
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('organization_id', orgId)
      .not('role', 'in', '("client","contractor","crew","viewer")');

    if (!users || users.length === 0) return [];

    // Get time entries for the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const { data: entries } = await supabase
      .from('time_entries')
      .select('user_id, duration_minutes, is_billable')
      .eq('organization_id', orgId)
      .gte('start_time', monthStart)
      .lte('start_time', monthEnd);

    // Aggregate by user
    const hoursMap = new Map<string, { billable: number; nonBillable: number }>();
    for (const entry of entries ?? []) {
      const userId = entry.user_id;
      const hours = (entry.duration_minutes ?? 0) / 60;
      const current = hoursMap.get(userId) ?? { billable: 0, nonBillable: 0 };
      if (entry.is_billable) {
        current.billable += hours;
      } else {
        current.nonBillable += hours;
      }
      hoursMap.set(userId, current);
    }

    // Calculate business days in current month
    const businessDays = getBusinessDaysInMonth(now.getFullYear(), now.getMonth());
    const monthlyCapacity = businessDays * 8; // 8 hours per day

    return users.map((u) => {
      const hours = hoursMap.get(u.id) ?? { billable: 0, nonBillable: 0 };
      const totalHours = hours.billable + hours.nonBillable;
      const utilizationPercent = monthlyCapacity > 0
        ? Math.round((hours.billable / monthlyCapacity) * 100)
        : 0;

      return {
        userId: u.id,
        userName: u.full_name,
        role: u.role,
        totalHours: Math.round(totalHours * 10) / 10,
        billableHours: Math.round(hours.billable * 10) / 10,
        nonBillableHours: Math.round(hours.nonBillable * 10) / 10,
        utilizationPercent,
        capacity: monthlyCapacity,
      };
    }).sort((a, b) => b.utilizationPercent - a.utilizationPercent);
  } catch {
    return [];
  }
}

function getBusinessDaysInMonth(year: number, month: number): number {
  const d = new Date(year, month, 1);
  let count = 0;
  while (d.getMonth() === month) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function utilizationColor(percent: number): string {
  if (percent >= 90) return 'text-red-600 bg-red-500/10';
  if (percent >= 70) return 'text-green-600 bg-green-50';
  if (percent >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-text-muted bg-bg-secondary';
}

function barColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-green-500';
  if (percent >= 50) return 'bg-yellow-500';
  return 'bg-text-muted';
}

export default async function UtilizationReportPage() {
  const rows = await getUtilizationData();
  const avgUtilization = rows.length > 0
    ? Math.round(rows.reduce((s, r) => s + r.utilizationPercent, 0) / rows.length)
    : 0;
  const totalBillable = rows.reduce((s, r) => s + r.billableHours, 0);
  const totalNonBillable = rows.reduce((s, r) => s + r.nonBillableHours, 0);

  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <TierGate feature="profitability">
      <PageHeader title="Utilization Report" subtitle={`Billable vs non-billable hours for ${monthName}.`} />

      <ReportsHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Avg Utilization</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{avgUtilization}%</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Team Members</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{rows.length}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Billable Hours</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-green-600">{totalBillable.toFixed(1)}h</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Non-Billable</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-text-secondary">{totalNonBillable.toFixed(1)}h</p>
        </Card>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No utilization data for this period.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table >
              <TableHeader>
                <TableRow className="border-b border-border bg-bg-secondary">
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Team Member</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Role</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Billable</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Non-Bill.</TableHead>
                  <TableHead className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-text-muted">Total</TableHead>
                  <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted min-w-[200px]">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody >
                {rows.map((r) => (
                  <TableRow key={r.userId} className="transition-colors hover:bg-bg-secondary/50">
                    <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{r.userName}</TableCell>
                    <TableCell className="px-6 py-3.5 text-sm text-text-secondary capitalize">{r.role?.replace(/_/g, ' ') ?? '—'}</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-green-600">{r.billableHours}h</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-text-secondary">{r.nonBillableHours}h</TableCell>
                    <TableCell className="px-6 py-3.5 text-right text-sm tabular-nums text-foreground">{r.totalHours}h</TableCell>
                    <TableCell className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor(r.utilizationPercent)} transition-all`}
                            style={{ width: `${Math.min(r.utilizationPercent, 100)}%` }}
                          />
                        </div>
                        <Badge
                          variant={r.utilizationPercent >= 90 ? 'error' : r.utilizationPercent >= 70 ? 'success' : r.utilizationPercent >= 50 ? 'warning' : 'muted'}
                          className="min-w-[3rem] justify-center"
                        >
                          {r.utilizationPercent}%
                        </Badge>
                      </div>
                    </TableCell>
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
