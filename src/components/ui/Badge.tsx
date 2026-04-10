import { formatLabel } from '@/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-bg-secondary text-text-secondary',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  muted: 'bg-bg-secondary text-text-muted',
};

interface BadgeProps {
  /** Text content. Auto-formatted from snake_case to Title Case. */
  children: string;
  /** Badge color variant. */
  variant?: BadgeVariant;
  /** Optional custom className override (replaces variant). */
  colorClass?: string;
  /** Additional className. */
  className?: string;
}

/**
 * Canonical Badge atom.
 * Use for inline labels, tags, and lightweight status indicators.
 * For entity-specific status badges backed by color registries, use StatusBadge instead.
 */
export function Badge({
  children,
  variant = 'default',
  colorClass,
  className = '',
}: BadgeProps) {
  const color = colorClass ?? VARIANT_CLASSES[variant];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${color} ${className}`}
    >
      {formatLabel(children)}
    </span>
  );
}
