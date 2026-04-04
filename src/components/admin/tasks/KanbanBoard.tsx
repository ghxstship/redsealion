'use client';

import { useEffect, useState } from 'react';

interface KanbanTask {
  id: string;
  title: string;
  priority: string;
  assignee: string | null;
}

const COLUMNS = ['todo', 'in_progress', 'review', 'done'] as const;
type Column = (typeof COLUMNS)[number];

const COLUMN_LABELS: Record<Column, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const STATUS_MAP: Record<string, Column> = {
  todo: 'todo',
  in_progress: 'in_progress',
  review: 'review',
  done: 'done',
};

function priorityDot(priority: string): string {
  const map: Record<string, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-400',
    medium: 'bg-yellow-400',
    low: 'bg-gray-300',
  };
  return map[priority] ?? 'bg-gray-300';
}

function emptyBoard(): Record<Column, KanbanTask[]> {
  return { todo: [], in_progress: [], review: [], done: [] };
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Record<Column, KanbanTask[]>>(emptyBoard);

  useEffect(() => {
    async function loadTasks() {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        if (!userData) return;

        const { data: taskRows } = await supabase
          .from('tasks')
          .select('id, title, priority, status, assigned_to, users!tasks_assigned_to_fkey(full_name)')
          .eq('organization_id', userData.organization_id)
          .order('sort_order', { ascending: true });

        if (!taskRows || taskRows.length === 0) return;

        const grouped = emptyBoard();
        for (const row of taskRows) {
          const col = STATUS_MAP[row.status as string] ?? 'todo';
          const assigneeUser = row.users as unknown as { full_name: string } | null;
          grouped[col].push({
            id: row.id,
            title: row.title,
            priority: (row.priority as string) ?? 'medium',
            assignee: assigneeUser?.full_name ?? null,
          });
        }
        setTasks(grouped);
      } catch {
        // Silent fail — board shows empty
      }
    }
    loadTasks();
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <div key={col} className="flex-shrink-0 w-72">
          <div className="rounded-xl border border-border bg-bg-secondary">
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">{COLUMN_LABELS[col]}</h3>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-bg-tertiary text-xs text-text-muted">
                  {tasks[col].length}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-3 min-h-[200px]">
              {tasks[col].map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm cursor-move hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${priorityDot(task.priority)}`} />
                    <p className="text-sm font-medium text-foreground">{task.title}</p>
                  </div>
                  {task.assignee && (
                    <p className="mt-2 text-xs text-text-muted pl-4">{task.assignee}</p>
                  )}
                </div>
              ))}
              {tasks[col].length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-text-muted">
                  No tasks
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
