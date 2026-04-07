import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Primary message (e.g., "No tasks yet"). */
  message: string;
  /** Optional secondary description. */
  description?: string;
  /** Optional icon or illustration above the message. */
  icon?: ReactNode;
  /** Optional action button/link rendered below the message. */
  action?: ReactNode;
  /** Additional className overrides. */
  className?: string;
}

/**
 * Canonical empty state atom.
 * Replaces inconsistent dashed-border empty placeholders across entity tables and wizards.
 */
export default function EmptyState({
  message,
  description,
  icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center ${className}`}>
      {icon && <div className="mx-auto mb-3 text-text-muted">{icon}</div>}
      <p className="text-sm font-medium text-text-muted">{message}</p>
      {description && (
        <p className="mt-1 text-xs text-text-muted/70">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
