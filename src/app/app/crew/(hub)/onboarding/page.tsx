import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import PageHeader from '@/components/shared/PageHeader';
import CrewHubTabs from '../../CrewHubTabs';

interface OnboardingMember {
  id: string;
  full_name: string;
  email: string;
  onboarding_status: string;
  documents_total: number;
  documents_completed: number;
  started_at: string | null;
}



const STATUS_COLORS: Record<string, string> = {
  complete: 'bg-green-50 text-green-700',
  in_progress: 'bg-blue-50 text-blue-700',
  pending: 'bg-bg-secondary text-text-muted',
};

async function getOnboarding(): Promise<OnboardingMember[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');
const { data: profiles } = await supabase
      .from('crew_profiles')
      .select('*, users(email)')
      .eq('organization_id', ctx.organizationId)
      .order('full_name');

    if (!profiles || profiles.length === 0) throw new Error('No profiles');

    return profiles.map((p: Record<string, unknown>) => ({
      id: p.id as string,
      full_name: p.full_name as string,
      email: (p.users as Record<string, string>)?.email ?? '',
      onboarding_status: (p.onboarding_status as string) ?? 'pending',
      documents_total: (p.documents_total as number) ?? 6,
      documents_completed: (p.documents_completed as number) ?? 0,
      started_at: (p.onboarding_started_at as string) ?? null,
    }));
  } catch {
    return [];
  }
}

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

export default async function OnboardingPage() {
  const members = await getOnboarding();

  const completeCount = members.filter((m) => m.onboarding_status === 'complete').length;
  const inProgressCount = members.filter((m) => m.onboarding_status === 'in_progress').length;
  const pendingCount = members.filter((m) => m.onboarding_status === 'pending').length;

  return (
    <>
      <PageHeader
        title="Onboarding"
        subtitle={`${completeCount} complete \u00b7 ${inProgressCount} in progress \u00b7 ${pendingCount} pending`}
      />

      <CrewHubTabs />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Complete</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-green-700">{completeCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">In Progress</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-700">{inProgressCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-xs text-text-muted">Pending</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-text-muted">{pendingCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg-secondary">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Documents</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const pct =
                member.documents_total > 0
                  ? Math.round((member.documents_completed / member.documents_total) * 100)
                  : 0;

              return (
                <tr key={member.id} className="transition-colors hover:bg-bg-secondary/50">
                  <td className="px-6 py-3.5">
                    <Link
                      href={`/app/crew/${member.id}`}
                      className="text-sm font-medium text-foreground hover:underline"
                    >
                      {member.full_name}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-secondary">{member.email}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[member.onboarding_status] ?? 'bg-bg-secondary text-text-muted'
                      }`}
                    >
                      {formatLabel(member.onboarding_status)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-[120px]">
                        <div className="h-2 w-full rounded-full bg-bg-secondary">
                          <div
                            className={`h-2 rounded-full transition-[width,opacity] ${
                              pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-text-muted'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs tabular-nums text-text-muted">
                        {member.documents_completed}/{member.documents_total}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-text-muted">
                    {member.started_at ? formatDate(member.started_at) : '\u2014'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
