'use client';

import { formatCurrency } from '@/lib/utils';

interface BurnChartProps {
  totalBudget: number;
  spent: number;
}

export default function BurnChart({ totalBudget, spent }: BurnChartProps) {
  const remaining = totalBudget - spent;
  const percentUsed = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  // Generate mock monthly burn data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthlySpend = months.map((_, i) => {
    const fraction = (i + 1) / months.length;
    return Math.round(spent * fraction * (0.8 + Math.random() * 0.4));
  });

  const maxSpend = Math.max(...monthlySpend, totalBudget);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Budget Burn-Down</h2>
        <p className="text-xs text-text-secondary mt-1">
          {formatCurrency(remaining)} remaining of {formatCurrency(totalBudget)} total budget
        </p>
      </div>

      <div className="px-6 py-6">
        {/* Simple bar chart */}
        <div className="flex items-end gap-3 h-40">
          {months.map((month, idx) => {
            const height = maxSpend > 0 ? (monthlySpend[idx] / maxSpend) * 100 : 0;
            const overBudget = monthlySpend[idx] > totalBudget;
            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs tabular-nums text-text-muted">
                  {formatCurrency(monthlySpend[idx])}
                </span>
                <div className="w-full relative" style={{ height: '120px' }}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-md transition-[width,height,opacity] ${
                      overBudget ? 'bg-red-400' : 'bg-foreground/80'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted">{month}</span>
              </div>
            );
          })}
        </div>

        {/* Budget line indicator */}
        <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-foreground/80" />
            <span>Cumulative spend</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-6 border-t-2 border-dashed border-red-400" />
            <span>Budget limit ({formatCurrency(totalBudget)})</span>
          </div>
          <span className="ml-auto font-medium">{percentUsed}% consumed</span>
        </div>
      </div>
    </div>
  );
}
