import type { ReactNode } from 'react';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: 'border border-red-500/30 bg-red-500/10 text-red-700',
  warning: 'border border-amber-500/30 bg-amber-500/10 text-amber-700',
  success: 'border border-green-500/30 bg-green-500/10 text-green-700',
  info: 'border border-blue-500/30 bg-blue-500/10 text-blue-700',
};

/**
 * Canonical alert molecule.
 * Replaces 5+ inconsistent error/warning banner patterns.
 */
export default function Alert({ variant = 'error', className = '', children }: AlertProps) {
  return (
    <div className={`rounded-lg px-4 py-3 text-sm ${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </div>
  );
}
