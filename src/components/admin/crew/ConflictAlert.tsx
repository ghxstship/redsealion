'use client';

import React from 'react';

interface Conflict {
  proposalName: string;
  venueName: string;
  shiftStart: string;
  shiftEnd: string;
}

interface ConflictAlertProps {
  conflicts: Conflict[];
}

export default function ConflictAlert({ conflicts }: ConflictAlertProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="bg-red-500/10 border border-red-300 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="text-red-600 font-bold text-lg leading-none mt-0.5">!</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            Booking Conflicts Detected
          </h3>
          <ul className="space-y-2">
            {conflicts.map((conflict, idx) => (
              <li
                key={idx}
                className="text-sm text-red-700 bg-red-100 rounded-lg px-3 py-2"
              >
                <p className="font-medium">
                  {conflict.proposalName} &mdash; {conflict.venueName}
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {new Date(conflict.shiftStart).toLocaleString()} &ndash;{' '}
                  {new Date(conflict.shiftEnd).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
