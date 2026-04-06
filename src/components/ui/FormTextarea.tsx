import type { TextareaHTMLAttributes } from 'react';

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Compact uses smaller padding. Defaults to 'default'. */
  inputSize?: 'default' | 'compact';
}

const SIZE_CLASSES = {
  default: 'px-3 py-2',
  compact: 'px-2.5 py-1.5',
} as const;

/**
 * Canonical form textarea atom.
 * Enforces consistent border-radius, border, focus ring, padding, and resize behavior.
 */
export default function FormTextarea({
  inputSize = 'default',
  className = '',
  ...rest
}: FormTextareaProps) {
  return (
    <textarea
      className={`w-full rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none ${SIZE_CLASSES[inputSize]} ${className}`}
      {...rest}
    />
  );
}
