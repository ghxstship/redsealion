import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';
import TaskViewSwitcher from '@/components/admin/tasks/TaskViewSwitcher';
import EmptyState from '@/components/ui/EmptyState';

/**
 * Project-level task overview — groups tasks by their linked proposal (project)
 * and shows health indicators: completion %, overdue count, and status breakdown.
 */

interface ProjectHealth {
  proposalId: string;
  proposalName: string;
  clientName: string | null;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  totalEstimatedHours: number;
  totalActualHours: number;
}

async function getProjectHealth(): Promise<ProjectHealth[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    // Get all tasks grouped by proposal
    const { data: tasks } = await supabase
      .from('tasks')
      .select(
        'id, status, priority, due_date, estimated_hours, actual_hours, proposal_id',
      )
      .eq('organization_id', ctx.organizationId)
      .not('proposal_id', 'is', null)
      .is('parent_task_id', null);

    if (!tasks || tasks.length === 0) return [];

    // Get proposal details
    const proposalIds = [
      ...new Set(tasks.map((t) => t.proposal_id).filter(Boolean)),
    ] as string[];

    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, name, client_id, clients(company_name)')
      .in('id', proposalIds);

    const proposalMap = new Map(
      (proposals ?? []).map((p) => [
        p.id,
        {
          name: p.name,
          clientName:
            (p.clients as unknown as { company_name: string } | null)
              ?.company_name ?? null,
        },
      ]),
    );

    // Group tasks by proposal
    const groups = new Map<string, typeof tasks>();
    for (const task of tasks) {
      if (!task.proposal_id) continue;
      if (!groups.has(task.proposal_id)) {
        groups.set(task.proposal_id, []);
      }
      groups.get(task.proposal_id)!.push(task);
    }

    const today = new Date().toISOString().split('T')[0];

    const result: ProjectHealth[] = [];
    for (const [proposalId, projectTasks] of groups) {
      const info = proposalMap.get(proposalId);
      if (!info) continue;

      result.push({
        proposalId,
        proposalName: info.name,
        clientName: info.clientName,
        totalTasks: projectTasks.length,
        completedTasks: projectTasks.filter((t) => t.status === 'done').length,
        overdueTasks: projectTasks.filter(
          (t) =>
            t.due_date &&
            t.due_date < today &&
            t.status !== 'done' &&
            t.status !== 'cancelled',
        ).length,
        inProgressTasks: projectTasks.filter(
          (t) => t.status === 'in_progress',
        ).length,
        blockedTasks: projectTasks.filter((t) => t.status === 'blocked')
          .length,
        totalEstimatedHours: projectTasks.reduce(
          (sum, t) => sum + (t.estimated_hours ?? 0),
          0,
        ),
        totalActualHours: projectTasks.reduce(
          (sum, t) => sum + (t.actual_hours ?? 0),
          0,
        ),
      });
    }

    // Sort by most tasks / most overdue first
    result.sort(
      (a, b) => b.overdueTasks - a.overdueTasks || b.totalTasks - a.totalTasks,
    );

    return result;
  } catch {
    return [];
  }
}

function healthColor(project: ProjectHealth): string {
  if (project.blockedTasks > 0) return 'text-red-600';
  if (project.overdueTasks > 0) return 'text-amber-600';
  if (project.completedTasks === project.totalTasks) return 'text-green-600';
  return 'text-blue-600';
}

function healthLabel(project: ProjectHealth): string {
  if (project.blockedTasks > 0) return 'At Risk';
  if (project.overdueTasks > 0) return 'Needs Attention';
  if (project.completedTasks === project.totalTasks) return 'Complete';
  return 'On Track';
}

function healthBg(project: ProjectHealth): string {
  if (project.blockedTasks > 0) return 'bg-red-50';
  if (project.overdueTasks > 0) return 'bg-amber-50';
  if (project.completedTasks === project.totalTasks) return 'bg-green-50';
  return 'bg-blue-50';
}

export default async function TaskProjectsPage() {
  const projects = await getProjectHealth();

  // Summary stats
  const totalProjects = projects.length;
  const totalOverdue = projects.reduce(
    (sum, p) => sum + p.overdueTasks,
    0,
  );
  const atRisk = projects.filter((p) => p.blockedTasks > 0).length;

  return (
    <TierGate feature="tasks">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Task health by project — {totalProjects} active project
            {totalProjects !== 1 ? 's' : ''}
          </p>
        </div>
        <TaskViewSwitcher />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Active Projects
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
            {totalProjects}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Overdue Tasks
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tabular-nums ${
              totalOverdue > 0 ? 'text-amber-600' : 'text-foreground'
            }`}
          >
            {totalOverdue}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            At Risk
          </p>
          <p
            className={`mt-2 text-3xl font-semibold tabular-nums ${
              atRisk > 0 ? 'text-red-600' : 'text-foreground'
            }`}
          >
            {atRisk}
          </p>
        </div>
      </div>

      {/* Project cards */}
      {projects.length === 0 ? (
        <EmptyState
          message="No tasks linked to projects yet"
          description="Assign tasks to proposals to see project health here."
          action={
            <Link
              href="/app/tasks"
              className="mt-3 inline-block text-sm font-medium text-foreground hover:opacity-70"
            >
              Go to Tasks →
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((project) => {
            const pct =
              project.totalTasks > 0
                ? Math.round(
                    (project.completedTasks / project.totalTasks) * 100,
                  )
                : 0;

            return (
              <Link
                key={project.proposalId}
                href={`/app/tasks?project=${project.proposalId}`}
                className="group rounded-xl border border-border bg-white p-5 transition-[border-color,box-shadow] hover:border-text-muted hover:shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:underline truncate">
                      {project.proposalName}
                    </h3>
                    {project.clientName && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {project.clientName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${healthColor(project)} ${healthBg(project)}`}
                  >
                    {healthLabel(project)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">Progress</span>
                    <span className="text-xs font-medium tabular-nums text-text-secondary">
                      {project.completedTasks}/{project.totalTasks} tasks ({pct}
                      %)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        project.blockedTasks > 0
                          ? 'bg-red-500'
                          : project.overdueTasks > 0
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                  {project.inProgressTasks > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      {project.inProgressTasks} in progress
                    </span>
                  )}
                  {project.overdueTasks > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {project.overdueTasks} overdue
                    </span>
                  )}
                  {project.blockedTasks > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {project.blockedTasks} blocked
                    </span>
                  )}
                  {project.totalEstimatedHours > 0 && (
                    <span>
                      {project.totalActualHours.toFixed(1)}/
                      {project.totalEstimatedHours.toFixed(1)}h
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </TierGate>
  );
}
