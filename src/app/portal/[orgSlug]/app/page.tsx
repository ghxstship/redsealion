import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { canAccessFeature, type FeatureKey } from '@/lib/subscription';
import { createClient } from '@/lib/supabase/server';
import { resolveOrgFromSlug } from '@/lib/auth/resolve-org-from-slug';
import { redirect } from 'next/navigation';
import { IconLock } from '@/components/ui/Icons';

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */

interface StatCard {
  label: string;
  value: string;
  detail: string;
  href?: string;
}

interface PortalDashboardProps {
  params: Promise<{ orgSlug: string }>;
}

/* ─────────────────────────────────────────────────────────
   Data Fetcher
   ───────────────────────────────────────────────────────── */

async function getPortalDashboardData(orgId: string) {
  try {
    const supabase = await createClient();

    const [proposalsRes, activeRes, pipelineRes, pendingRes, activityRes] =
      await Promise.all([
        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId),

        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['approved', 'in_production', 'active']),

        supabase
          .from('proposals')
          .select('status, total_value')
          .eq('organization_id', orgId)
          .not('status', 'in', '("complete","cancelled")'),

        supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['sent', 'viewed', 'negotiating']),

        supabase
          .from('activity_log')
          .select('id, action, entity_type, created_at')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

    const revenuePipeline = (pipelineRes.data ?? []).reduce(
      (sum, p) => sum + (p.total_value || 0),
      0,
    );

    const statusMap = new Map<string, { count: number; total_value: number }>();
    for (const p of pipelineRes.data ?? []) {
      const entry = statusMap.get(p.status) ?? { count: 0, total_value: 0 };
      entry.count++;
      entry.total_value += p.total_value || 0;
      statusMap.set(p.status, entry);
    }
    const pipelineSummary = Array.from(statusMap.entries()).map(
      ([status, data]) => ({ status, ...data }),
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
    return {
      totalProposals: 0,
      activeProjects: 0,
      revenuePipeline: 0,
      pendingApprovals: 0,
      recentActivity: [] as Array<{ id: string; action: string; entity_type: string; created_at: string }>,
      pipelineSummary: [] as Array<{ status: string; count: number; total_value: number }>,
    };
  }
}

/* ─────────────────────────────────────────────────────────
   Page Component
   ───────────────────────────────────────────────────────── */

export default async function PortalDashboardPage({ params }: PortalDashboardProps) {
  const { orgSlug } = await params;
  const org = await resolveOrgFromSlug(orgSlug);
  if (!org) redirect('/');

  const stats = await getPortalDashboardData(org.organizationId);
  const tier = 'portal' as const;

  // Build stat cards — portal tier only gets the core cards
  const cards: StatCard[] = [
    {
      label: 'Total Proposals',
      value: String(stats.totalProposals),
      detail: 'All time',
      href: `/portal/${orgSlug}/app/proposals`,
    },
    {
      label: 'Active Projects',
      value: String(stats.activeProjects),
      detail: 'Approved / in production',
      href: `/portal/${orgSlug}/app/pipeline`,
    },
    {
      label: 'Revenue Pipeline',
      value: formatCurrency(stats.revenuePipeline),
      detail: 'Open proposals',
      href: `/portal/${orgSlug}/app/pipeline`,
    },
    {
      label: 'Pending Approvals',
      value: String(stats.pendingApprovals),
      detail: 'Sent / viewed / negotiating',
      href: `/portal/${orgSlug}/app/proposals`,
    },
  ];

  // Locked feature cards — show as teasers
  const lockedCards: Array<{ label: string; feature: FeatureKey; tier: string }> = [
    { label: 'Automations Run', feature: 'automations', tier: 'Professional' },
    { label: 'Hours This Week', feature: 'time_tracking', tier: 'Enterprise' },
    { label: 'Tasks Due Today', feature: 'tasks', tier: 'Enterprise' },
    { label: 'Crew Available', feature: 'crew', tier: 'Professional' },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Overview of {org.orgName}&apos;s business activity.
        </p>
      </div>

      {/* Stat cards — core metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href || '#'}
            className="group rounded-xl border border-border bg-white px-5 py-5 transition-[color,background-color,border-color,opacity,box-shadow] duration-normal hover:border-text-muted hover:shadow-sm"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{card.detail}</p>
            <span className="mt-2 inline-block text-xs text-text-muted group-hover:text-foreground transition-colors">
              View →
            </span>
          </Link>
        ))}
      </div>

      {/* Locked feature teasers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
        {lockedCards.map((card) => (
          <div
            key={card.label}
            className="relative rounded-xl border border-dashed border-border bg-white/50 px-5 py-5 opacity-60"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {card.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-text-muted">
              —
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Requires {card.tier} plan
            </p>
            <div className="absolute top-3 right-3">
              <IconLock className="text-text-muted" strokeWidth={1.5} size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      {stats.pipelineSummary.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-foreground mb-4">
            Pipeline by Status
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.pipelineSummary.map((item) => (
              <Link
                key={item.status}
                href={`/portal/${orgSlug}/app/pipeline`}
                className="rounded-lg border border-border bg-white px-4 py-3 transition-[color,background-color,border-color,opacity,box-shadow] duration-normal hover:border-text-muted hover:shadow-sm"
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
              </Link>
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
              <div
                key={activity.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium capitalize">
                      {activity.action.replace(/_/g, ' ')}
                    </span>{' '}
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
