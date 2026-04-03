'use client';

import { formatCurrency } from '@/lib/utils';

interface MarginChartProps {
  revenue: number;
  costs: number;
  categories: Array<{ category: string; amount: number }>;
}

export default function MarginChart({ revenue, costs, categories }: MarginChartProps) {
  const margin = revenue - costs;
  const marginPercent = revenue > 0 ? Math.round((margin / revenue) * 100) : 0;
  const maxVal = Math.max(revenue, costs);

  const revenueWidth = maxVal > 0 ? (revenue / maxVal) * 100 : 0;
  const costsWidth = maxVal > 0 ? (costs / maxVal) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Margin Analysis</h2>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Revenue bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Revenue</span>
            <span className="text-sm font-medium tabular-nums text-foreground">{formatCurrency(revenue)}</span>
          </div>
          <div className="h-8 rounded-lg bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-lg bg-green-500 transition-[width,opacity]"
              style={{ width: `${revenueWidth}%` }}
            />
          </div>
        </div>

        {/* Costs bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Costs</span>
            <span className="text-sm font-medium tabular-nums text-foreground">{formatCurrency(costs)}</span>
          </div>
          <div className="h-8 rounded-lg bg-bg-secondary overflow-hidden">
            <div
              className="h-full rounded-lg bg-red-400 transition-[width,opacity]"
              style={{ width: `${costsWidth}%` }}
            />
          </div>
        </div>

        {/* Cost category breakdown */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => {
              const percent = costs > 0 ? Math.round((cat.amount / costs) * 100) : 0;
              return (
                <div
                  key={cat.category}
                  className="rounded-lg border border-border px-3 py-2"
                >
                  <p className="text-xs text-text-muted capitalize">{cat.category}</p>
                  <p className="text-sm font-medium tabular-nums text-foreground">{formatCurrency(cat.amount)}</p>
                  <p className="text-xs text-text-secondary">{percent}% of costs</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Margin indicator */}
        <div className={`rounded-lg px-4 py-3 ${margin >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-sm font-medium text-foreground">
            Net Margin: {formatCurrency(margin)} ({marginPercent}%)
          </p>
        </div>
      </div>
    </div>
  );
}
