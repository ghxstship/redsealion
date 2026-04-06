import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Compact uses smaller padding. Defaults to 'default'. */
  inputSize?: 'default' | 'compact';
}

const SIZE_CLASSES = {
  default: 'px-3 py-2',
  compact: 'px-2.5 py-1.5',
} as const;

/**
 * Canonical form input atom.
 * Enforces consistent border-radius, border, focus ring, and padding.
 */
export default function FormInput({
  inputSize = 'default',
  className = '',
  ...rest
}: FormInputProps) {
  return (
    <input
      className={`w-full rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 ${SIZE_CLASSES[inputSize]} ${className}`}
      {...rest}
    />
  );
}
