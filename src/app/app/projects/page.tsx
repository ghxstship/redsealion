import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import ProjectsHubClient from './ProjectsHubClient';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';

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
  task_count: number;
  completed_task_count: number;
}

async function getProjects(): Promise<ProjectRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data } = await supabase
      .from('projects')
      .select('id, name, slug, status, visibility, starts_at, ends_at, created_at, venue_name, project_code, tasks(id, status)')
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    return (data ?? []).map((p: Record<string, unknown>) => {
      const tasks = (p.tasks ?? []) as Array<{ id: string; status: string }>;
      return {
        id: p.id as string,
        name: p.name as string,
        slug: p.slug as string,
        status: p.status as string,
        visibility: p.visibility as string,
        starts_at: p.starts_at as string | null,
        ends_at: p.ends_at as string | null,
        created_at: p.created_at as string,
        venue_name: p.venue_name as string | null,
        project_code: p.project_code as string | null,
        task_count: tasks.length,
        completed_task_count: tasks.filter((t) => t.status === 'done' || t.status === 'completed').length,
      };
    });
  } catch {
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <TierGate feature="projects">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
      >
        <Link
          href="/app/projects/new"
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          New Project
        </Link>
      </PageHeader>

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
