'use client';

import React from 'react';

interface CalendarEntry {
  userId: string;
  userName: string;
  dates: Record<string, 'available' | 'unavailable' | 'tentative'>;
}

interface AvailabilityCalendarProps {
  entries: CalendarEntry[];
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-400',
  unavailable: 'bg-red-400',
  tentative: 'bg-yellow-400',
};

export default function AvailabilityCalendar({
  entries,
  month,
  year,
  onMonthChange,
}: AvailabilityCalendarProps) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  const handlePrev = () => {
    if (month === 1) {
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  const toggleAvailability = async (userId: string, day: number, currentStatus?: string) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const nextStatus =
      currentStatus === 'available'
        ? 'unavailable'
        : currentStatus === 'unavailable'
          ? 'tentative'
          : 'available';

    try {
      await fetch(`/api/crew/${userId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, status: nextStatus }),
      });
    } catch {
      // silently fail; parent can refetch
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="px-3 py-1 text-sm rounded bg-bg-secondary text-foreground hover:bg-bg-tertiary"
        >
          Prev
        </button>
        <h2 className="text-sm font-semibold text-foreground">
          {monthName} {year}
        </h2>
        <button
          onClick={handleNext}
          className="px-3 py-1 text-sm rounded bg-bg-secondary text-foreground hover:bg-bg-tertiary"
        >
          Next
        </button>
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-1 px-2 text-text-secondary font-medium sticky left-0 bg-white">
              Crew
            </th>
            {days.map((d) => (
              <th key={d} className="text-center py-1 px-1 text-text-muted font-medium min-w-[28px]">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.userId} className="border-t border-border">
              <td className="py-1 px-2 text-foreground font-medium whitespace-nowrap sticky left-0 bg-white">
                {entry.userName}
              </td>
              {days.map((d) => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const status = entry.dates[dateStr];
                const colorClass = status ? STATUS_COLORS[status] : 'bg-bg-secondary';
                return (
                  <td key={d} className="py-1 px-1 text-center">
                    <button
                      onClick={() => toggleAvailability(entry.userId, d, status)}
                      className={`w-5 h-5 rounded ${colorClass} hover:opacity-80`}
                      title={status ?? 'unset'}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-4 mt-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-400" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-red-400" /> Unavailable
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-yellow-400" /> Tentative
        </span>
      </div>
    </div>
  );
}
