'use client';

import Link from 'next/link';
import { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'proposal' | 'venue_activation' | 'crew_booking';
  date: string;
  end_date?: string;
}

const EVENT_COLORS: Record<string, string> = {
  proposal: 'bg-blue-100 text-blue-800 border-blue-200',
  venue_activation: 'bg-purple-100 text-purple-800 border-purple-200',
  crew_booking: 'bg-green-100 text-green-800 border-green-200',
};

const EVENT_LABELS: Record<string, string> = {
  proposal: 'Proposal',
  venue_activation: 'Activation',
  crew_booking: 'Crew',
};

const fallbackEvents: CalendarEvent[] = [
  { id: 'evt_001', title: 'Nike SNKRS Fest 2026', type: 'proposal', date: '2026-04-15', end_date: '2026-04-17' },
  { id: 'evt_002', title: 'Convention Center Setup', type: 'venue_activation', date: '2026-04-14' },
  { id: 'evt_003', title: 'Alex Rivera - Lighting', type: 'crew_booking', date: '2026-04-15' },
  { id: 'evt_004', title: 'Jordan Lee - Audio', type: 'crew_booking', date: '2026-04-15' },
  { id: 'evt_005', title: 'Samsung Galaxy Unpacked', type: 'proposal', date: '2026-04-22', end_date: '2026-04-24' },
  { id: 'evt_006', title: 'Barclays Center Load-in', type: 'venue_activation', date: '2026-04-21' },
  { id: 'evt_007', title: 'Sam Patel - Video', type: 'crew_booking', date: '2026-04-22' },
  { id: 'evt_008', title: 'Spotify Wrapped Live', type: 'proposal', date: '2026-05-10', end_date: '2026-05-11' },
  { id: 'evt_009', title: 'Taylor Brooks - Fabrication', type: 'crew_booking', date: '2026-05-09' },
];

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
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const days = getCalendarDays(year, month);
  const today = new Date();

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Group events by day
  const eventsByDay = new Map<number, CalendarEvent[]>();
  for (const event of fallbackEvents) {
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
        <div className="flex gap-2">
          <button
            onClick={() => setView('month')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              view === 'month'
                ? 'border-foreground bg-foreground text-white'
                : 'border-border bg-white text-foreground hover:bg-bg-secondary'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              view === 'week'
                ? 'border-foreground bg-foreground text-white'
                : 'border-border bg-white text-foreground hover:bg-bg-secondary'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={goToPrev}
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
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
          className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Next &rarr;
        </button>
      </div>

      {/* Month view */}
      {view === 'month' && (
        <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
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
        <div className="rounded-xl border border-border bg-white overflow-hidden overflow-x-auto">
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
              const dayEvents = fallbackEvents.filter((e) => e.date === dateStr);
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
      </div>
    </>
  );
}
