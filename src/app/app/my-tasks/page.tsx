import { createClient } from '@/lib/supabase/server';
import MyTasksTable, { type MyTaskRow } from '@/components/admin/my-tasks/MyTasksTable';
import MyTasksHeader from '@/components/admin/my-tasks/MyTasksHeader';

async function getMyTasks(): Promise<MyTaskRow[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, organization_id')
      .eq('assignee_id', user.id)
      .is('parent_task_id', null)
      .order('sort_order')
      .limit(200);

    if (!tasks) return [];

    // Count subtasks
    const taskIds = tasks.map((t) => t.id);
    const { data: subtaskCounts } = await supabase
      .from('tasks')
      .select('parent_task_id')
      .in('parent_task_id', taskIds);

    const countMap = new Map<string, number>();
    for (const sub of subtaskCounts ?? []) {
      countMap.set(sub.parent_task_id, (countMap.get(sub.parent_task_id) ?? 0) + 1);
    }

    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date ?? null,
      projectName: null,
      subtaskCount: countMap.get(t.id) ?? 0,
    }));
  } catch {
    return [];
  }
}

export default async function MyTasksPage() {
  const tasks = await getMyTasks();

  return (
    <div>
      <MyTasksHeader taskCount={tasks.length} />
      <MyTasksTable tasks={tasks} />
    </div>
  );
}
