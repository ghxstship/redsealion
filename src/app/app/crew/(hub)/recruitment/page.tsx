import { formatLabel } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';

import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

import { RoleGate } from '@/components/shared/RoleGate';
interface RecruitmentPosition {
  id: string;
  title: string;
  department: string;
  status: 'open' | 'interviewing' | 'offered' | 'filled' | 'closed';
  applicants: number;
  posted_date: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-50 text-green-700',
  interviewing: 'bg-blue-50 text-blue-700',
  offered: 'bg-purple-50 text-purple-700',
  filled: 'bg-bg-secondary text-text-muted',
  closed: 'bg-red-500/10 text-red-700',
};


function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function getPositions(): Promise<RecruitmentPosition[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: positions } = await supabase
      .from('recruitment_positions')
      .select()
      .eq('organization_id', ctx.organizationId)
      .order('posted_date', { ascending: false });

    if (!positions) return [];

    return positions.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      title: (p.title as string) ?? '',
      department: (p.department as string) ?? 'General',
      status: (p.status as RecruitmentPosition['status']) ?? 'open',
      applicants: (p.applicants as number) ?? 0,
      posted_date: p.posted_date as string,
    }));
  } catch {
    return [];
  }
}

export default async function RecruitmentPage() {
  const positions = await getPositions();

  const openCount = positions.filter((p) => p.status === 'open').length;
  const interviewingCount = positions.filter((p) => p.status === 'interviewing').length;
  const totalApplicants = positions.reduce((sum, p) => sum + p.applicants, 0);

  return (
    <RoleGate resource="crew">
    <>
      <PageHeader
        title="Recruitment"
        subtitle={positions.length > 0 ? `${openCount} open positions · ${totalApplicants} total applicants` : 'Manage open positions and track applicants.'}
      />


      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Open Positions</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{openCount}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Interviewing</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{interviewingCount}</p>
        </Card>
        <Card padding="default" className="px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Total Applicants</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{totalApplicants}</p>
        </Card>
      </div>

      {/* Positions table */}
      {positions.length > 0 ? (
        <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary">
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Position</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Department</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Applicants</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Posted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {positions.map((position) => (
                <TableRow key={position.id} className="transition-colors hover:bg-bg-secondary/50">
                  <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground">{position.title}</TableCell>
                  <TableCell className="px-6 py-3.5">
                    <StatusBadge status={position.department} colorMap={{}} className="bg-bg-secondary text-text-secondary" />
                  </TableCell>
                  <TableCell className="px-6 py-3.5">
                    <StatusBadge status={position.status} colorMap={STATUS_COLORS} />
                  </TableCell>
                  <TableCell className="px-6 py-3.5 text-sm tabular-nums text-foreground">{position.applicants}</TableCell>
                  <TableCell className="px-6 py-3.5 text-sm text-text-muted">{formatDate(position.posted_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          message="No open positions"
          description="Create a position to start recruiting."
        />
      )}
    </>
  </RoleGate>
  );
}
