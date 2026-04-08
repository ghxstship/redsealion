import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import CrewHubTabs from '../../CrewHubTabs';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

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
  filled: 'bg-gray-100 text-gray-600',
  closed: 'bg-red-50 text-red-700',
};

const fallbackPositions: RecruitmentPosition[] = [
  { id: 'pos_001', title: 'Senior Lighting Designer', department: 'Lighting', status: 'open', applicants: 12, posted_date: '2026-03-15' },
  { id: 'pos_002', title: 'Audio Engineer', department: 'Audio', status: 'interviewing', applicants: 8, posted_date: '2026-03-01' },
  { id: 'pos_003', title: 'Stage Manager', department: 'Production', status: 'offered', applicants: 5, posted_date: '2026-02-20' },
  { id: 'pos_004', title: 'LED Technician', department: 'Video', status: 'open', applicants: 3, posted_date: '2026-03-28' },
  { id: 'pos_005', title: 'Rigging Supervisor', department: 'Rigging', status: 'filled', applicants: 14, posted_date: '2026-01-10' },
];

function formatLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function RecruitmentPage() {
  // In production this would fetch from a recruitment table
  const positions = fallbackPositions;

  const openCount = positions.filter((p) => p.status === 'open').length;
  const interviewingCount = positions.filter((p) => p.status === 'interviewing').length;
  const totalApplicants = positions.reduce((sum, p) => sum + p.applicants, 0);

  return (
    <>
      <PageHeader
        title="Recruitment"
        subtitle={`${openCount} open positions · ${totalApplicants} total applicants`}
      />

      <CrewHubTabs />

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
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Applicants</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {positions.map((position) => (
              <tr key={position.id} className="transition-colors hover:bg-bg-secondary/50">
                <td className="px-6 py-3.5 text-sm font-medium text-foreground">{position.title}</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                    {position.department}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[position.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {formatLabel(position.status)}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-sm tabular-nums text-foreground">{position.applicants}</td>
                <td className="px-6 py-3.5 text-sm text-text-muted">{formatDate(position.posted_date)}</td>
              </tr>
            ))}
            {positions.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center"><EmptyState message="No open positions" description="Create a position to start recruiting." /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
