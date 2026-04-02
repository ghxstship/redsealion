'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const TIMER_STORAGE_KEY = 'xpb_active_timer';

interface TimerState {
  startedAt: number; // epoch ms
  description: string;
  project: string;
  billable: boolean;
}

export default function TimerWidget() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [billable, setBillable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Restore timer from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TIMER_STORAGE_KEY);
      if (stored) {
        const state: TimerState = JSON.parse(stored);
        const now = Date.now();
        const elapsedSec = Math.floor((now - state.startedAt) / 1000);
        if (elapsedSec > 0 && elapsedSec < 86400) {
          startedAtRef.current = state.startedAt;
          setDescription(state.description);
          setProject(state.project);
          setBillable(state.billable);
          setElapsed(elapsedSec);
          setRunning(true);
        } else {
          localStorage.removeItem(TIMER_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Tick the timer
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (startedAtRef.current) {
          setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
        } else {
          setElapsed((prev) => prev + 1);
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Persist running timer state to localStorage
  useEffect(() => {
    if (running && startedAtRef.current) {
      const state: TimerState = {
        startedAt: startedAtRef.current,
        description,
        project,
        billable,
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    }
  }, [running, description, project, billable]);

  const saveTimeEntry = useCallback(async (startMs: number, endMs: number) => {
    const durationMinutes = Math.round((endMs - startMs) / 60000);
    if (durationMinutes < 1) return;

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description || undefined,
          proposal_id: project || undefined,
          start_time: new Date(startMs).toISOString(),
          end_time: new Date(endMs).toISOString(),
          duration_minutes: durationMinutes,
          billable,
        }),
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: `Saved ${durationMinutes} minutes.` });
      } else {
        const data = await response.json().catch(() => ({}));
        setFeedback({ type: 'error', message: data.error ?? 'Failed to save time entry.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Network error saving time entry.' });
    } finally {
      setSaving(false);
    }
  }, [description, project, billable]);

  const handleToggle = async () => {
    if (running) {
      // Stop timer and save
      const endMs = Date.now();
      const startMs = startedAtRef.current ?? endMs - elapsed * 1000;
      setRunning(false);
      localStorage.removeItem(TIMER_STORAGE_KEY);
      await saveTimeEntry(startMs, endMs);
    } else {
      // Start timer
      setFeedback(null);
      const now = Date.now();
      startedAtRef.current = now;
      setElapsed(0);
      setRunning(true);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setDescription('');
    setProject('');
    startedAtRef.current = null;
    setFeedback(null);
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-xl border border-border bg-white px-8 py-10 text-center">
        {/* Timer display */}
        <p className="text-6xl font-semibold tracking-tight text-foreground tabular-nums">
          {formatTime(elapsed)}
        </p>

        {/* Feedback message */}
        {feedback && (
          <p className={`mt-3 text-sm ${feedback.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {feedback.message}
          </p>
        )}

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              running
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-foreground hover:bg-foreground/90'
            }`}
          >
            {saving ? 'Saving...' : running ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="rounded-lg border border-border bg-white px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        {/* Description */}
        <div className="mt-8 text-left">
          <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        {/* Project selector */}
        <div className="mt-4 text-left">
          <label className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5">
            Project
          </label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="">Select a project...</option>
            <option value="general">General</option>
          </select>
        </div>

        {/* Billable toggle */}
        <div className="mt-4 flex items-center justify-between text-left">
          <span className="text-sm font-medium text-foreground">Billable</span>
          <button
            onClick={() => setBillable(!billable)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billable ? 'bg-foreground' : 'bg-bg-tertiary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
