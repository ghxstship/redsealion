'use client';

/**
 * Interactive Kanban board with drag-and-drop status transitions.
 *
 * Uses @dnd-kit/core (already installed for Pipeline) to let users
 * drag task cards between status columns. Optimistically patches
 * the task status via API.
 *
 * @module components/admin/tasks/KanbanBoard
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import StatusBadge, { TASK_PRIORITY_COLORS } from '@/components/ui/StatusBadge';
import { castRelation } from '@/lib/supabase/cast-relation';
import { mapTaskStatusToColumn } from '@/lib/status-mapper';

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */

interface KanbanTask {
  id: string;
  title: string;
  priority: string;
  assignee: string | null;
  dueDate: string | null;
}

const COLUMNS = ['todo', 'in_progress', 'review', 'done'] as const;
type Column = (typeof COLUMNS)[number];

const COLUMN_LABELS: Record<Column, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const COLUMN_COLORS: Record<Column, string> = {
  todo: 'bg-text-muted',
  in_progress: 'bg-blue-500',
  review: 'bg-purple-500',
  done: 'bg-green-500',
};

/* ──────────────────────────────────────────────────────────────
   Droppable Column
   ────────────────────────────────────────────────────────────── */

function DroppableColumn({
  column,
  children,
  count,
}: {
  column: Column;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-xl border transition-colors ${
        isOver
          ? 'border-foreground/30 bg-bg-tertiary'
          : 'border-border bg-bg-secondary'
      }`}
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${COLUMN_COLORS[column]}`} />
            <h3 className="text-sm font-semibold text-foreground">
              {COLUMN_LABELS[column]}
            </h3>
          </div>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bg-tertiary px-1.5 text-xs font-medium text-text-muted">
            {count}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2 min-h-[200px]">
        {children}
        {count === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-text-muted">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Draggable Task Card
   ────────────────────────────────────────────────────────────── */

function DraggableTaskCard({ task }: { task: KanbanTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-lg border border-border bg-background px-4 py-3 shadow-sm cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

function TaskCardContent({ task }: { task: KanbanTask }) {
  const isOverdue =
    task.dueDate && new Date(task.dueDate + 'T23:59:59') < new Date();

  return (
    <>
      <Link
        href={`/app/tasks/${task.id}`}
        className="text-sm font-medium text-foreground hover:underline line-clamp-2"
        onClick={(e) => e.stopPropagation()}
      >
        {task.title}
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge status={task.priority} colorMap={TASK_PRIORITY_COLORS} />
        {task.dueDate && (
          <span
            className={`text-[11px] tabular-nums ${
              isOverdue ? 'text-red-600 font-medium' : 'text-text-muted'
            }`}
          >
            {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
      {task.assignee && (
        <p className="mt-1.5 text-xs text-text-muted truncate">
          {task.assignee}
        </p>
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Board (main component)
   ────────────────────────────────────────────────────────────── */

function emptyBoard(): Record<Column, KanbanTask[]> {
  return { todo: [], in_progress: [], review: [], done: [] };
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<Record<Column, KanbanTask[]>>(emptyBoard);
  const [activeDragTask, setActiveDragTask] = useState<KanbanTask | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    async function loadTasks() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) return;

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: taskRows } = await supabase
          .from('tasks')
          .select(
            'id, title, priority, status, due_date, assigned_to, users!tasks_assigned_to_fkey(full_name)',
          )
          .eq('organization_id', ctx.organizationId)
          .is('parent_task_id', null)
          .order('sort_order', { ascending: true });

        if (!taskRows || taskRows.length === 0) {
          setLoading(false);
          return;
        }

        const grouped = emptyBoard();
        for (const row of taskRows) {
          const col = mapTaskStatusToColumn(row.status as string);
          const assigneeUser = castRelation<{
            full_name: string;
          }>(row.users);
          grouped[col].push({
            id: row.id,
            title: row.title,
            priority: (row.priority as string) ?? 'medium',
            assignee: assigneeUser?.full_name ?? null,
            dueDate: row.due_date as string | null,
          });
        }
        setTasks(grouped);
      } catch {
        // Silent fail — board shows empty
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  /* ── Drag handlers ─────────────────────────────────────────── */

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const allTasks = Object.values(tasks).flat();
      const task = allTasks.find((t) => t.id === event.active.id);
      setActiveDragTask(task ?? null);
    },
    [tasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragTask(null);
      const { active, over } = event;
      if (!over) return;

      const newStatus = over.id as Column;
      if (!COLUMNS.includes(newStatus)) return;

      // Find which column the task was in
      const sourceColumn = (Object.keys(tasks) as Column[]).find((col) =>
        tasks[col].some((t) => t.id === active.id),
      );
      if (!sourceColumn || sourceColumn === newStatus) return;

      // Optimistic move
      setTasks((prev) => {
        const task = prev[sourceColumn].find((t) => t.id === active.id);
        if (!task) return prev;

        return {
          ...prev,
          [sourceColumn]: prev[sourceColumn].filter(
            (t) => t.id !== active.id,
          ),
          [newStatus]: [...prev[newStatus], task],
        };
      });

      // Persist to API
      fetch(`/api/tasks/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {
        // Revert on failure
        setTasks((prev) => {
          const task = prev[newStatus].find((t) => t.id === active.id);
          if (!task) return prev;
          return {
            ...prev,
            [newStatus]: prev[newStatus].filter((t) => t.id !== active.id),
            [sourceColumn]: [...prev[sourceColumn], task],
          };
        });
      });
    },
    [tasks],
  );

  /* ── Render ─────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className="flex-shrink-0 w-72 rounded-xl border border-border bg-bg-secondary animate-pulse"
          >
            <div className="px-4 py-3 border-b border-border">
              <div className="h-4 w-24 rounded bg-bg-tertiary" />
            </div>
            <div className="p-3 space-y-2 min-h-[200px]">
              {Array.from({ length: col === 'todo' ? 3 : 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg border border-border bg-background"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalTasks = Object.values(tasks).reduce(
    (sum, col) => sum + col.length,
    0,
  );

  return (
    <div>
      {/* Summary */}
      <div className="mb-4 flex items-center gap-6">
        <div>
          <p className="text-xs text-text-muted">Total tasks</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {totalTasks}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted">Completed</p>
          <p className="text-lg font-semibold tabular-nums text-foreground">
            {tasks.done.length}
          </p>
        </div>
        {totalTasks > 0 && (
          <div>
            <p className="text-xs text-text-muted">Progress</p>
            <p className="text-lg font-semibold tabular-nums text-foreground">
              {Math.round((tasks.done.length / totalTasks) * 100)}%
            </p>
          </div>
        )}
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <DroppableColumn key={col} column={col} count={tasks[col].length}>
              {tasks[col].map((task) => (
                <DraggableTaskCard key={task.id} task={task} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeDragTask ? (
            <div className="w-72 rounded-lg border border-foreground/20 bg-background px-4 py-3 shadow-lg opacity-90">
              <TaskCardContent task={activeDragTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
