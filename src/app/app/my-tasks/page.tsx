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
      .select('id, title, status, priority, due_date, start_date, start_time, end_time, estimated_hours, actual_hours, organization_id, project_id, projects(name), creator:users!created_by(first_name, last_name)')
      .eq('assignee_id', user.id)
      .is('parent_task_id', null)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .limit(200);

    if (!tasks) return [];

    // Count subtasks
    const taskIds = tasks.map((t) => t.id);
    const countMap = new Map<string, number>();

    if (taskIds.length > 0) {
      const { data: subtaskCounts } = await supabase
        .from('tasks')
        .select('parent_task_id')
        .in('parent_task_id', taskIds)
        .is('deleted_at', null);

      for (const sub of subtaskCounts ?? []) {
        countMap.set(sub.parent_task_id, (countMap.get(sub.parent_task_id) ?? 0) + 1);
      }
    }

    return tasks.map((t) => {
      const creator = t.creator as any;
      const creatorName = creator ? `${creator.first_name} ${creator.last_name}`.trim() : null;

      return {
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date ?? null,
        startDate: t.start_date ?? null,
        startTime: t.start_time ?? null,
        endTime: t.end_time ?? null,
        estimatedHours: t.estimated_hours ?? null,
        actualHours: t.actual_hours ?? null,
        createdBy: creatorName,
        projectName: (t.projects as any)?.name ?? null,
        subtaskCount: countMap.get(t.id) ?? 0,
      };
    });
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
