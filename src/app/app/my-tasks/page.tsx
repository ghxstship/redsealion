import { createClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import MyTasksTable, { type MyTaskRow } from '@/components/admin/my-tasks/MyTasksTable';
import MyTasksHeader from '@/components/admin/my-tasks/MyTasksHeader';

import { RoleGate } from '@/components/shared/RoleGate';
async function getMyTasks(): Promise<MyTaskRow[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !ctx) return [];

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, start_date, start_time, end_time, estimated_hours, actual_hours, organization_id, project_id, projects(name), creator:users!created_by(full_name)')
      .eq('assignee_id', user.id)
      .eq('organization_id', ctx.organizationId)
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
      const creator = t.creator as { full_name?: string } | null;
      const creatorName = creator?.full_name ?? null;

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
        projectName: (t.projects as { name?: string } | null)?.name ?? null,
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
    <RoleGate allowedRoles={['developer', 'owner', 'admin', 'controller', 'collaborator']}>
    <div>
      <MyTasksHeader taskCount={tasks.length} />
      <MyTasksTable tasks={tasks} />
    </div>
  </RoleGate>
  );
}
