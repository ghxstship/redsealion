import { forwardRef, type SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Compact uses smaller padding. Defaults to 'default'. */
  inputSize?: 'default' | 'compact';
}

const SIZE_CLASSES = {
  default: 'px-3 py-2',
  compact: 'px-2.5 py-1.5',
} as const;

/**
 * Canonical form select atom.
 * Enforces consistent border-radius, border, focus ring, and padding for all `<select>` elements.
 */
const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect({ inputSize = 'default', className = '', children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 ${SIZE_CLASSES[inputSize]} ${className}`}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export default FormSelect;
