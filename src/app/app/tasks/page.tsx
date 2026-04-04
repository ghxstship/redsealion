import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import { statusColor } from '@/lib/utils';
import Link from 'next/link';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  subtaskCount: number;
  parentTaskId: string | null;
}

async function getTasks(): Promise<TaskRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!userData) return [];

    // Fetch top-level tasks only (parent_task_id is null)
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, priority, assignee_id, due_date, estimated_hours, parent_task_id')
      .eq('organization_id', userData.organization_id)
      .is('parent_task_id', null)
      .order('sort_order')
      .limit(50);

    if (!data || data.length === 0) return [];

    // Get subtask counts for each task
    const taskIds = data.map((t) => t.id);
    const { data: subtaskRows } = await supabase
      .from('tasks')
      .select('parent_task_id')
      .in('parent_task_id', taskIds);

    const subtaskCountMap = new Map<string, number>();
    for (const row of subtaskRows ?? []) {
      const pid = row.parent_task_id as string;
      subtaskCountMap.set(pid, (subtaskCountMap.get(pid) ?? 0) + 1);
    }

    const assigneeIds = [...new Set(data.map((t) => t.assignee_id).filter(Boolean))] as string[];
    const { data: users } = assigneeIds.length > 0
      ? await supabase.from('users').select('id, full_name').in('id', assigneeIds)
      : { data: [] };

    const nameMap = new Map((users ?? []).map((u) => [u.id, u.full_name]));

    return data.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      assigneeName: t.assignee_id ? (nameMap.get(t.assignee_id) ?? null) : null,
      dueDate: t.due_date,
      estimatedHours: t.estimated_hours,
      subtaskCount: subtaskCountMap.get(t.id) ?? 0,
      parentTaskId: t.parent_task_id,
    }));
  } catch {
    return [];
  }
}

function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    urgent: 'bg-red-50 text-red-700',
    high: 'bg-orange-50 text-orange-700',
    medium: 'bg-yellow-50 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  };
  return map[priority] ?? 'bg-gray-100 text-gray-600';
}

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <TierGate feature="tasks">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage project tasks across all views.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/app/tasks/board" className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Board</Link>
          <Link href="/app/tasks/gantt" className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Gantt</Link>
          <Link href="/app/tasks/calendar" className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary">Calendar</Link>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-8 py-16 text-center">
          <p className="text-sm text-text-secondary">No tasks created yet. Create your first task to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Est.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr key={task.id} className="transition-colors hover:bg-bg-secondary/50">
                    <td className="px-6 py-3.5">
                      <Link href={`/app/tasks/${task.id}`} className="group flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </span>
                        {task.subtaskCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-bg-secondary px-1.5 py-0.5 text-xs text-text-muted">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3 4h6M3 6h6M3 8h4" />
                            </svg>
                            {task.subtaskCount}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(task.status)}`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${priorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">{task.assigneeName ?? 'Unassigned'}</td>
                    <td className="px-6 py-3.5 text-sm tabular-nums text-text-secondary">
                      {task.estimatedHours ? `${task.estimatedHours}h` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-text-secondary">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TierGate>
  );
}
