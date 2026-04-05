import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import TasksHeader from '@/components/admin/tasks/TasksHeader';
import TasksTable from '@/components/admin/tasks/TasksTable';
import TaskViewSwitcher from '@/components/admin/tasks/TaskViewSwitcher';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueDate: string | null;
  subtaskCount: number;
}

async function getTasks(): Promise<TaskRow[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('No auth');

    const { data: tasks } = await supabase
      .from('tasks')
      .select(
        '*, assignee:users!tasks_assignee_id_fkey(id, full_name)',
      )
      .is('parent_task_id', null)
      .order('sort_order')
      .limit(200);

    if (!tasks) return [];

    // Count subtasks in one query
    const taskIds = tasks.map((t) => t.id);
    const { data: subtaskCounts } = await supabase
      .from('tasks')
      .select('parent_task_id')
      .in('parent_task_id', taskIds);

    const countMap = new Map<string, number>();
    for (const sub of subtaskCounts ?? []) {
      countMap.set(sub.parent_task_id, (countMap.get(sub.parent_task_id) ?? 0) + 1);
    }

    return tasks.map((t) => {
      const assignee = t.assignee as { id: string; full_name: string } | null;
      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assigneeName: assignee?.full_name ?? null,
        dueDate: t.due_date,
        subtaskCount: countMap.get(t.id) ?? 0,
      };
    });
  } catch {
    return [];
  }
}

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <TierGate feature="tasks">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {tasks.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TaskViewSwitcher />
          <TasksHeader />
        </div>
      </div>

      {/* Interactive table with search, filter, bulk actions, export */}
      <TasksTable tasks={tasks} />
    </TierGate>
  );
}
