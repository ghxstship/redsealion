import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import { TierGate } from '@/components/shared/TierGate';
import TasksHeader from '@/components/admin/tasks/TasksHeader';
import TasksTable from '@/components/admin/tasks/TasksTable';
import TasksHubTabs from '../TasksHubTabs';
import PageHeader from '@/components/shared/PageHeader';

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
    const ctx = await resolveCurrentOrg();
    if (!ctx) return [];

    const { data: tasks } = await supabase
      .from('tasks')
      .select(
        '*, assignee:users!tasks_assignee_id_fkey(id, full_name)',
      )
      .eq('organization_id', ctx.organizationId)
      .is('parent_task_id', null)
      .order('sort_order')
      .limit(200);

    if (!tasks) return [];

    // Count subtasks in one query
    const taskIds = tasks.map((t) => t.id);
    const { data: subtaskCounts } = await supabase
      .from('tasks')
      .select('parent_task_id')
      .eq('organization_id', ctx.organizationId)
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
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.length} tasks`}
      >
        <TasksHeader />
      </PageHeader>

      <TasksHubTabs />

      {tasks.length >= 200 && (
        <p className="text-xs text-text-muted mb-4">Showing first 200 tasks. Use filters to narrow results.</p>
      )}

      {/* Interactive table with search, filter, bulk actions, export */}
      <TasksTable tasks={tasks} />
    </TierGate>
  );
}
