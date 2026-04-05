'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const TIMER_STORAGE_KEY = 'flytedeck_active_timer';

interface TimerState {
  startedAt: number;
  description: string;
  project: string;
  billable: boolean;
}

/* ─────────────────────────────────────────────────────────
   Component — compact timer pill for the header
   ───────────────────────────────────────────────────────── */

export default function MiniTimer() {
  const [elapsed, setElapsed] = useState<number | null>(null);

  const checkTimer = useCallback(() => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!stored) {
        setElapsed(null);
        return;
      }
      const state: TimerState = JSON.parse(stored);
      const seconds = Math.floor((Date.now() - state.startedAt) / 1000);
      if (seconds > 0 && seconds < 86400) {
        setElapsed(seconds);
      } else {
        setElapsed(null);
      }
    } catch {
      setElapsed(null);
    }
  }, []);

  useEffect(() => {
    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [checkTimer]);

  if (elapsed === null) return null;

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const display = h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${m}m`;

  return (
    <Link
      href="/app/time/timer"
      className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 hover:border-green-300"
      title="Timer running — click to view"
      id="mini-timer-indicator"
    >
      {/* Pulse dot */}
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
      <span className="tabular-nums">{display}</span>
    </Link>
  );
}
