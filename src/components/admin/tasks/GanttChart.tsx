'use client';

/**
 * Interactive Gantt Chart with real task data and dependency visualization.
 *
 * Features:
 * - Real task data via props
 * - Date-based column rendering (day/week/month zoom)
 * - Dependency arrows between tasks (SVG)
 * - Color-coded status bars
 * - Today marker
 *
 * @module components/admin/tasks/GanttChart
 */

import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';

interface GanttTask {
  id: string;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  assigneeName: string | null;
}

interface GanttDependency {
  taskId: string;
  dependsOnTaskId: string;
}

interface GanttChartProps {
  tasks?: GanttTask[];
  dependencies?: GanttDependency[];
}

type ZoomLevel = 'day' | 'week' | 'month';

function statusBarColor(status: string): string {
  const map: Record<string, string> = {
    todo: 'bg-gray-400',
    in_progress: 'bg-blue-500',
    review: 'bg-purple-500',
    done: 'bg-green-500',
    blocked: 'bg-red-500',
    cancelled: 'bg-gray-300',
  };
  return map[status] ?? 'bg-gray-400';
}

const DEMO_TASKS: GanttTask[] = [
  { id: '1', title: 'Site survey', startDate: '2026-04-01', dueDate: '2026-04-03', status: 'done', assigneeName: 'Sarah' },
  { id: '2', title: 'Design phase', startDate: '2026-04-04', dueDate: '2026-04-11', status: 'in_progress', assigneeName: 'Mike' },
  { id: '3', title: 'Client review', startDate: '2026-04-12', dueDate: '2026-04-14', status: 'todo', assigneeName: null },
  { id: '4', title: 'Fabrication', startDate: '2026-04-12', dueDate: '2026-04-25', status: 'todo', assigneeName: 'Team' },
  { id: '5', title: 'Content creation', startDate: '2026-04-07', dueDate: '2026-04-14', status: 'in_progress', assigneeName: 'Lisa' },
  { id: '6', title: 'Load-in', startDate: '2026-04-26', dueDate: '2026-04-27', status: 'todo', assigneeName: 'Crew' },
  { id: '7', title: 'Activation', startDate: '2026-04-28', dueDate: '2026-04-30', status: 'todo', assigneeName: null },
];

const DEMO_DEPS: GanttDependency[] = [
  { taskId: '2', dependsOnTaskId: '1' },
  { taskId: '3', dependsOnTaskId: '2' },
  { taskId: '4', dependsOnTaskId: '3' },
  { taskId: '6', dependsOnTaskId: '4' },
  { taskId: '6', dependsOnTaskId: '5' },
  { taskId: '7', dependsOnTaskId: '6' },
];

