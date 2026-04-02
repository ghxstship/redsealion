import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';

interface DashboardStats {
  totalProposals: number;
  activeProjects: number;
  revenuePipeline: number;
  pendingApprovals: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
  }>;
  pipelineSummary: Array<{
    status: string;
    count: number;
    total_value: number;
  }>;
}

async function getDashboardStats(): Promise<DashboardStats> {
  const fallback: DashboardStats = {
    totalProposals: 0,
    activeProjects: 0,
    revenuePipeline: 0,
    pendingApprovals: 0,
    recentActivity: [],
    pipelineSummary: [],
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return fallback;

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userData) return fallback;

    const orgId = userData.organization_id;

    // Run queries in parallel
    const [proposalsRes, activeRes, pipelineRes, pendingRes, activityRes] =
      await Promise.all([
        // Total proposals
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        // Active projects (approved, in_production, active)
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['approved', 'in_production', 'active']),

        // Pipeline value (non-terminal statuses)
        supabase
          .from('proposals')
          .select('status, total_value')
          .eq('organization_id', orgId)
          .not('status', 'in', '("complete","cancelled")'),

        // Pending approvals
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['sent', 'viewed', 'negotiating']),

        // Recent activity
        supabase
          .from('activity_log')
          .select('id, action, entity_type, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

    // Compute pipeline value
    const revenuePipeline = (pipelineRes.data ?? []).reduce(
      (sum, p) => sum + (p.total_value || 0),
      0
    );

    // Build pipeline summary by status
    const statusMap = new Map<string, { count: number; total_value: number }>();
    for (const p of pipelineRes.data ?? []) {
      const entry = statusMap.get(p.status) ?? { count: 0, total_value: 0 };
      entry.count++;
      entry.total_value += p.total_value || 0;
      statusMap.set(p.status, entry);
    }
    const pipelineSummary = Array.from(statusMap.entries()).map(
      ([status, data]) => ({ status, ...data })
    );

    return {
      totalProposals: proposalsRes.count ?? 0,
      activeProjects: activeRes.count ?? 0,
      revenuePipeline,
      pendingApprovals: pendingRes.count ?? 0,
      recentActivity: activityRes.data ?? [],
      pipelineSummary,
    };
  } catch {
    return fallback;
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      label: 'Total Proposals',
      value: String(stats.totalProposals),
      detail: 'All time',
    },
    {
      label: 'Active Projects',
      value: String(stats.activeProjects),
      detail: 'Approved / in production',
    },
    {
      label: 'Revenue Pipeline',
      value: formatCurrency(stats.revenuePipeline),
      detail: 'Open proposals',
    },
    {
      label: 'Pending Approvals',
      value: String(stats.pendingApprovals),
      detail: 'Sent / viewed / negotiating',
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of your business activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-white px-5 py-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      {stats.pipelineSummary.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Pipeline by Status
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stats.pipelineSummary.map((item) => (
              <div
                key={item.status}
                className="rounded-lg border border-border bg-white px-4 py-3"
              >
                <p className="text-xs font-medium capitalize text-text-secondary">
                  {item.status.replace(/_/g, ' ')}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {item.count}
                </p>
                <p className="text-xs text-text-muted">
                  {formatCurrency(item.total_value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentActivity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Recent Activity
          </h2>
          <div className="rounded-xl border border-border bg-white divide-y divide-border">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium capitalize">
                      {activity.action.replace(/_/g, ' ')}
                    </span>
                    {' '}
                    <span className="text-text-secondary">
                      {activity.entity_type.replace(/_/g, ' ')}
                    </span>
                  </p>
                </div>
                <p className="text-xs text-text-muted whitespace-nowrap">
                  {new Date(activity.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
