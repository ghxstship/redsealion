import type { ReactNode } from 'react';

type ProgressBarColor = 'blue' | 'green' | 'gradient' | 'purple' | 'amber' | 'red';
type ProgressBarSize = 'xs' | 'sm' | 'md';

interface ProgressBarProps {
  /** Current value (0–max). */
  value: number;
  /** Maximum value. Defaults to 100. */
  max?: number;
  /** Bar color. Defaults to 'blue'. */
  color?: ProgressBarColor;
  /** Track height. Defaults to 'sm'. */
  size?: ProgressBarSize;
  /** Optional label rendered to the right of the bar. */
  label?: ReactNode;
  /** Extra class name on the outer wrapper. */
  className?: string;
}

const COLOR_CLASSES: Record<ProgressBarColor, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  gradient: 'bg-gradient-to-r from-blue-500 to-green-500',
  purple: 'bg-purple-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const SIZE_CLASSES: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
};

/**
 * Canonical ProgressBar atom.
 * Replaces 20+ inline progress bar implementations across the platform.
 */
export default function ProgressBar({
  value,
  max = 100,
  color = 'blue',
  size = 'sm',
  label,
  className = '',
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 overflow-hidden rounded-full bg-bg-secondary ${SIZE_CLASSES[size]}`}>
        <div
          className={`${SIZE_CLASSES[size]} rounded-full transition-all duration-300 ${COLOR_CLASSES[color]}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {label && <span className="shrink-0 text-xs tabular-nums text-text-muted">{label}</span>}
    </div>
  );
}
