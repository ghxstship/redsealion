'use client';

import React, { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'proposal' | 'venue' | 'booking';
  color: string;
}

interface EventCalendarProps {
  events: CalendarEvent[];
}

export default function EventCalendar({ events }: EventCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', {
    month: 'long',
  });

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((ev) => {
      const start = ev.date.slice(0, 10);
      const end = ev.endDate ? ev.endDate.slice(0, 10) : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-background border border-border rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="px-3 py-1 text-sm rounded bg-bg-secondary text-foreground hover:bg-bg-tertiary"
        >
          Prev
        </button>
        <h2 className="text-sm font-semibold text-foreground">
          {monthName} {currentYear}
        </h2>
        <button
          onClick={handleNext}
          className="px-3 py-1 text-sm rounded bg-bg-secondary text-foreground hover:bg-bg-tertiary"
        >
          Next
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              {dayNames.map((d) => (
                <th key={d} className="text-xs text-text-muted font-medium py-1 text-center">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => (
                  <td
                    key={di}
                    className="border border-border p-1 align-top h-20 text-xs min-w-[70px]"
                  >
                    {day != null && (
                      <>
                        <div className="text-text-secondary font-medium mb-0.5">{day}</div>
                        <div className="space-y-0.5">
                          {getEventsForDay(day)
                            .slice(0, 3)
                            .map((ev) => (
                              <div
                                key={ev.id}
                                className="truncate rounded px-1 py-0.5 text-white text-[10px] leading-tight"
                                style={{ backgroundColor: ev.color }}
                                title={ev.title}
                              >
                                {ev.title}
                              </div>
                            ))}
                          {getEventsForDay(day).length > 3 && (
                            <div className="text-text-muted text-[10px]">
                              +{getEventsForDay(day).length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
