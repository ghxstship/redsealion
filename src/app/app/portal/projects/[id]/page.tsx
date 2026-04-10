import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { Check } from 'lucide-react';
import { TierGate } from '@/components/shared/TierGate';
import PageHeader from '@/components/shared/PageHeader';

/**
 * Client-facing project dashboard — a read-only view clients see
 * in the portal showing project health, milestones, and recent activity.
 *
 * Route: /app/portal/projects/[id]
 *
 * GAP-PTL-01: Refactored to query `projects` table directly instead of
 * `proposals`, and to use `tasks.project_id` for task aggregation.
 */

interface PortalProjectData {
  name: string;
  status: string;
  totalTasks: number;
  completedTasks: number;
  milestones: Array<{ title: string; completed: boolean; due_date: string | null }>;
  recentUpdates: Array<{ summary: string; status: string; created_at: string }>;
}

async function getPortalProject(projectId: string): Promise<PortalProjectData | null> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return null;

    // GAP-PTL-01: Query from projects table, scoped to org
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, status, organization_id')
      .eq('id', projectId)
      .eq('organization_id', ctx.organizationId)
      .is('deleted_at', null)
      .single();

    if (!project) return null;

    // Get tasks for this project using tasks.project_id
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status')
      .eq('project_id', projectId)
      .is('parent_task_id', null);

    const allTasks = tasks ?? [];
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;

    // Get milestones (tasks with priority = urgent or type = milestone)
    const { data: milestoneRows } = await supabase
      .from('tasks')
      .select('title, status, due_date')
      .eq('project_id', projectId)
      .eq('priority', 'urgent')
      .is('parent_task_id', null)
      .order('due_date', { ascending: true })
      .limit(10);

    const milestones = (milestoneRows ?? []).map((m) => ({
      title: m.title,
      completed: m.status === 'done',
      due_date: m.due_date,
    }));

    // Get recent status updates linked to this project
    const { data: updates } = await supabase
      .from('project_status_updates')
      .select('summary, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      name: project.name,
      status: project.status,
      totalTasks: allTasks.length,
      completedTasks,
      milestones,
      recentUpdates: (updates ?? []).map((u) => ({
        summary: u.summary,
        status: u.status,
        created_at: u.created_at,
      })),
    };
  } catch {
    return null;
  }
}

const statusColors: Record<string, string> = {
  on_track: 'bg-green-100 text-green-700',
  at_risk: 'bg-amber-100 text-amber-700',
  off_track: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getPortalProject(id);

  if (!project) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Project not found.</p>
      </div>
    );
  }

  const pct = project.totalTasks > 0
    ? Math.round((project.completedTasks / project.totalTasks) * 100)
    : 0;

  return (
    <TierGate feature="proposals">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
<PageHeader title={project.name} />
          <p className="mt-1 text-sm text-text-secondary">Project Dashboard</p>
        </div>

        {/* Progress card */}
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Progress</h2>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {pct}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-text-muted">
            {project.completedTasks} of {project.totalTasks} tasks completed
          </p>
        </div>

        {/* Milestones */}
        {project.milestones.length > 0 && (
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Milestones</h2>
            <div className="space-y-3">
              {project.milestones.map((ms, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      ms.completed
                        ? 'border-green-500 bg-green-500'
                        : 'border-border'
                    }`}
                  >
                    {ms.completed && (
                      <Check className="h-full w-full p-px text-white" />
                    )}
                  </div>
                  <span
                    className={`flex-1 text-sm ${
                      ms.completed ? 'text-text-muted line-through' : 'text-foreground'
                    }`}
                  >
                    {ms.title}
                  </span>
                  {ms.due_date && (
                    <span className="text-xs text-text-muted tabular-nums">
                      {new Date(ms.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Updates */}
        {project.recentUpdates.length > 0 && (
          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Recent Updates</h2>
            <div className="space-y-4">
              {project.recentUpdates.map((update, idx) => (
                <div key={idx} className="border-l-2 border-border pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        statusColors[update.status] ?? 'bg-bg-secondary text-text-muted'
                      }`}
                    >
                      {update.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-text-muted">
                      {new Date(update.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{update.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TierGate>
  );
}
