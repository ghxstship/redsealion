import { createClient } from '@/lib/supabase/server';
import { TierGate } from '@/components/shared/TierGate';
import Link from 'next/link';
import { resolveCurrentOrg } from '@/lib/auth/resolve-org';
import TaskViewSwitcher from '@/components/admin/tasks/TaskViewSwitcher';

interface CalendarTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'line-through opacity-50',
  done: 'line-through opacity-50',
};

function priorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}

async function getTasksForMonth(year: number, month: number): Promise<CalendarTask[]> {
  try {
    const supabase = await createClient();
    const ctx = await resolveCurrentOrg();
    if (!ctx) throw new Error('No auth');

    // Query tasks with due dates in the given month
    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date')
      .eq('organization_id', ctx.organizationId)
      .not('due_date', 'is', null)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date');

    if (!data) return [];

    return data.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
    }));
  } catch {
    return [];
  }
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  // Fill leading empty cells
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Fill actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return days;
}

export default async function TaskCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date();
  const year = sp.year ? parseInt(sp.year, 10) : today.getFullYear();
  const month = sp.month ? parseInt(sp.month, 10) : today.getMonth(); // 0-indexed

  const tasks = await getTasksForMonth(year, month);
  const days = getCalendarDays(year, month);
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' });

  // Group tasks by day of month
  const tasksByDay = new Map<number, CalendarTask[]>();
  for (const task of tasks) {
    const day = new Date(task.dueDate).getDate();
    if (!tasksByDay.has(day)) tasksByDay.set(day, []);
    tasksByDay.get(day)!.push(task);
  }

  // Navigation links
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <TierGate feature="tasks">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Task Calendar
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            View tasks by due date on a calendar.
          </p>
        </div>
        <TaskViewSwitcher />
      </div>

      {/* Month navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/app/tasks/calendar?year=${prevYear}&month=${prevMonth}`}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          &larr; Previous
        </Link>
        <h2 className="text-lg font-semibold text-foreground">
          {monthName} {year}
        </h2>
        <Link
          href={`/app/tasks/calendar?year=${nextYear}&month=${nextMonth}`}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Next &rarr;
        </Link>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border bg-bg-secondary min-w-[600px]">
          {weekdays.map((wd) => (
            <div
              key={wd}
              className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 min-w-[600px]">
          {days.map((day, index) => {
            const isToday =
              day !== null &&
              year === today.getFullYear() &&
              month === today.getMonth() &&
              day === today.getDate();
            const dayTasks = day !== null ? (tasksByDay.get(day) ?? []) : [];

            return (
              <div
                key={index}
                className={`min-h-[100px] border-b border-r border-border p-2 ${
                  day === null ? 'bg-bg-secondary/30' : ''
                } ${isToday ? 'bg-blue-50/50' : ''}`}
              >
                {day !== null && (
                  <>
                    <div
                      className={`mb-1 text-sm font-medium ${
                        isToday
                          ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white'
                          : 'text-text-secondary'
                      }`}
                    >
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`rounded border px-1.5 py-0.5 text-xs truncate ${priorityColor(task.priority)} ${STATUS_COLORS[task.status] ?? ''}`}
                          title={`${task.title} (${task.priority})`}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-red-200 bg-red-100" />
          Urgent
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-orange-200 bg-orange-100" />
          High
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-yellow-200 bg-yellow-100" />
          Medium
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-gray-200 bg-gray-100" />
          Low
        </div>
      </div>
    </TierGate>
  );
}
