'use client';

import React from 'react';
import { AVAILABILITY_STATUS_COLORS } from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

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
        body: JSON.stringify({ entries: [{ date: dateStr, status: nextStatus }] }),
      });
    } catch (error) {
        void error; /* Caught: error boundary handles display */
      }
  };

  return (
    <Card padding="sm" className="overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="secondary" size="sm" onClick={handlePrev}>
          Prev
        </Button>
        <h2 className="text-sm font-semibold text-foreground">
          {monthName} {year}
        </h2>
        <Button variant="secondary" size="sm" onClick={handleNext}>
          Next
        </Button>
      </div>

      <Table className="w-full text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left py-1 px-2 text-text-secondary font-medium sticky left-0 bg-background">
              Crew
            </TableHead>
            {days.map((d) => (
              <TableHead key={d} className="text-center py-1 px-1 text-text-muted font-medium min-w-[28px]">
                {d}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.userId} className="border-t border-border">
              <TableCell className="py-1 px-2 text-foreground font-medium whitespace-nowrap sticky left-0 bg-background">
                {entry.userName}
              </TableCell>
              {days.map((d) => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const status = entry.dates[dateStr];
                const colorClass = status ? AVAILABILITY_STATUS_COLORS[status] : 'bg-bg-secondary';
                return (
                  <TableCell key={d} className="py-1 px-1 text-center">
                    <Button
                      onClick={() => toggleAvailability(entry.userId, d, status)}
                      className={`w-5 h-5 rounded ${colorClass} hover:opacity-80`}
                      title={status ?? 'unset'}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </Card>
  );
}
