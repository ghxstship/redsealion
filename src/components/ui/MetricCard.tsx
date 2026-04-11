import type { ReactNode } from 'react';

interface MetricCardProps {
  /** Metric label shown above the value. */
  label: string;
  /** The primary metric value. */
  value: string | number;
  /** Optional sublabel shown below the value. */
  sublabel?: string;
  /** Optional icon or extra content rendered to the right of the value. */
  trailing?: ReactNode;
  /** Extra CSS class. */
  className?: string;
}

/**
 * Canonical MetricCard atom.
 * Replaces 15+ inline stat card implementations across advancing, assets, budgets, and other hubs.
 */
export default function MetricCard({
  label,
  value,
  sublabel,
  trailing,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-background p-4 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {trailing}
      </div>
      {sublabel && (
        <p className="mt-1 text-xs text-text-secondary">{sublabel}</p>
      )}
    </div>
  );
}
