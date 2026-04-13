import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import type { Metadata } from 'next';

interface ViewerDashboardProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: ViewerDashboardProps): Promise<Metadata> {
  const { orgSlug } = await params;
  return { title: `Viewer Dashboard | ${orgSlug}` };
}

export default async function ViewerDashboardPage({ params }: ViewerDashboardProps) {
  const { orgSlug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  if (!org) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/portal/${orgSlug}/login`);

  // Verify viewer role
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('id, roles:role_id(name)')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .maybeSingle();

  const roleName = (membership?.roles as unknown as { name: string })?.name;
  if (roleName !== 'viewer') {
    redirect(`/portal/${orgSlug}`);
  }

  const displayName = user.user_metadata?.full_name ?? user.email ?? 'Viewer';

  // ── KPIs ──
  // Count active projects
  const { count: projectCount } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id)
    .in('status', ['active', 'in_progress']);

  // Count proposals
  const { count: proposalCount } = await supabase
    .from('proposals')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  // Sum proposal total value
  const { data: proposalValues } = await supabase
    .from('proposals')
    .select('total_value, currency')
    .eq('organization_id', org.id)
    .not('status', 'eq', 'cancelled');

  const totalPipelineValue = (proposalValues ?? []).reduce((sum, p) => sum + (p.total_value ?? 0), 0);
  const currency = proposalValues?.[0]?.currency ?? 'USD';

  // Portfolio items count
  const { count: portfolioCount } = await supabase
    .from('portfolio_library')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  // ── Recent proposals (read-only) ──
  const { data: recentProposals } = await supabase
    .from('proposals')
    .select('id, name, status, total_value, currency, updated_at')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false })
    .limit(8);

  // ── Recent projects ──
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('id, name, status, updated_at')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {displayName}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {org.name} — Viewer Portal
        </p>
        <p className="mt-2 text-xs text-text-muted">
          You have read-only access to organization data for oversight and reporting.
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Active Projects</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{projectCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Proposals</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{proposalCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Pipeline Value</p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            {formatCurrency(totalPipelineValue, currency)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Portfolio Items</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{portfolioCount ?? 0}</p>
        </Card>
      </div>

      {/* Recent Proposals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Recent Proposals
          </h2>
          <Link
            href={`/portal/${orgSlug}/viewer/proposals`}
            className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        {(recentProposals ?? []).length === 0 ? (
          <EmptyState message="No proposals" description="Proposals will appear here as they are created." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(recentProposals ?? []).map((proposal) => (
              <Link
                key={proposal.id}
                href={`/portal/${orgSlug}/viewer/proposals/${proposal.id}`}
                className="group rounded-lg border border-border bg-background p-4 transition-[color,background-color,border-color,opacity,box-shadow] duration-normal hover:border-text-muted hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-foreground leading-snug pr-2 line-clamp-2">
                    {proposal.name}
                  </h3>
                  <StatusBadge status={proposal.status} colorMap={GENERIC_STATUS_COLORS} />
                </div>
                <div className="text-xs text-text-secondary font-medium">
                  {formatCurrency(proposal.total_value, proposal.currency)}
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  {new Date(proposal.updated_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Recent Projects
          </h2>
          <Link
            href={`/portal/${orgSlug}/viewer/projects`}
            className="text-xs font-medium text-text-muted hover:text-foreground transition-colors"
          >
            View all →
          </Link>
        </div>
        {(recentProjects ?? []).length === 0 ? (
          <EmptyState message="No projects" description="Projects will appear here as they are created." />
        ) : (
          <div className="space-y-2">
            {(recentProjects ?? []).map((project) => (
              <Link
                key={project.id}
                href={`/portal/${orgSlug}/viewer/projects/${project.id}`}
                className="block rounded-lg border border-border bg-background p-4 hover:border-text-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{project.name}</p>
                  <StatusBadge status={project.status} colorMap={GENERIC_STATUS_COLORS} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
