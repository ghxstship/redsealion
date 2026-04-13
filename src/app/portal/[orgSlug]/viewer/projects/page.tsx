import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge, { GENERIC_STATUS_COLORS } from '@/components/ui/StatusBadge';
import type { Metadata } from 'next';

interface ViewerProjectsProps {
  params: Promise<{ orgSlug: string }>;
}

export async function generateMetadata({ params }: ViewerProjectsProps): Promise<Metadata> {
  const { orgSlug } = await params;
  return { title: `Projects | Viewer Portal | ${orgSlug}` };
}

export default async function ViewerProjectsPage({ params }: ViewerProjectsProps) {
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

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, start_date, end_date, updated_at')
    .eq('organization_id', org.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Projects</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Read-only view of all organization projects.
        </p>
      </div>

      {(projects ?? []).length === 0 ? (
        <EmptyState message="No projects" description="No projects have been created yet." />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-secondary">
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Start Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">End Date</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wider">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(projects ?? []).map((project) => (
                <tr key={project.id} className="hover:bg-bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{project.name}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={project.status} colorMap={GENERIC_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {project.start_date
                      ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {project.end_date
                      ? new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-text-muted text-xs">
                    {new Date(project.updated_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
