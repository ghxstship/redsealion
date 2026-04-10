import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import WorkloadsHubTabs from '../WorkloadsHubTabs';
import PageHeader from '@/components/shared/PageHeader';
import Card from '@/components/ui/Card';

interface ResourceStats {
  totalAllocations: number;
  teamMembers: number;
  avgUtilization: number;
}

async function getResourceStats(): Promise<ResourceStats> {
  const fallback: ResourceStats = { totalAllocations: 0, teamMembers: 0, avgUtilization: 0 };
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    const [allocRes, teamRes, utilRes] = await Promise.all([
      supabase
        .from('resource_allocations')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId),
      supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', ctx.organizationId),
      supabase
        .from('resource_allocations')
        .select('allocated_hours, available_hours')
        .eq('organization_id', ctx.organizationId),
    ]);

    const rows = utilRes.data ?? [];
    const totalAllocated = rows.reduce((s, r) => s + (r.allocated_hours ?? 0), 0);
    const totalAvailable = rows.reduce((s, r) => s + (r.available_hours ?? 0), 0);
    const avgUtilization =
      totalAvailable > 0 ? Math.round((totalAllocated / totalAvailable) * 100) : 0;

    return {
      totalAllocations: allocRes.count ?? 0,
      teamMembers: teamRes.count ?? 0,
      avgUtilization,
    };
  } catch {
    return fallback;
  }
}

export default async function WorkloadsPage() {
  const stats = await getResourceStats();

  const cards = [
    { label: 'Active Allocations', value: String(stats.totalAllocations), detail: 'Current assignments' },
    { label: 'Team Members', value: String(stats.teamMembers), detail: 'Available resources' },
    { label: 'Avg Utilization', value: `${stats.avgUtilization}%`, detail: 'This month' },
  ];

  return (
    <TierGate feature="resource_scheduling">
      <PageHeader
        title="Workload Management"
        subtitle="Plan workloads and allocate team members to projects."
      />

      <WorkloadsHubTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-background px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-text-secondary">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">
          Resource allocation timeline will appear here once team members are scheduled to projects.
        </p>
      </div>
    </TierGate>
  );
}
