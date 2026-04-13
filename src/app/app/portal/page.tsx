import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

/**
 * Portal index page — lists all projects with configured portals.
 * GAP-PTL-02: This page was missing entirely, causing 404 at /app/portal.
 *
 * Route: /app/portal
 */

interface PortalProject {
  id: string;
  project_id: string;
  portal_type: string;
  is_published: boolean;
  updated_at: string;
  projects: { id: string; name: string; slug: string; status: string } | null;
}

export default async function PortalIndexPage() {
  const supabase = await createClient();
  const ctx = await resolveCurrentOrg();

  if (!ctx) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Unable to resolve organization.</p>
      </div>
    );
  }

  const { data: portals } = await supabase
    .from('project_portals')
    .select('id, project_id, portal_type, is_published, updated_at, projects(id, name, slug, status)')
    .eq('organization_id', ctx.organizationId)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  // Group portals by project
  const projectMap = new Map<string, { project: { id: string; name: string; slug: string; status: string }; portals: PortalProject[] }>();

  for (const portal of (portals ?? []) as unknown as PortalProject[]) {
    const proj = portal.projects;
    if (!proj) continue;

    const existing = projectMap.get(proj.id);
    if (existing) {
      existing.portals.push(portal);
    } else {
      projectMap.set(proj.id, { project: proj, portals: [portal] });
    }
  }

  const projects = Array.from(projectMap.values());

  return (
    <TierGate feature="proposals">
      <div className="space-y-6">
        <PageHeader title="Portal Management">
          <p className="text-sm text-text-secondary">
            Manage event portals across your projects.
          </p>
        </PageHeader>

        {projects.length === 0 ? (
          <EmptyState
            message="No portals configured"
            description="Create portals from the Portals tab in any project to manage event logistics."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(({ project, portals: projectPortals }) => {
              const publishedCount = projectPortals.filter(p => p.is_published).length;
              const totalCount = projectPortals.length;

              return (
                <Link
                  key={project.id}
                  href={`/app/projects/${project.id}`}
                  className="group rounded-xl border border-border bg-background p-5 transition-all hover:border-text-muted hover:shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground leading-snug pr-3">
                      {project.name}
                    </h3>
                    <StatusBadge status={project.status} colorMap={GENERIC_STATUS_COLORS} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {projectPortals.map((p) => (
                        <Badge
                          key={p.id}
                          variant={p.is_published ? 'success' : 'muted'}
                        >
                          {p.portal_type.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs text-text-muted pt-1">
                      <span>{publishedCount} of {totalCount} published</span>
                      <span>
                        {new Date(projectPortals[0].updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </TierGate>
  );
}
