import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { notFound } from 'next/navigation';
import ProjectDetailClient from './ProjectDetailClient';
import { TierGate } from '@/components/shared/TierGate';

async function getProject(id: string) {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();

    if (!project) return null;

    // Fetch related data in parallel
    const [membersRes, portalsRes, statusUpdatesRes] = await Promise.all([
      supabase
        .from('project_memberships')
        .select('id, user_id, seat_type, status, created_at, users(full_name, email, avatar_url)')
        .eq('project_id', id)
        .eq('organization_id', ctx.organizationId)
        .order('created_at', { ascending: true }),

      supabase
        .from('project_portals')
        .select('id, portal_type, is_published, updated_at')
        .eq('project_id', id)
        .eq('organization_id', ctx.organizationId),

      supabase
        .from('project_status_updates')
        .select('id, status, summary, created_at, created_by')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    return {
      ...project,
      members: membersRes.data ?? [],
      portals: portalsRes.data ?? [],
      statusUpdates: statusUpdatesRes.data ?? [],
    };
  } catch {
    return null;
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  return (
    <TierGate feature="proposals">
      <ProjectDetailClient project={project} />
    </TierGate>
  );
}
