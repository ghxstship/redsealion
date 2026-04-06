import type { ReactNode } from 'react';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: 'bg-red-50 text-red-700',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-green-50 text-green-700',
  info: 'bg-blue-50 text-blue-700',
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
