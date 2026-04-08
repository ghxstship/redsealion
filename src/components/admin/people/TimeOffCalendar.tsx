'use client';

import { useState } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function TimeOffCalendar() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday start
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border min-w-[600px]">
        <button onClick={prevMonth} className="text-sm text-text-secondary hover:text-foreground transition-colors">
          &larr; Prev
        </button>
        <h2 className="text-base font-semibold text-foreground">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="text-sm text-text-secondary hover:text-foreground transition-colors">
          Next &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 min-w-[600px]">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wider text-text-muted border-b border-border bg-bg-secondary">
            {day}
          </div>
        ))}
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[60px] px-2 py-1 border-b border-r border-border text-sm ${
              day === null ? 'bg-bg-secondary/50' : 'hover:bg-bg-secondary/50'
            }`}
          >
            {day !== null && (
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday(day)
                    ? 'bg-foreground text-white font-medium'
                    : 'text-foreground'
                }`}
              >
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
