import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import TaskViewSwitcher from '@/components/admin/tasks/TaskViewSwitcher';

/**
 * Workload view — shows task distribution per team member
 * with capacity utilization based on estimated hours.
 */

interface TeamMemberWorkload {
  userId: string;
  name: string;
  avatar: string | null;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  estimatedHours: number;
  actualHours: number;
  tasksByPriority: Record<string, number>;
}

async function getWorkload(): Promise<TeamMemberWorkload[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, status, priority, due_date, estimated_hours, actual_hours, assignee_id, users!tasks_assignee_id_fkey(id, full_name, avatar_url)')
      .eq('organization_id', ctx.organizationId)
      .is('parent_task_id', null)
      .not('assignee_id', 'is', null);

    if (!tasks) return [];

    const today = new Date().toISOString().split('T')[0];
    const byUser = new Map<string, { name: string; avatar: string | null; tasks: typeof tasks }>();

    for (const task of tasks) {
      const user = task.users as unknown as { id: string; full_name: string; avatar_url: string | null } | null;
      if (!user?.id) continue;

      if (!byUser.has(user.id)) {
        byUser.set(user.id, { name: user.full_name, avatar: user.avatar_url, tasks: [] });
      }
      byUser.get(user.id)!.tasks.push(task);
    }

    const result: TeamMemberWorkload[] = [];
    for (const [userId, { name, avatar, tasks: userTasks }] of byUser) {
      const priorities: Record<string, number> = {};
      let completed = 0, overdue = 0, estHours = 0, actHours = 0;

      for (const t of userTasks) {
        if (t.status === 'done') completed++;
        if (t.due_date && t.due_date < today && t.status !== 'done') overdue++;
        estHours += t.estimated_hours ?? 0;
        actHours += t.actual_hours ?? 0;
        const p = (t.priority as string) ?? 'medium';
        priorities[p] = (priorities[p] ?? 0) + 1;
      }

      result.push({
        userId,
        name,
        avatar,
        totalTasks: userTasks.length,
        completedTasks: completed,
        overdueTasks: overdue,
        estimatedHours: estHours,
        actualHours: actHours,
        tasksByPriority: priorities,
      });
    }

    result.sort((a, b) => b.totalTasks - a.totalTasks);
    return result;
  } catch {
    return [];
  }
}

function utilizationColor(pct: number): string {
  if (pct > 100) return 'text-red-600 bg-red-50';
  if (pct > 80) return 'text-amber-600 bg-amber-50';
  if (pct > 50) return 'text-blue-600 bg-blue-50';
  return 'text-green-600 bg-green-50';
}

function barColor(pct: number): string {
  if (pct > 100) return 'bg-red-500';
  if (pct > 80) return 'bg-amber-500';
  return 'bg-blue-500';
}

export default async function WorkloadPage() {
  const workload = await getWorkload();

  const totalTasks = workload.reduce((s, w) => s + w.totalTasks, 0);
  const totalOverdue = workload.reduce((s, w) => s + w.overdueTasks, 0);
  const overloaded = workload.filter(
    (w) => w.estimatedHours > 0 && (w.actualHours / w.estimatedHours) > 1,
  ).length;

  return (
    <TierGate feature="tasks">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Workload</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Team task distribution and capacity utilization
          </p>
        </div>
        <TaskViewSwitcher />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Team Members</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{workload.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Active Tasks</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{totalTasks}</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Overdue</p>
          <p className={`mt-2 text-3xl font-semibold tabular-nums ${totalOverdue > 0 ? 'text-amber-600' : 'text-foreground'}`}>
            {totalOverdue}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Overloaded</p>
          <p className={`mt-2 text-3xl font-semibold tabular-nums ${overloaded > 0 ? 'text-red-600' : 'text-foreground'}`}>
            {overloaded}
          </p>
        </div>
      </div>

      {/* Member cards */}
      {workload.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-5 py-12 text-center">
          <p className="text-sm text-text-muted">No assigned tasks found. Assign tasks to team members to see workload distribution.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {workload.map((member) => {
            const activeTasks = member.totalTasks - member.completedTasks;
            const utilPct = member.estimatedHours > 0
              ? Math.round((member.actualHours / member.estimatedHours) * 100)
              : 0;

            return (
              <div key={member.userId} className="rounded-xl border border-border bg-white p-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="h-9 w-9 rounded-full" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-bg-tertiary flex items-center justify-center text-sm font-medium text-text-muted">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-xs text-text-muted">{activeTasks} active · {member.completedTasks} done</p>
                  </div>
                  {member.estimatedHours > 0 && (
                    <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${utilizationColor(utilPct)}`}>
                      {utilPct}%
                    </span>
                  )}
                </div>

                {/* Capacity bar */}
                {member.estimatedHours > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-text-muted">Capacity</span>
                      <span className="text-[11px] text-text-muted tabular-nums">
                        {member.actualHours.toFixed(1)}/{member.estimatedHours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(utilPct)}`}
                        style={{ width: `${Math.min(utilPct, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Priority breakdown */}
                <div className="flex gap-3 text-xs text-text-muted">
                  {member.tasksByPriority.urgent && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {member.tasksByPriority.urgent} urgent
                    </span>
                  )}
                  {member.tasksByPriority.high && (
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      {member.tasksByPriority.high} high
                    </span>
                  )}
                  {member.overdueTasks > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      {member.overdueTasks} overdue
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


    </TierGate>
  );
}
