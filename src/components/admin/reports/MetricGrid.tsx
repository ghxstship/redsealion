'use client';

interface Metric {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

interface MetricGridProps {
  metrics: Metric[];
}

export default function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-border bg-white p-5"
        >
          <p className="text-xs text-text-muted">{metric.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {metric.value}
          </p>
          {metric.change && (
            <p
              className={`mt-1 text-xs font-medium ${
                metric.changeType === 'positive'
                  ? 'text-green-600'
                  : metric.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-text-muted'
              }`}
            >
              {metric.change}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
