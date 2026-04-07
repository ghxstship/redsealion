import { forwardRef, type TextareaHTMLAttributes } from 'react';

export interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
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
const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ inputSize = 'default', className = '', ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none ${SIZE_CLASSES[inputSize]} ${className}`}
        {...rest}
      />
    );
  },
);

export default FormTextarea;
