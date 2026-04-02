'use client';

import { useState } from 'react';

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

const initialTasks: Record<Column, KanbanTask[]> = {
  todo: [
    { id: '1', title: 'Design booth layout', priority: 'high', assignee: 'Sarah C.' },
    { id: '2', title: 'Source materials', priority: 'medium', assignee: null },
  ],
  in_progress: [
    { id: '3', title: 'Build stage platform', priority: 'high', assignee: 'Mike J.' },
    { id: '4', title: 'Create LED content', priority: 'medium', assignee: 'Emily D.' },
  ],
  review: [
    { id: '5', title: 'Client signoff on mockups', priority: 'urgent', assignee: 'Jordan L.' },
  ],
  done: [
    { id: '6', title: 'Site survey complete', priority: 'low', assignee: 'Alex K.' },
  ],
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

export default function KanbanBoard() {
  const [tasks] = useState(initialTasks);

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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
