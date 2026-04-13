'use client';

/**
 * Burndown/Burnup chart — visualizes task completion over time.
 *
 * @module components/admin/tasks/BurndownChart
 */

import { useMemo } from 'react';

interface BurndownChartProps {
  tasks: Array<{
    id: string;
    status: string;
    created_at: string;
    completed_at?: string | null;
  }>;
  startDate: string;
  endDate: string;
  mode?: 'burndown' | 'burnup';
}

export default function BurndownChart({
  tasks,
  startDate,
  endDate,
  mode = 'burndown',
}: BurndownChartProps) {
  const chartData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    if (totalDays <= 0) return [];

    const totalTasks = tasks.length;
    const points: Array<{ day: number; label: string; value: number }> = [];

    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(start.getTime() + i * 86400000);
      const dateStr = date.toISOString().split('T')[0];

      if (mode === 'burndown') {
        // Count remaining tasks (not completed by this date)
        const completed = tasks.filter(
          (t) => t.completed_at && t.completed_at.slice(0, 10) <= dateStr,
        ).length;
        points.push({
          day: i,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: totalTasks - completed,
        });
      } else {
        // Burnup: count completed by this date
        const completed = tasks.filter(
          (t) => t.completed_at && t.completed_at.slice(0, 10) <= dateStr,
        ).length;
        points.push({
          day: i,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: completed,
        });
      }
    }

    return points;
  }, [tasks, startDate, endDate, mode]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-bg-secondary/30 px-5 py-8 text-center">
        <p className="text-xs text-text-muted">Not enough data for a chart.</p>
      </div>
    );
  }

  const maxVal = Math.max(...chartData.map((d) => d.value), 1);
  const chartHeight = 160;
  const chartWidth = '100%';

  // Ideal line (linear from total to 0 for burndown, 0 to total for burnup)
  const totalTasks = tasks.length;

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {mode === 'burndown' ? 'Burndown' : 'Burnup'} Chart
        </h3>
        <span className="text-xs text-text-muted">
          {totalTasks} total tasks
        </span>
      </div>

      {/* SVG Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg
          viewBox={`0 0 ${chartData.length * 20} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <line
              key={frac}
              x1="0"
              y1={chartHeight * (1 - frac)}
              x2={chartData.length * 20}
              y2={chartHeight * (1 - frac)}
              stroke="var(--color-border)"
              strokeWidth="0.5"
            />
          ))}

          {/* Ideal line */}
          <line
            x1="0"
            y1={mode === 'burndown' ? 0 : chartHeight}
            x2={chartData.length * 20}
            y2={mode === 'burndown' ? chartHeight : 0}
            stroke="var(--color-text-muted)"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Actual line */}
          <polyline
            fill="none"
            stroke={mode === 'burndown' ? 'var(--color-accent, oklch(0.63 0.21 255))' : 'var(--color-success, oklch(0.72 0.19 155))'}
            strokeWidth="2"
            points={chartData
              .map(
                (d, i) =>
                  `${i * 20 + 10},${chartHeight - (d.value / maxVal) * chartHeight}`,
              )
              .join(' ')}
          />

          {/* Area fill */}
          <polygon
            fill={mode === 'burndown' ? 'color-mix(in oklch, var(--color-accent, oklch(0.63 0.21 255)) 10%, transparent)' : 'color-mix(in oklch, var(--color-success, oklch(0.72 0.19 155)) 10%, transparent)'}
            points={`0,${chartHeight} ${chartData
              .map(
                (d, i) =>
                  `${i * 20 + 10},${chartHeight - (d.value / maxVal) * chartHeight}`,
              )
              .join(' ')} ${(chartData.length - 1) * 20 + 10},${chartHeight}`}
          />
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-text-muted">{chartData[0]?.label}</span>
        {chartData.length > 2 && (
          <span className="text-[10px] text-text-muted">
            {chartData[Math.floor(chartData.length / 2)]?.label}
          </span>
        )}
        <span className="text-[10px] text-text-muted">
          {chartData[chartData.length - 1]?.label}
        </span>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <span
            className={`h-0.5 w-4 ${mode === 'burndown' ? 'bg-blue-500' : 'bg-green-500'}`}
          />
          Actual
        </span>
        <span className="flex items-center gap-1">
          <span className="h-0.5 w-4 bg-text-muted/30 border-b border-dashed border-text-muted" />
          Ideal
        </span>
      </div>
    </div>
  );
}
