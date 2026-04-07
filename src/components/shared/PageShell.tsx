import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  /** Additional className overrides (e.g., max-w constraints). */
  className?: string;
}

/**
 * Canonical admin page shell wrapper.
 * Enforces consistent px-6 py-6 space-y-6 padding across all admin pages.
 */
export default function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <div className={`px-6 py-6 space-y-6 ${className}`}>
      {children}
    </div>
  );
}