export default function GanttChart({ tasks, dependencies }: GanttChartProps) {
  const [zoom, setZoom] = useState<ZoomLevel>('week');
  const displayTasks = tasks && tasks.length > 0 ? tasks : DEMO_TASKS;
  const displayDeps = dependencies ?? DEMO_DEPS;

  // Compute date range
  const { columns, startDate: timelineStart, colWidth } = useMemo(() => {
    const allDates = displayTasks.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean)) as string[];
    if (allDates.length === 0) {
      return { columns: [] as string[], startDate: new Date(), colWidth: 120 };
    }

    const min = new Date(Math.min(...allDates.map((d) => new Date(d).getTime())));
    const max = new Date(Math.max(...allDates.map((d) => new Date(d).getTime())));

    // Pad by a few days
    min.setDate(min.getDate() - 2);
    max.setDate(max.getDate() + 5);

    const cols: string[] = [];
    const d = new Date(min);
    const widths: Record<ZoomLevel, number> = { day: 40, week: 120, month: 200 };

    if (zoom === 'month') {
      while (d <= max) {
        cols.push(d.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
        d.setMonth(d.getMonth() + 1);
      }
    } else if (zoom === 'week') {
      while (d <= max) {
        const weekStart = new Date(d);
        cols.push(`${weekStart.getMonth() + 1}/${weekStart.getDate()}`);
        d.setDate(d.getDate() + 7);
      }
    } else {
      while (d <= max) {
        cols.push(`${d.getMonth() + 1}/${d.getDate()}`);
        d.setDate(d.getDate() + 1);
      }
    }

    return { columns: cols, startDate: new Date(min), colWidth: widths[zoom] };
  }, [displayTasks, zoom]);

  // Map tasks to pixel positions
  const taskBars = useMemo(() => {
    const totalWidth = columns.length * colWidth;
    const msPerCol = zoom === 'month' ? 30 * 86400000 : zoom === 'week' ? 7 * 86400000 : 86400000;
    const timelineMs = columns.length * msPerCol;

    return displayTasks.map((task) => {
      if (!task.startDate || !task.dueDate) return { ...task, left: 0, width: 0 };

      const start = new Date(task.startDate).getTime() - timelineStart.getTime();
      const end = new Date(task.dueDate).getTime() - timelineStart.getTime() + 86400000;

      const left = Math.max(0, (start / timelineMs) * totalWidth);
      const width = Math.max(8, ((end - start) / timelineMs) * totalWidth);

      return { ...task, left, width };
    });
  }, [displayTasks, columns.length, colWidth, timelineStart, zoom]);

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-bg-secondary">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Timeline</span>
        <div className="flex gap-1">
          {(['day', 'week', 'month'] as ZoomLevel[]).map((z) => (
            <Button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                zoom === z
                  ? 'bg-foreground text-white'
                  : 'text-text-muted hover:bg-background'
              }`}
            >
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: `${200 + columns.length * colWidth}px` }}>
          {/* Header */}
          <div className="flex border-b border-border bg-bg-secondary/50">
            <div className="w-[200px] flex-shrink-0 px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-muted border-r border-border">
              Task
            </div>
            <div className="flex-1 flex relative">
              {columns.map((col, i) => (
                <div
                  key={`${col}-${i}`}
                  style={{ width: colWidth }}
                  className="px-1 py-3 text-center text-xs font-medium text-text-muted border-r border-border/30 last:border-r-0 flex-shrink-0"
                >
                  {col}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div className="relative">
            {taskBars.map((task, idx) => (
              <div key={task.id} className="flex border-b border-border last:border-b-0 hover:bg-bg-secondary/30 transition-colors">
                <div className="w-[200px] flex-shrink-0 px-4 py-3 border-r border-border">
                  <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
                  {task.assigneeName && (
                    <div className="text-xs text-text-muted mt-0.5">{task.assigneeName}</div>
                  )}
                </div>
                <div className="flex-1 relative py-3" style={{ minHeight: '44px' }}>
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {columns.map((_, i) => (
                      <div key={i} style={{ width: colWidth }} className="border-r border-border/10 flex-shrink-0" />
                    ))}
                  </div>

                  {/* Task bar */}
                  {task.width > 0 && (
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${statusBarColor(task.status)} opacity-90 hover:opacity-100 transition-opacity cursor-pointer`}
                      style={{ left: task.left, width: task.width }}
                      title={`${task.title}: ${task.startDate} → ${task.dueDate}`}
                    />
                  )}

                  {/* Dependency arrows — simple right-to-left lines */}
                  {displayDeps
                    .filter((dep) => dep.taskId === task.id)
                    .map((dep) => {
                      const srcIdx = taskBars.findIndex((t) => t.id === dep.dependsOnTaskId);
                      if (srcIdx < 0) return null;
                      const src = taskBars[srcIdx];
                      if (!src || src.width === 0 || task.width === 0) return null;

                      const srcRight = src.left + src.width;
                      const dstLeft = task.left;
                      const rowDiff = idx - srcIdx;

                      return (
                        <svg
                          key={`${dep.dependsOnTaskId}-${dep.taskId}`}
                          className="absolute top-0 left-0 pointer-events-none"
                          style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'visible',
                          }}
                        >
                          <line
                            x1={srcRight}
                            y1={-rowDiff * 44 + 22}
                            x2={dstLeft}
                            y2={22}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            strokeDasharray="4 2"
                            markerEnd="url(#arrowhead)"
                          />
                          <defs>
                            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                              <polygon points="0 0, 6 2, 0 4" fill="#94a3b8" />
                            </marker>
                          </defs>
                        </svg>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-border px-4 py-2">
        {[
          { label: 'Done', color: 'bg-green-500' },
          { label: 'In Progress', color: 'bg-blue-500' },
          { label: 'To Do', color: 'bg-gray-400' },
          { label: 'Blocked', color: 'bg-red-500' },
          { label: 'Review', color: 'bg-purple-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
            <span className="text-xs text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
