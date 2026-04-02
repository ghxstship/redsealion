'use client';

import { useState, useEffect, useRef } from 'react';

export default function TimerWidget() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [project, setProject] = useState('');
  const [billable, setBillable] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (running) {
      setRunning(false);
    } else {
      setElapsed(0);
      setRunning(true);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setElapsed(0);
    setDescription('');
    setProject('');
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-xl border border-border bg-white px-8 py-10 text-center">
        {/* Timer display */}
        <p className="text-6xl font-semibold tracking-tight text-foreground tabular-nums">
          {formatTime(elapsed)}
        </p>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={handleToggle}
            className={`rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors ${
              running
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-foreground hover:bg-foreground/90'
            }`}
          >
            {running ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-border bg-white px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
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
