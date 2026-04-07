'use client';

import { useEffect, useState } from 'react';
import { resolveClientOrg } from '@/lib/auth/resolve-org-client';
import ViewTypeSwitcher, { getPersistedView } from '@/components/shared/ViewTypeSwitcher';
import { CalendarDays, CalendarRange } from 'lucide-react';
import { usePreferencesSafe } from '@/components/shared/PreferencesProvider';

const PERSIST_KEY = 'flytedeck:view:calendar';
interface CalendarEvent {
  id: string;
  title: string;
  type: 'proposal' | 'venue_activation' | 'crew_booking' | 'task';
  date: string;
  end_date?: string;
  href?: string;
}

const EVENT_COLORS: Record<string, string> = {
  proposal: 'bg-blue-100 text-blue-800 border-blue-200',
  venue_activation: 'bg-purple-100 text-purple-800 border-purple-200',
  crew_booking: 'bg-green-100 text-green-800 border-green-200',
  task: 'bg-amber-100 text-amber-800 border-amber-200',
};

const EVENT_LABELS: Record<string, string> = {
  proposal: 'Proposal',
  venue_activation: 'Activation',
  crew_booking: 'Crew',
  task: 'Task',
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

export default function CalendarPage() {
  const prefs = usePreferencesSafe();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const defaultView = prefs.loaded ? prefs.defaultCalendarView : 'month';
  const [view, setView] = useState<'month' | 'week'>(() =>
    getPersistedView(PERSIST_KEY, ['month', 'week'], defaultView === 'day' ? 'month' : defaultView) as 'month' | 'week',
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Fetch events from Supabase
  useEffect(() => {
    async function loadEvents() {
      try {
        const ctx = await resolveClientOrg();
        if (!ctx) return;
        const orgId = ctx.organizationId;

        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Fetch proposals with dates as "proposal" events
        const { data: proposals } = await supabase
          .from('proposals')
          .select('id, name, event_start_date, event_end_date')
          .eq('organization_id', orgId)
          .not('event_start_date', 'is', null);

        const proposalEvents: CalendarEvent[] = (proposals ?? [])
          .filter((p: Record<string, unknown>) => p.event_start_date)
          .map((p: Record<string, unknown>) => ({
            id: p.id as string,
            title: p.name as string,
            type: 'proposal' as const,
            date: (p.event_start_date as string).slice(0, 10),
            end_date: p.event_end_date ? (p.event_end_date as string).slice(0, 10) : undefined,
          }));

        // Fetch resource allocations as "crew_booking" events
        const { data: allocations } = await supabase
          .from('resource_allocations')
          .select('id, user_id, start_date, end_date, users(full_name)')
          .eq('organization_id', orgId);

        const crewEvents: CalendarEvent[] = (allocations ?? []).map((a: Record<string, unknown>) => ({
          id: a.id as string,
          title: `${(a.users as Record<string, string>)?.full_name ?? 'Crew'} — Booked`,
          type: 'crew_booking' as const,
          date: (a.start_date as string).slice(0, 10),
          end_date: a.end_date ? (a.end_date as string).slice(0, 10) : undefined,
        }));

        // Fetch tasks with due dates as "task" events
        const { data: taskRows } = await supabase
          .from('tasks')
          .select('id, title, due_date, status, priority')
          .eq('organization_id', orgId)
          .not('due_date', 'is', null)
          .neq('status', 'done');

        const taskEvents: CalendarEvent[] = (taskRows ?? [])
          .filter((t: Record<string, unknown>) => t.due_date)
          .map((t: Record<string, unknown>) => ({
            id: t.id as string,
            title: t.title as string,
            type: 'task' as const,
            date: (t.due_date as string).slice(0, 10),
            href: `/app/tasks/${t.id}`,
          }));

        setEvents([...proposalEvents, ...crewEvents, ...taskEvents]);
      } catch {
        // Silently fail — calendar shows empty
      }
    }
    loadEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const days = getCalendarDays(year, month);
  const today = new Date();

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group events by day
  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const eventDate = new Date(event.date + 'T00:00:00');
    if (eventDate.getFullYear() === year && eventDate.getMonth() === month) {
      const day = eventDate.getDate();
      if (!eventsByDay.has(day)) eventsByDay.set(day, []);
      eventsByDay.get(day)!.push(event);
    }
  }

  // Week view: get current week
  const weekStart = new Date(currentDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  function goToPrev() {
    if (view === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    }
  }

  function goToNext() {
    if (view === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Org-wide view of proposals, activations, and crew bookings.
          </p>
        </div>
        <ViewTypeSwitcher
          views={[
            { key: 'month', label: 'Month', icon: <CalendarDays size={13} /> },
            { key: 'week', label: 'Week', icon: <CalendarRange size={13} /> },
          ]}
          activeView={view}
          onSwitch={(key) => setView(key as 'month' | 'week')}
          persistKey={PERSIST_KEY}
        />
      </div>

      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={goToPrev}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          &larr; Previous
        </button>
        <h2 className="text-lg font-semibold text-foreground">
          {view === 'month'
            ? `${monthName} ${year}`
            : `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </h2>
        <button
          onClick={goToNext}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Next &rarr;
        </button>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-7 border-b border-border bg-bg-secondary min-w-[700px]">
            {weekdays.map((wd) => (
              <div
                key={wd}
                className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted"
              >
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-w-[700px]">
            {days.map((day, index) => {
              const isToday =
                day !== null &&
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate();
              const dayEvents = day !== null ? (eventsByDay.get(day) ?? []) : [];

              return (
                <div
                  key={index}
                  className={`min-h-[110px] border-b border-r border-border p-2 ${
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
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`rounded border px-1.5 py-0.5 text-xs truncate ${EVENT_COLORS[event.type]}`}
                            title={`${EVENT_LABELS[event.type]}: ${event.title}`}
                          >
                            {event.title}
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
      )}

      {/* Week view */}
      {view === 'week' && (
        <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-7 border-b border-border bg-bg-secondary min-w-[700px]">
            {weekDays.map((d) => {
              const isToday =
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate();
              return (
                <div
                  key={d.toISOString()}
                  className={`px-3 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                    isToday ? 'text-blue-600' : 'text-text-muted'
                  }`}
                >
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 min-w-[700px]">
            {weekDays.map((d) => {
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.date === dateStr);
              const isToday =
                d.getFullYear() === today.getFullYear() &&
                d.getMonth() === today.getMonth() &&
                d.getDate() === today.getDate();

              return (
                <div
                  key={dateStr}
                  className={`min-h-[200px] border-r border-border p-3 ${
                    isToday ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`rounded border px-2 py-1.5 text-xs ${EVENT_COLORS[event.type]}`}
                      >
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="mt-0.5 opacity-75">{EVENT_LABELS[event.type]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-blue-200 bg-blue-100" />
          Proposals
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-purple-200 bg-purple-100" />
          Venue Activations
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-green-200 bg-green-100" />
          Crew Bookings
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-amber-200 bg-amber-100" />
          Tasks Due
        </div>
      </div>
    </>
  );
}
