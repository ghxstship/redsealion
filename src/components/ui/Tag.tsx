import type { ReactNode } from 'react';

/**
 * Canonical tag/chip component — L-03 remediation.
 * Replaces inline pill/chip patterns for skills, certifications, merge fields, etc.
 */

type TagVariant = 'default' | 'info' | 'mono';

const VARIANT_CLASSES: Record<TagVariant, string> = {
  default: 'bg-bg-secondary text-text-secondary',
  info: 'bg-blue-50 text-blue-700',
  mono: 'bg-bg-secondary text-text-muted font-mono',
};

interface TagProps {
  children: ReactNode;
  variant?: TagVariant;
  className?: string;
}

export default function Tag({ children, variant = 'default', className = '' }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
