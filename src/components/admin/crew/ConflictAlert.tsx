'use client';

import React from 'react';
import Alert from '@/components/ui/Alert';

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
    <Alert variant="error" className="shadow-sm">
      <h3 className="text-sm font-semibold text-red-800 mb-2">
        Booking Conflicts Detected
      </h3>
      <ul className="space-y-2 w-full">
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
    </Alert>
  );
}
