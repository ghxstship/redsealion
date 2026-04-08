'use client';

/**
 * On-task time tracker — start/stop timer linked to the time tracking module.
 *
 * @module components/admin/tasks/TaskTimer
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';
import { Play, Pause, Clock } from 'lucide-react';

interface TaskTimerProps {
  taskId: string;
  taskTitle: string;
}

export default function TaskTimer({ taskId, taskTitle }: TaskTimerProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(elapsed);
  
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // Tick
  useEffect(() => {
    if (running) {
      startTimeRef.current = Date.now() - elapsedRef.current * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(
          Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000),
        );
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function formatTime(totalSecs: number): string {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const handleStop = useCallback(async () => {
    setRunning(false);
    if (elapsed < 60) return; // Don't save < 1 minute

    setSaving(true);
    try {
      await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          description: taskTitle,
          duration_minutes: Math.round(elapsed / 60),
          date: new Date().toISOString().split('T')[0],
        }),
      });
      setElapsed(0);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }, [elapsed, taskId, taskTitle]);

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-text-muted" />
          <span className="text-sm font-semibold text-foreground">Timer</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-lg font-mono tabular-nums ${
              running ? 'text-green-600' : 'text-foreground'
            }`}
          >
            {formatTime(elapsed)}
          </span>

          {!running ? (
            <Button
              size="sm"
              onClick={() => setRunning(true)}
              disabled={saving}
            >
              <Play size={14} className="mr-1" />
              Start
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleStop}
            >
              <Pause size={14} className="mr-1" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {saving && (
        <p className="mt-2 text-xs text-text-muted">Saving time entry…</p>
      )}
    </div>
  );
}
