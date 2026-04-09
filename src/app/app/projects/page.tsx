import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import ProjectsHubClient from './ProjectsHubClient';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { TierGate } from '@/components/shared/TierGate';

interface ProjectRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  visibility: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  venue_name: string | null;
  project_code: string | null;
}

async function getProjects(): Promise<ProjectRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('projects')
      .select('id, name, slug, status, visibility, starts_at, ends_at, created_at, venue_name, project_code')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    return (data ?? []) as ProjectRow[];
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <TierGate feature="proposals">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
      />

      {projects.length === 0 ? (
        <EmptyState
          message="No projects yet"
          description="Create your first project to start organizing work, events, and budgets."
        />
      ) : (
        <ProjectsHubClient projects={projects} />
      )}
    </TierGate>
  );
}
