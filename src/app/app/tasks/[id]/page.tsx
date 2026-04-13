import { formatDate } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';
import { Check } from 'lucide-react';
import { TierGate } from '@/components/shared/TierGate';
import StatusBadge, { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/ui/EmptyState';
import Link from 'next/link';
import TaskComments from '@/components/admin/tasks/TaskComments';
import TaskDetailActions from '@/components/admin/tasks/TaskDetailActions';
import TaskDependencies from '@/components/admin/tasks/TaskDependencies';
import TaskChecklist from '@/components/admin/tasks/TaskChecklist';
import TaskAttachments from '@/components/admin/tasks/TaskAttachments';
import TaskActivityFeed from '@/components/admin/tasks/TaskActivityFeed';
import TaskTimer from '@/components/admin/tasks/TaskTimer';
import TaskWatchButton from '@/components/admin/tasks/TaskWatchButton';
import FavoriteButton from '@/components/shared/FavoriteButton';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/shared/PageHeader';

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  dueDate: string | null;
  startDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  proposalName: string | null;
  parentTaskTitle: string | null;
  parentTaskId: string | null;
  createdAt: string;
}

interface SubtaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeName: string | null;
  dueDate: string | null;
}

async function getTask(taskId: string): Promise<TaskDetail | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userMeta } = await supabase.from('users').select('organization_id').eq('id', user.id).single();
    if (!userMeta?.organization_id) return null;

    const { data } = await supabase
      .from('tasks')
      .select('*, assignee:users!tasks_assignee_id_fkey(id, full_name, avatar_url)')
      .eq('id', taskId)
      .eq('organization_id', userMeta.organization_id)
      .single();

    if (!data) return null;

    // Get proposal name if linked
    let proposalName: string | null = null;
    if (data.proposal_id) {
      const { data: proposal } = await supabase
        .from('proposals')
        .select('name')
        .eq('id', data.proposal_id)
        .single();
      proposalName = proposal?.name ?? null;
    }

    // Get parent task title if subtask
    let parentTaskTitle: string | null = null;
    if (data.parent_task_id) {
      const { data: parent } = await supabase
        .from('tasks')
        .select('title')
        .eq('id', data.parent_task_id)
        .single();
      parentTaskTitle = parent?.title ?? null;
    }

    const assignee = data.assignee as { id: string; full_name: string; avatar_url: string | null } | null;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeName: assignee?.full_name ?? null,
      assigneeAvatar: assignee?.avatar_url ?? null,
      dueDate: data.due_date,
      startDate: data.start_date,
      estimatedHours: data.estimated_hours,
      actualHours: data.actual_hours,
      proposalName,
      parentTaskTitle,
      parentTaskId: data.parent_task_id,
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

async function getSubtasks(taskId: string): Promise<SubtaskRow[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, priority, assignee_id, due_date')
      .eq('parent_task_id', taskId)
      .order('sort_order');

    if (!data || data.length === 0) return [];

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
    }));
  } catch {
    return [];
  }
}



export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, subtasks] = await Promise.all([getTask(id), getSubtasks(id)]);

  if (!task) {
    return (
      <div className="rounded-xl border border-border bg-background px-8 py-16 text-center">
        <p className="text-sm text-text-secondary">Task not found.</p>
        <Link href="/app/tasks" className="mt-4 inline-block text-sm font-medium text-foreground hover:opacity-70">
          ← Back to Tasks
        </Link>
      </div>
    );
  }

  const completedSubtasks = subtasks.filter((s) => s.status === 'done').length;

  return (
    <TierGate feature="tasks">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS] ?? 'bg-bg-secondary text-text-secondary'}`}>
                {task.status.replace(/_/g, ' ')}
              </span>
              <StatusBadge status={task.priority} colorMap={TASK_PRIORITY_COLORS} />
            </div>
            <PageHeader
              title={<><FavoriteButton entityType="task" entityId={id} />{task.title}</>}
            >
              <TaskDetailActions taskId={id} taskTitle={task.title} />
              <TaskWatchButton taskId={id} />
            </PageHeader>
            {task.description && (
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Timer */}
          <TaskTimer taskId={id} taskTitle={task.title} />

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">
                Subtasks
                {subtasks.length > 0 && (
                  <span className="ml-2 text-text-muted font-normal">
                    {completedSubtasks}/{subtasks.length}
                  </span>
                )}
              </h2>
            </div>

            {subtasks.length > 0 && (
              <div className="mb-4">
                <div className="h-1.5 w-full rounded-full bg-bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {subtasks.length === 0 ? (
              <EmptyState message="No subtasks yet" className="border-bg-secondary/30 hidden shadow-none" />
            ) : (
              <div className="rounded-xl border border-border bg-background divide-y divide-border overflow-hidden">
                {subtasks.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/app/tasks/${sub.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-secondary/50 transition-colors"
                  >
                    <div className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${sub.status === 'done' ? 'border-green-500 bg-green-500' : 'border-border'}`}>
                      {sub.status === 'done' && (
                        <Check className="h-full w-full p-px text-white" />
                      )}
                    </div>
                    <span className={`flex-1 text-sm ${sub.status === 'done' ? 'text-text-muted line-through' : 'text-foreground'}`}>
                      {sub.title}
                    </span>
                    <StatusBadge status={sub.priority} colorMap={TASK_PRIORITY_COLORS} />
                    {sub.assigneeName && (
                      <span className="text-xs text-text-muted">{sub.assigneeName}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Checklist */}
          <TaskChecklist taskId={id} />

          {/* Attachments */}
          <TaskAttachments taskId={id} />

          {/* Comments */}
          <TaskComments taskId={id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-background p-5 space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted">Details</h3>

            <div className="space-y-3">
              {/* Assignee */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Assignee</span>
                <div className="flex items-center gap-2">
                  {task.assigneeAvatar ? (
                    <img src={task.assigneeAvatar} alt="" className="h-5 w-5 rounded-full" />
                  ) : null}
                  <span className="text-sm text-foreground">{task.assigneeName ?? 'Unassigned'}</span>
                </div>
              </div>

              {/* Due date */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Due Date</span>
                <span className="text-sm text-foreground">
                  {task.dueDate ? formatDate(task.dueDate) : '—'}
                </span>
              </div>

              {/* Start date */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Start Date</span>
                <span className="text-sm text-foreground">
                  {task.startDate ? formatDate(task.startDate) : '—'}
                </span>
              </div>

              {/* Estimated hours */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Estimated</span>
                <span className="text-sm text-foreground">
                  {task.estimatedHours ? `${task.estimatedHours}h` : '—'}
                </span>
              </div>

              {/* Actual hours */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Actual</span>
                <span className="text-sm text-foreground">
                  {task.actualHours ? `${task.actualHours}h` : '—'}
                </span>
              </div>

              {/* Project */}
              {task.proposalName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Project</span>
                  <span className="text-sm text-foreground truncate max-w-[60%]">{task.proposalName}</span>
                </div>
              )}

              {/* Created */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Created</span>
                <span className="text-sm text-text-secondary">
                  {formatDate(task.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Dependencies */}
          <div className="rounded-xl border border-border bg-background p-5">
            <TaskDependencies taskId={id} />
          </div>

          {/* Activity Feed */}
          <TaskActivityFeed taskId={id} />
        </div>
      </div>
    </TierGate>
  );
}
