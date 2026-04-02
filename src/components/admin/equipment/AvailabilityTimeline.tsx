'use client';

import React from 'react';

interface Reservation {
  id: string;
  proposalName: string;
  reservedFrom: string;
  reservedUntil: string;
  status: string;
}

interface AvailabilityTimelineProps {
  reservations: Reservation[];
  from: string;
  to: string;
}

const STATUS_COLORS: Record<string, string> = {
  reserved: 'bg-blue-400',
  checked_out: 'bg-green-500',
  returned: 'bg-gray-400',
};

export default function AvailabilityTimeline({ reservations, from, to }: AvailabilityTimelineProps) {
  const startDate = new Date(from);
  const endDate = new Date(to);
  const totalMs = endDate.getTime() - startDate.getTime();
  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));

  const dayLabels: string[] = [];
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dayLabels.push(d.toLocaleDateString('default', { month: 'short', day: 'numeric' }));
  }

  const getPosition = (dateStr: string) => {
    const d = new Date(dateStr);
    const offset = d.getTime() - startDate.getTime();
    return Math.max(0, Math.min(100, (offset / totalMs) * 100));
  };

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-4">
      <div className="relative">
        {/* Day tick labels */}
        <div className="flex justify-between text-xs text-text-muted mb-2">
          {dayLabels.filter((_, i) => i % Math.max(1, Math.floor(dayLabels.length / 10)) === 0).map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>

        {/* Timeline track */}
        <div className="relative h-6 bg-bg-secondary rounded">
          {reservations.map((r) => {
            const left = getPosition(r.reservedFrom);
            const right = getPosition(r.reservedUntil);
            const width = Math.max(1, right - left);
            const color = STATUS_COLORS[r.status] ?? 'bg-gray-300';

            return (
              <div
                key={r.id}
                className={`absolute top-0 h-full rounded ${color} opacity-80 hover:opacity-100 cursor-pointer`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${r.proposalName} (${r.status})\n${new Date(r.reservedFrom).toLocaleDateString()} - ${new Date(r.reservedUntil).toLocaleDateString()}`}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-blue-400" /> Reserved
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-green-500" /> Checked Out
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-gray-400" /> Returned
        </span>
      </div>
    </div>
  );
}
