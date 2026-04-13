'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  /** Currently selected date (ISO string or Date) */
  selectedDate: Date;
  /** Called when user clicks a day */
  onSelectDate: (date: Date) => void;
  /** Set of ISO date strings (YYYY-MM-DD) that have schedule items */
  datesWithItems?: Set<string>;
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isoDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function MiniCalendar({ selectedDate, onSelectDate, datesWithItems }: MiniCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Build array of day cells: null = empty padding
    const cells: (Date | null)[] = [];

    // Padding before first day
    for (let i = 0; i < startDow; i++) cells.push(null);

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }

    // Split into weeks
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    // Pad last row
    const lastRow = rows[rows.length - 1];
    while (lastRow.length < 7) lastRow.push(null);

    return rows;
  }, [viewMonth, viewYear]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function goToToday() {
    const now = new Date();
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
    onSelectDate(now);
  }

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded-md hover:bg-bg-secondary transition-colors text-text-secondary"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={goToToday}
          className="text-sm font-semibold text-foreground hover:text-interactive transition-colors"
        >
          {monthLabel}
        </button>
        <button
          onClick={nextMonth}
          className="p-1 rounded-md hover:bg-bg-secondary transition-colors text-text-secondary"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-text-muted uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {weeks.flat().map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} className="h-8" />;
          }

          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const hasItems = datesWithItems?.has(isoDateKey(day));

          return (
            <button
              key={isoDateKey(day)}
              onClick={() => onSelectDate(day)}
              className={`
                relative h-8 w-full flex items-center justify-center rounded-md text-xs font-medium
                transition-all duration-150
                ${isSelected
                  ? 'bg-foreground text-background shadow-sm'
                  : isToday
                    ? 'bg-interactive/10 text-interactive font-bold ring-1 ring-interactive/30'
                    : 'text-foreground hover:bg-bg-secondary'
                }
              `}
            >
              {day.getDate()}
              {hasItems && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-interactive" />
              )}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      {!isSameDay(selectedDate, today) && (
        <button
          onClick={goToToday}
          className="mt-3 w-full text-xs font-medium text-interactive hover:text-interactive/80 transition-colors"
        >
          ← Back to today
        </button>
      )}
    </div>
  );
}
